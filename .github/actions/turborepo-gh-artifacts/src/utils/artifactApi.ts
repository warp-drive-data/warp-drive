import { getInput } from '@actions/core';
import { Axios } from 'axios';
import { Inputs } from './constants';

export interface IArtifactListResponse {
  total_count: number;
  artifacts?: Array<IArtifactResponse>;
}

export interface IArtifactResponse {
  id: number;
  node_id: string;
  name: string;
  size_in_bytes: number;
  url: string;
  archive_download_url: string;
  expired: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

class ArtifactApi {
  private axios: Axios;

  constructor() {
    const repoToken = getInput(Inputs.REPO_TOKEN, {
      required: true,
      trimWhitespace: true,
    });

    this.axios = new Axios({
      baseURL: `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/actions`,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${repoToken}`,
      },
    });
  }

  listArtifacts(filter: Partial<{ name: string }> = {}): Promise<IArtifactListResponse> {
    return this.axios
      .get('/artifacts', { params: { per_page: 100, ...filter } })
      .then((response) => JSON.parse(response.data));
  }

  // GitHub's list-artifacts REST endpoint can lag behind a just-finalized
  // upload by anywhere from tens of milliseconds to a few seconds -- an
  // artifact that's already downloadable by id can still be absent from
  // this list for a short window. A single lookup right after upload can
  // therefore get a false "not found", which without retrying looks
  // identical to the artifact genuinely never having been written.
  async findArtifactByName(
    name: string,
    { retries = 3, initialDelayMs = 250 }: { retries?: number; initialDelayMs?: number } = {},
  ): Promise<IArtifactResponse | undefined> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const artifactList = await this.listArtifacts({ name });

      if (!Array.isArray(artifactList.artifacts)) {
        console.log('Got an error from GitHub: ', JSON.stringify(artifactList, null, 2));
        return undefined;
      }

      const found = artifactList.artifacts.find((artifact) => artifact.name === name);
      if (found) {
        return found;
      }

      if (attempt < retries) {
        const delayMs = initialDelayMs * 2 ** attempt;
        console.log(
          `Artifact ${name} not yet visible via list-artifacts (attempt ${attempt + 1}/${retries + 1}), retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return undefined;
  }

  downloadArtifact(artifactId) {
    return this.axios.get(`/artifacts/${artifactId}/zip`, {
      responseType: 'stream',
    });
  }
}

export const artifactApi = new ArtifactApi();

import { DefaultArtifactClient } from '@actions/artifact';
import { debug, info } from '@actions/core';
import fs from 'fs-extra';
import path from 'path';
import { cacheDir, newArtifactsDirName } from './constants';

export async function uploadArtifacts() {
  const client = new DefaultArtifactClient();
  const newArtifactsDir = path.join(cacheDir, newArtifactsDirName);

  fs.ensureDirSync(newArtifactsDir);

  const files = fs.readdirSync(newArtifactsDir);

  const artifactFiles = files.filter((filename) => filename.endsWith('.gz'));

  debug(`Artifact files: ${JSON.stringify(artifactFiles, null, 2)}`);

  const artifactsToUpload = artifactFiles.map((artifactFilename) => {
    const artifactId = path.basename(
      artifactFilename,
      path.extname(artifactFilename),
    );

    return { artifactFilename, artifactId };
  });

  if (artifactsToUpload.length === 0) {
    info(`There is nothing to upload.`);

    return;
  }

  info(`Going to upload ${artifactsToUpload.length} artifacts:`);
  info(
    JSON.stringify(
      artifactsToUpload.map(({ artifactId }) => artifactId),
      null,
      2,
    ),
  );

  await Promise.all(
    artifactsToUpload.map(async ({ artifactFilename, artifactId }) => {
      info(`Uploading ${artifactFilename}`);

      try {
        await client.uploadArtifact(
          artifactId,
          [path.join(newArtifactsDir, artifactFilename)],
          newArtifactsDir,
        );
        info(`Uploaded ${artifactFilename} successfully`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('(409) Conflict:')) {
          // An artifact with the same hash must have been already uploaded by another job running in parallel
          info(`Artifact ${artifactFilename} already exists on GitHub, skipping...`);
          return;
        }
        throw error;
      }
      try {
        await fs.move(path.join(newArtifactsDir, artifactFilename), path.join(cacheDir, artifactFilename))
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          info(`Artifact ${artifactFilename} already exists locally, skipping...`);
          return;
        }
        throw error;
      }
    }),
  );
}

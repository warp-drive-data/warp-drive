import { getInput, setFailed } from '@actions/core';
import * as console from 'console';
import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { artifactApi, IArtifactResponse } from './utils/artifactApi';
import { cacheDir, DEFAULT_PORT, Inputs, newArtifactsDirName } from './utils/constants';
import { downloadArtifact } from './utils/downloadArtifact';

async function startServer() {
  const port = process.env.PORT || DEFAULT_PORT;

  fs.ensureDirSync(cacheDir);

  const app = express();
  const serverToken =
    process.env.TURBO_TOKEN ||
    getInput(Inputs.SERVER_TOKEN, {
      required: true,
      trimWhitespace: true,
    });

  const cacheMap = new Map<string, IArtifactResponse>();

  app.all('/{*path}', (req, res, next) => {
    console.info(`Got a ${req.method} request`, req.path);
    const { authorization = '' } = req.headers;
    const [type = '', token = ''] = authorization.split(' ');

    if (type !== 'Bearer' || token !== serverToken) {
      return res.status(401).send('unauthorized');
    }

    next();
  });

  app.get('/v8/artifacts/status', (req, res) => {
    res.status(200).json({
      status: 'enabled',
    });
  });

  app.get('/v8/artifacts/:artifactId', async (req: any, res: any) => {
    const { artifactId } = req.params;

    const filepath = path.join(cacheDir, `${artifactId}.gz`);

    if (fs.pathExistsSync(filepath)) {
      console.log(`Artifact ${artifactId} found locally.`);
    } else {
      console.log(`Artifact ${artifactId} not found locally, attempting to download it.`);

      let existingArtifact: IArtifactResponse | undefined;
      if (cacheMap.has(artifactId)) {
        existingArtifact = cacheMap.get(artifactId);
      } else {
        existingArtifact = await artifactApi.findArtifactByName(artifactId);
      }

      if (existingArtifact) {
        cacheMap.set(artifactId, existingArtifact);

        if (existingArtifact.expired) {
          console.log(`Artifact ${artifactId} expired at ${existingArtifact.expires_at}, not downloading.`);
        } else {
          console.log(`Artifact ${artifactId} found.`);
          await downloadArtifact(existingArtifact, cacheDir);
        }
      }

      if (!fs.pathExistsSync(filepath)) {
        console.log(`Artifact ${artifactId} not present.`);
        return res.status(404).send('Not found');
      }
    }

    const readStream = fs.createReadStream(filepath);
    readStream.on('open', () => {
      readStream.pipe(res);
    });

    readStream.on('error', (error) => {
      console.error(error);
      res.end(error);
    });
  });

  app.put('/v8/artifacts/:artifactId', (req, res) => {
    const artifactId = req.params.artifactId;
    const filename = `${artifactId}.gz`;
    // turborepo doesn't calls the put method for existing artifacts, so, we save new cache artifacts inside a folder
    // and in post.js we will upload only them
    const newArtifactsDir = path.join(cacheDir, newArtifactsDirName);
    fs.ensureDirSync(newArtifactsDir);

    const writeStream = fs.createWriteStream(path.join(newArtifactsDir, filename));

    req.pipe(writeStream);

    writeStream.on('error', (error) => {
      console.error(error);
      res.status(500).send('ERROR');
    });

    req.on('end', () => {
      res.send('OK');
    });
  });

  app.post('/v8/artifacts/events', (req, res) => {
    // Analytics endpoint, just ignore it
    res.status(200).send();
  });

  app.disable('etag').listen(port, () => {
    console.log(`Cache dir: ${cacheDir}`);
    console.log(`Local Turbo server is listening at http://127.0.0.1:${port}`);
  });
}

startServer().catch((error) => {
  setFailed(error);
});

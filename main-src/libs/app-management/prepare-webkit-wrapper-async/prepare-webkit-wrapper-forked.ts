/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// set this event as soon as possible in the process
process.on('uncaughtException', (e) => {
  process.send({
    error: {
      name: e.name,
      message: e.message,
      stack: e.stack,
    },
  });
  process.exit(1);
});

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');
const { Readable, Transform } = require('stream');
const { pipeline } = require('stream/promises');

const customizedFetch = require('../../customized-fetch');
const formatBytes = require('../../format-bytes');
const parseArgs = require('../../parse-args');

const argv = parseArgs(['appVersion', 'tagName', 'templateInfoJson', 'cacheRoot']);
const { appVersion, tagName, templateInfoJson, cacheRoot } = argv;

const cachePath = path.join(cacheRoot, 'webkit-wrapper');
const templateZipPath = path.join(cachePath, 'template.zip');
const templateJsonPath = path.join(cachePath, 'template.json');
const sha256FileSync = (filePath) =>
  crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
const getNodeReadableStream = (body) => {
  if (typeof body.pipe === 'function') return body;
  return Readable.fromWeb(body);
};

const downloadTemplateZipAsync = async (url, templateInfo) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download template ${templateInfo.version}: ${response.status} ${response.statusText}`,
    );
  }
  if (!response.body) {
    throw new Error(`Failed to download template ${templateInfo.version}: empty response body`);
  }

  const totalLength = Number(response.headers.get('content-length')) || 0;
  let downloadedLength = 0;
  let lastUpdated = Date.now();
  const progressStream = new Transform({
    transform(chunk, encoding, callback) {
      downloadedLength += chunk.length;
      // downloading template takes about 20% of the total installation time
      const currentTime = Date.now();
      // send every 2s to avoid too many rerendering
      if (currentTime - lastUpdated > 2000) {
        const progressDesc = totalLength
          ? `Downloading template ${templateInfo.version} (${formatBytes(downloadedLength)}/${formatBytes(totalLength)})...`
          : `Downloading template ${templateInfo.version} (${formatBytes(downloadedLength)})...`;
        process.send({
          progress: {
            percent: totalLength ? Math.round((downloadedLength / totalLength) * 20) : 10,
            desc: progressDesc,
          },
        });
        lastUpdated = currentTime;
      }
      callback(null, chunk);
    },
  });

  await pipeline(
    getNodeReadableStream(response.body),
    progressStream,
    fs.createWriteStream(templateZipPath),
  );
};

Promise.resolve()
  .then(() => fs.ensureDir(cachePath))
  .then(() => {
    if (templateInfoJson) {
      return JSON.parse(templateInfoJson);
    }

    return customizedFetch(
      `https://github.com/webcatalog/webkit-wrapper/releases/download/${tagName}/template-macos.json`,
    ).then((res) => res.json());
  })
  .then((templateInfo) =>
    Promise.resolve()
      .then(() => {
        process.send({
          templateInfo,
        });

        if (semver.lt(appVersion, templateInfo.minimumChromelessVersion)) {
          return Promise.reject(
            new Error('Chromeless is outdated. Please update Chromeless first to continue.'),
          );
        }

        // return shouldDownload
        if (fs.pathExistsSync(templateZipPath)) {
          const localSha256 = sha256FileSync(templateZipPath);
          return localSha256 !== templateInfo.sha256;
        }

        return true;
      })
      .then((shouldDownload) => {
        if (shouldDownload) {
          process.send({
            progress: {
              percent: 10,
              desc: `Downloading WebKit Wrapper (${templateInfo.version})...`,
            },
          });
          console.log(`Downloading template code zip to ${templateZipPath}...`); // eslint-disable-line no-console
          return fs
            .remove(templateZipPath)
            .then(() => {
              const url = templateInfo.downloadUrl;
              return downloadTemplateZipAsync(url, templateInfo);
            })
            .then(() => sha256FileSync(templateZipPath))
            .then((sha256) => {
              if (sha256 !== templateInfo.sha256) {
                return Promise.reject(
                  new Error('Downloaded template code zip is corrupted (validated with SHA256).'),
                );
              }
              return null;
            });
        }
        return null;
      })
      .then(() => fs.writeJSON(templateJsonPath, templateInfo)),
  )
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    process.send({
      error: {
        name: e.name,
        message: e.message,
        stack: e.stack,
      },
    });
    process.exit(1);
  });

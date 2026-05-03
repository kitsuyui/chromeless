/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const path = require('path');
const semver = require('semver');
const NodeCache = require('node-cache');
const { fork } = require('child_process');
const { app } = require('electron');
const envPaths = require('env-paths');

const customizedFetch = require('../../customized-fetch');
const sendToAllWindows = require('../../send-to-all-windows');
const { getPreference } = require('../../preferences');

// force re-extract for first installation after launch
global.forceExtract = true;

const cache = new NodeCache();

const webkitWrapperReleasesUrl = 'https://api.github.com/repos/webcatalog/webkit-wrapper/releases';

const getReleaseVersion = (release) => semver.clean(release.tag_name || release.name || '');

const getTagNameAsync = () => {
  const allowPrerelease = getPreference('allowPrerelease');

  return customizedFetch(webkitWrapperReleasesUrl)
    .then((res) => res.json())
    .then((releases) => {
      const version = releases
        .filter((release) => !release.draft && (allowPrerelease || !release.prerelease))
        .map(getReleaseVersion)
        .filter(Boolean)
        .sort(semver.rcompare)[0];
      if (!version) throw new Error('Unable to find a WebKit Wrapper release.');
      return version;
    })
    .then((version) => `v${version}`);
};

const downloadTemplateAsync = (tagName) =>
  new Promise((resolve, reject) => {
    const cacheRoot = envPaths('chromeless', {
      suffix: '',
    }).cache;

    let latestTemplateVersion = '0.0.0';
    const scriptPath = path
      .join(__dirname, 'prepare-webkit-wrapper-forked.js')
      .replace('app.asar', 'app.asar.unpacked');

    const args = [
      '--appVersion',
      app.getVersion(),
      '--cacheRoot',
      cacheRoot,
      '--platform',
      process.platform,
      '--arch',
      process.arch,
      '--tagName',
      tagName,
    ];

    const cachedTemplateInfoJson = cache.get(`templateInfoJson.${tagName}`);
    if (cachedTemplateInfoJson) {
      args.push('--templateInfoJson');
      args.push(cachedTemplateInfoJson);
    }

    const child = fork(scriptPath, args, {
      env: {
        ELECTRON_RUN_AS_NODE: 'true',
        ELECTRON_NO_ASAR: 'true',
        APPDATA: app.getPath('appData'),
        FORCE_EXTRACT: Boolean(global.forceExtract).toString(),
      },
    });

    let err = null;
    child.on('message', (message) => {
      if (message && message.templateInfo) {
        latestTemplateVersion = message.templateInfo.version;
        // cache template info for the tag name indefinitely (until app is quitted)
        cache.set(`templateInfoJson.${tagName}`, JSON.stringify(message.templateInfo));
      } else if (message && message.progress) {
        sendToAllWindows('update-installation-progress', message.progress);
      } else if (message && message.error) {
        err = new Error(message.error.message);
        err.stack = message.error.stack;
        err.name = message.error.name;
      } else {
        console.log(message); // eslint-disable-line no-console
      }
    });

    child.on('exit', (code) => {
      if (code === 1) {
        reject(err || new Error('Forked script failed to run correctly.'));
        return;
      }

      // // extracting template code successful so need to re-extract next time
      global.forceExtract = false;

      resolve(latestTemplateVersion);
    });
  });

const prepareWebkitWrapperAsync = () => {
  if (process.platform !== 'darwin') {
    return Promise.reject(new Error('Unsupported platform'));
  }
  return getTagNameAsync().then((tagName) => downloadTemplateAsync(tagName));
};

module.exports = prepareWebkitWrapperAsync;

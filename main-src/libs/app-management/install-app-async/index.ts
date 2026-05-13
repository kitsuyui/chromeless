/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
/* eslint-disable prefer-destructuring */
const path = require('path');
const { fork } = require('child_process');
const { app } = require('electron');
const envPaths = require('env-paths');

const { getPreferences } = require('../../preferences');
const sendToAllWindows = require('../../send-to-all-windows');
const getEngineInfo = require('./get-engine-info');
const getEngineAppPath = require('./get-engine-app-path');
const packageJson = require('../../../../package.json');

const isEngineInstalled = (engine) => {
  if (getEngineAppPath(engine, app.getPath('home'))) {
    return true;
  }

  return false;
};

const assertEngineInstalled = (engine) => {
  if (isEngineInstalled(engine)) return;

  const engineInfo = getEngineInfo(engine);
  const engineName = engineInfo ? engineInfo.name : 'Browser';
  throw new Error(`${engineName} is not installed.`);
};

const getHelperPath = (url) => {
  // the helper extension for apps has window management logic, but that logic prevents users from
  // opening new windows in browser instances. See upstream issue #88 for context.
  const helperDirName = url != null ? 'chromeless-helper' : 'chromeless-helper-browser-instances';

  if (process.env.NODE_ENV === 'production') {
    return path.resolve(__dirname, helperDirName).replace('app.asar', 'app.asar.unpacked');
  }

  return path.resolve(__dirname, '..', '..', '..', '..', 'public', helperDirName);
};

const buildForkParams = ({
  cacheRoot,
  engine,
  icon,
  id,
  installationPath,
  name,
  opts,
  requireAdmin,
  url,
}) => {
  const params = [
    '--engine',
    engine,
    '--id',
    id,
    '--name',
    name,
    '--icon',
    icon,
    '--opts',
    JSON.stringify(opts),
    '--helperPath',
    getHelperPath(url),
    '--homePath',
    app.getPath('home'),
    '--appDataPath',
    app.getPath('appData'),
    '--installationPath',
    installationPath,
    '--requireAdmin',
    requireAdmin.toString(),
    '--username',
    process.env.USER, // required by sudo-prompt
    '--cacheRoot',
    cacheRoot,
  ];

  if (url != null) {
    params.push('--url');
    params.push(url);
  }

  return params;
};

const toForkError = (message) => {
  const err = new Error(message.error.message);
  err.stack = message.error.stack;
  err.name = message.error.name;
  return err;
};

const installAppAsync = (engine, id, name, url, icon, _opts = {}) => {
  let v = '0.0.0'; // app version
  let scriptFileName = null;

  const opts = { ..._opts };

  const { installationPath, requireAdmin } = getPreferences();

  const cacheRoot = envPaths('chromeless', {
    suffix: '',
  }).cache;

  return Promise.resolve()
    .then(() => {
      sendToAllWindows('update-installation-progress', {
        percent: 0,
        desc: null,
      });

      // use v2 script on macOS
      scriptFileName = 'install-app-forked-lite-v2.js';
      v = packageJson.scriptVersion;

      return null;
    })
    .then(
      async () =>
        new Promise<void>((resolve, reject) => {
          try {
            assertEngineInstalled(engine);
          } catch (error) {
            reject(error);
            return;
          }

          const params = buildForkParams({
            cacheRoot,
            engine,
            icon,
            id,
            installationPath,
            name,
            opts,
            requireAdmin,
            url,
          });

          const scriptPath = path
            .join(__dirname, scriptFileName)
            .replace('app.asar', 'app.asar.unpacked');
          const child = fork(scriptPath, params, {
            env: {
              ELECTRON_RUN_AS_NODE: 'true',
              ELECTRON_NO_ASAR: 'true',
              APPDATA: app.getPath('appData'),
            },
          });

          let err = null;
          child.on('message', (message) => {
            if (message && message.progress) {
              sendToAllWindows('update-installation-progress', message.progress);
            } else if (message && message.error) {
              err = toForkError(message);
            } else {
              console.log(message); // eslint-disable-line no-console
            }
          });

          child.on('exit', (code) => {
            if (code !== 0 || err !== null) {
              reject(err || new Error('Forked script failed to run correctly.'));
              return;
            }

            // installation done
            sendToAllWindows('update-installation-progress', {
              percent: 100,
              desc: null,
            });

            resolve();
          });
        }),
    )
    .then(() => ({
      engine,
      id,
      name,
      url,
      icon,
      version: v,
      opts,
    }));
};

module.exports = installAppAsync;

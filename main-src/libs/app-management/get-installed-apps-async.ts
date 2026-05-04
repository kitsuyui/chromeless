/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { app } = require('electron');
const path = require('path');
const fsExtra = require('fs-extra');

const { getPreference } = require('../preferences');
const sendToAllWindows = require('../send-to-all-windows');

const getInstalledAppPaths = (installationPath, fileName) => {
  const resourcesPath = path.join(installationPath, fileName, 'Contents', 'Resources');
  const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked');

  return {
    appJsonPath: path.join(unpackedPath, 'build', 'app.json'),
    iconPath: path.join(unpackedPath, 'build', 'icon.png'),
    packageJsonPath: path.join(unpackedPath, 'package.json'),
  };
};

const readPackageVersion = (packageJsonPath) => {
  if (!fsExtra.pathExistsSync(packageJsonPath)) return '0.0.0';

  try {
    return fsExtra.readJSONSync(packageJsonPath).version;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return '0.0.0';
  }
};

const readInstalledApp = (installationPath, fileName) => {
  const { appJsonPath, iconPath, packageJsonPath } = getInstalledAppPaths(
    installationPath,
    fileName,
  );
  if (!fsExtra.pathExistsSync(appJsonPath)) return null;

  const appJson = fsExtra.readJSONSync(appJsonPath);
  return Object.assign(appJson, {
    version: readPackageVersion(packageJsonPath),
    icon: fsExtra.pathExistsSync(iconPath) ? iconPath : null,
    engine: appJson.engine,
    status: 'INSTALLED',
    lastUpdated: Math.floor(fsExtra.statSync(appJsonPath).mtimeMs),
  });
};

const getInstalledAppsAsync = () => {
  sendToAllWindows('clean-app-management');

  const installationPath = getPreference('installationPath').replace('~', app.getPath('home'));

  return Promise.resolve()
    .then(() => {
      const apps = [];

      if (fsExtra.pathExistsSync(installationPath)) {
        return fsExtra
          .readdir(installationPath, { withFileTypes: true })
          .then((files) => {
            files.forEach((file) => {
              if (!file.isDirectory()) return;
              const installedApp = readInstalledApp(installationPath, file.name);
              if (installedApp) apps.push(installedApp);
            });
          })
          .then(() => apps);
      }

      return apps;
    })
    .then((apps) => {
      sendToAllWindows('set-app-batch', apps);
      sendToAllWindows('set-scanning-for-installed', false);
    });
};

module.exports = getInstalledAppsAsync;

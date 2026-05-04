/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { app } = require('electron');
const fsExtra = require('fs-extra');

const { getPreference } = require('../preferences');
const sendToAllWindows = require('../send-to-all-windows');
const { readInstalledApp } = require('./installed-app-reader');

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

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { app } = require('electron');

const { getPreference } = require('../preferences');
const sendToAllWindows = require('../send-to-all-windows');
const { resolveInstallationPath } = require('./installation-path');
const { getInstalledAppsFromDirectory } = require('./installed-app-scanner');

const getInstalledAppsAsync = () => {
  sendToAllWindows('clean-app-management');

  const installationPath = resolveInstallationPath(
    getPreference('installationPath'),
    app.getPath('home'),
  );

  return Promise.resolve()
    .then(() => getInstalledAppsFromDirectory(installationPath))
    .then((apps) => {
      sendToAllWindows('set-app-batch', apps);
      sendToAllWindows('set-scanning-for-installed', false);
    });
};

module.exports = getInstalledAppsAsync;

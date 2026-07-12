/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { app } = require('electron');

const { getPreference } = require('../preferences');
const sendToAllWindows = require('../ipc/send-to-all-windows');
const { getInstalledAppsFromDirectory } = require('./installed-app-scanner');
const { runInstalledAppScan } = require('./installed-app-scan');

const getInstalledAppsAsync = () =>
  runInstalledAppScan({
    getHomePath: () => app.getPath('home'),
    getInstallationPreference: () => getPreference('installationPath'),
    getInstalledApps: getInstalledAppsFromDirectory,
    send: sendToAllWindows,
  });

module.exports = getInstalledAppsAsync;

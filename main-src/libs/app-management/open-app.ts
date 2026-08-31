/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { app, shell } = require('electron');

const { getPreference } = require('../preferences');
const { getInstalledAppBundlePath } = require('./installation-path');

const openApp = (id, _name) => {
  const appPath = getInstalledAppBundlePath({
    appId: id,
    homePath: app.getPath('home'),
    installationPath: getPreference('installationPath'),
  });
  shell.openPath(appPath);
};

module.exports = openApp;

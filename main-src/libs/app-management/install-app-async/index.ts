/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const path = require('path');
const { fork } = require('child_process');
const { app } = require('electron');
const envPaths = require('env-paths');

const { getPreferences } = require('../../preferences/index');
const sendToAllWindows = require('../../ipc/send-to-all-windows');
const getEngineInfo = require('./get-engine-info');
const getEngineAppPath = require('./get-engine-app-path');
const { createInstallAppAsync } = require('./install-app-async-core');
const packageJson = require('../../../../package.json');

module.exports = createInstallAppAsync({
  app,
  envPaths,
  fork,
  getEngineAppPath,
  getEngineInfo,
  getPreferences,
  packageJson,
  path,
  sendToAllWindows,
});

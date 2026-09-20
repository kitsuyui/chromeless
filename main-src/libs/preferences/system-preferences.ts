/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// System Preferences are not stored in storage but stored in macOS Preferences.
// It can be retrieved and changed using Electron APIs

const { app } = require('electron');

const sendToAllWindows = require('../ipc/send-to-all-windows');

import { createSetSystemPreference } from './system-preference-setter';

const getSystemPreference = (name) => {
  switch (name) {
    case 'openAtLogin': {
      const loginItemSettings = app.getLoginItemSettings();
      const { openAtLogin, openAsHidden } = loginItemSettings;
      if (openAtLogin && openAsHidden) return 'yes-hidden';
      if (openAtLogin) {
        return 'yes';
      }
      return 'no';
    }
    default: {
      return null;
    }
  }
};

const getSystemPreferences = () => ({
  openAtLogin: getSystemPreference('openAtLogin'),
});

const setSystemPreference = createSetSystemPreference(app, sendToAllWindows);

module.exports = {
  getSystemPreference,
  getSystemPreferences,
  setSystemPreference,
};

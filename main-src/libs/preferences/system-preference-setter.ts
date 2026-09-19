/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
export const createSetSystemPreference = (app, sendToAllWindows) => (name, value) => {
  if (typeof value !== 'string') return;

  switch (name) {
    case 'openAtLogin': {
      app.setLoginItemSettings({
        openAtLogin: value.startsWith('yes'),
        openAsHidden: value === 'yes-hidden',
      });
      break;
    }
    default: {
      break;
    }
  }
  sendToAllWindows('set-system-preference', name, value);
};

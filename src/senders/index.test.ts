/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PreferenceKey } from './index';
import {
  enqueueRequestRestartSnackbar,
  getPreference,
  getPreferences,
  getShouldUseDarkColors,
  getSystemPreference,
  getSystemPreferences,
  requestCancelInstallApp,
  requestCancelUpdateApp,
  requestCheckForUpdates,
  requestGetInstalledApps,
  requestInstallApp,
  requestOpenApp,
  requestOpenInBrowser,
  requestOpenInstallLocation,
  requestQuit,
  requestResetPreferences,
  requestRestart,
  requestSetPreference,
  requestSetSystemPreference,
  requestShowAppMenu,
  requestShowMessageBox,
  requestUninstallApp,
  requestUpdateApp,
} from './index';

// @ts-expect-error invalid preference keys should be rejected by the sender surface.
const invalidPreferenceKey: PreferenceKey = 'theme';
void invalidPreferenceKey;

const ipcRenderer = {
  emit: vi.fn(),
  send: vi.fn(),
  sendSync: vi.fn(),
};

type SenderCase = [sender: (...args: unknown[]) => unknown, args: unknown[], expected: unknown[]];
type ReaderCase = [
  reader: (...args: unknown[]) => unknown,
  args: unknown[],
  expected: unknown[],
  value: unknown,
];

beforeEach(() => {
  vi.stubGlobal('window', { ipcRenderer });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('senders', () => {
  it('emits snackbar events through ipcRenderer', () => {
    enqueueRequestRestartSnackbar();

    expect(ipcRenderer.emit).toHaveBeenCalledWith('enqueue-request-restart-snackbar');
  });

  it.each<SenderCase>([
    [
      requestOpenInBrowser,
      ['https://example.com'],
      ['request-open-in-browser', 'https://example.com'],
    ],
    [requestShowMessageBox, ['Message', 'error'], ['request-show-message-box', 'Message', 'error']],
    [requestQuit, [], ['request-quit']],
    [requestCheckForUpdates, [true], ['request-check-for-updates', true]],
    [requestShowAppMenu, [10, 20], ['request-show-app-menu', 10, 20]],
    [requestRestart, [], ['request-restart']],
    [requestSetPreference, ['theme', 'dark'], ['request-set-preference', 'theme', 'dark']],
    [requestResetPreferences, [], ['request-reset-preferences']],
    [requestOpenInstallLocation, [], ['request-open-install-location']],
    [
      requestSetSystemPreference,
      ['hardwareAcceleration', true],
      ['request-set-system-preference', 'hardwareAcceleration', true],
    ],
    [requestGetInstalledApps, [], ['request-get-installed-apps']],
    [
      requestInstallApp,
      ['chrome', 'mail', 'Mail', 'https://mail.example', 'icon.png', { category: 'Mail' }],
      [
        'request-install-app',
        'chrome',
        'mail',
        'Mail',
        'https://mail.example',
        'icon.png',
        {
          category: 'Mail',
        },
      ],
    ],
    [
      requestUpdateApp,
      ['chrome', 'mail', 'Mail', null, 'icon.png', { category: 'Mail' }],
      ['request-update-app', 'chrome', 'mail', 'Mail', null, 'icon.png', { category: 'Mail' }],
    ],
    [requestCancelInstallApp, ['mail'], ['request-cancel-install-app', 'mail']],
    [requestCancelUpdateApp, ['mail'], ['request-cancel-update-app', 'mail']],
    [
      requestUninstallApp,
      ['chrome', 'mail', 'Mail'],
      ['request-uninstall-app', 'chrome', 'mail', 'Mail'],
    ],
    [requestOpenApp, ['mail', 'Mail'], ['request-open-app', 'mail', 'Mail']],
  ])('sends %s through ipcRenderer', (sender, args, expected) => {
    sender(...args);

    expect(ipcRenderer.send).toHaveBeenCalledWith(...expected);
  });

  it.each<ReaderCase>([
    [getPreference, ['theme'], ['get-preference', 'theme'], 'dark'],
    [getPreferences, [], ['get-preferences'], { theme: 'dark' }],
    [
      getSystemPreference,
      ['hardwareAcceleration'],
      ['get-system-preference', 'hardwareAcceleration'],
      true,
    ],
    [getSystemPreferences, [], ['get-system-preferences'], { hardwareAcceleration: true }],
    [getShouldUseDarkColors, [], ['get-should-use-dark-colors'], false],
  ])('reads %s through synchronous ipcRenderer calls', (reader, args, expected, value) => {
    ipcRenderer.sendSync.mockReturnValueOnce(value);

    expect(reader(...args)).toEqual(value);
    expect(ipcRenderer.sendSync).toHaveBeenCalledWith(...expected);
  });
});

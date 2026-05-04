/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { INSTALLED, INSTALLING } from '../../../constants/app-statuses';
import type { RootState } from '../../../state';
import {
  DEFAULT_ADMIN_INSTALLATION_PATH,
  DEFAULT_USER_INSTALLATION_PATH,
  formatBytes,
  getInstallationPathLabel,
  getUpdaterDesc,
  isUpdateCheckDisabled,
  parseInstallationPathPreference,
  selectPreferencesProps,
  shouldShowCurrentInstallationPathOption,
  stringifyInstallationPathPreference,
} from './model';

const createState = () =>
  ({
    appManagement: {
      apps: {
        installed: { id: 'installed', status: INSTALLED },
        installing: { id: 'installing', status: INSTALLING },
      },
      sortedAppIds: ['installed', 'installing'],
    },
    preferences: {
      allowPrerelease: true,
      alwaysOnTop: false,
      attachToMenubar: true,
      defaultHome: 'installed',
      installationPath: DEFAULT_USER_INSTALLATION_PATH,
      preferredEngine: 'chrome',
      requireAdmin: false,
      themeSource: 'system',
      useHardwareAcceleration: true,
    },
    systemPreferences: {
      openAtLogin: 'no',
    },
  }) as unknown as RootState;

describe('preferences model', () => {
  it('formats byte counts for updater progress text', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
    expect(formatBytes(1536, -1)).toBe('2 KB');
  });

  it('derives updater descriptions from status and update info', () => {
    expect(getUpdaterDesc('checking-for-update')).toBe('Checking for updates...');
    expect(getUpdaterDesc('update-available')).toBe('Downloading updates...');
    expect(getUpdaterDesc('download-progress')).toBe('Downloading updates...');
    expect(
      getUpdaterDesc('download-progress', {
        bytesPerSecond: 2048,
        total: 4096,
        transferred: 1024,
      }),
    ).toBe('Downloading updates (1 KB/4 KB at 2 KB/s)...');
    expect(getUpdaterDesc('update-downloaded', { version: '1.2.3' })).toBe(
      'A new version (1.2.3) has been downloaded.',
    );
    expect(getUpdaterDesc('idle')).toBeNull();
  });

  it('marks only active updater statuses as disabled', () => {
    expect(isUpdateCheckDisabled('checking-for-update')).toBe(true);
    expect(isUpdateCheckDisabled('download-progress')).toBe(true);
    expect(isUpdateCheckDisabled('update-available')).toBe(true);
    expect(isUpdateCheckDisabled('update-downloaded')).toBe(false);
  });

  it('parses installation path menu values behind the select UI', () => {
    const preference = {
      installationPath: DEFAULT_ADMIN_INSTALLATION_PATH,
      requireAdmin: true,
    };

    expect(
      parseInstallationPathPreference(stringifyInstallationPathPreference(preference)),
    ).toEqual(preference);
    expect(parseInstallationPathPreference('')).toBeNull();
    expect(parseInstallationPathPreference(null)).toBeNull();
    expect(
      parseInstallationPathPreference(JSON.stringify({ installationPath: '/Applications' })),
    ).toBeNull();
  });

  it('adds the sudo label only for custom admin paths', () => {
    expect(
      getInstallationPathLabel({
        installationPath: '/Applications/Custom Apps',
        requireAdmin: true,
      }),
    ).toBe('/Applications/Custom Apps (require sudo)');
    expect(
      getInstallationPathLabel({
        installationPath: DEFAULT_ADMIN_INSTALLATION_PATH,
        requireAdmin: true,
      }),
    ).toBe(DEFAULT_ADMIN_INSTALLATION_PATH);
  });

  it('keeps current custom paths visible without re-adding defaults or legacy paths', () => {
    expect(shouldShowCurrentInstallationPathOption('/Applications/Custom Apps')).toBe(true);
    expect(shouldShowCurrentInstallationPathOption(DEFAULT_USER_INSTALLATION_PATH)).toBe(false);
    expect(shouldShowCurrentInstallationPathOption('/Applications/WebCatalog Apps')).toBe(false);
  });

  it('selects connected preferences props from app state', () => {
    expect(selectPreferencesProps(createState())).toEqual({
      allowPrerelease: true,
      alwaysOnTop: false,
      appCount: 2,
      attachToMenubar: true,
      defaultHome: 'installed',
      installationPath: DEFAULT_USER_INSTALLATION_PATH,
      installingAppCount: 1,
      openAtLogin: 'no',
      preferredEngine: 'chrome',
      requireAdmin: false,
      themeSource: 'system',
      useHardwareAcceleration: true,
    });
  });
});

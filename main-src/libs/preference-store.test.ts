/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

import {
  applyPreferenceCacheUpdate,
  createDefaultPreferences,
  DEFAULT_ADMIN_INSTALLATION_PATH,
  getDefaultInstallationPath,
  getMigratedRootInstallLocationValue,
  mergePreferences,
  migrateRootInstallLocation,
  PREFERENCES_SCOPE,
  shouldMigrateRootInstallLocation,
} from './preference-store';

describe('preference store contracts', () => {
  it('creates default preferences from app version state', () => {
    expect(getDefaultInstallationPath()).toBe('~/Applications/Chromeless Apps');
    expect(createDefaultPreferences({ hasPrereleaseVersion: true })).toMatchObject({
      allowPrerelease: true,
      defaultHome: 'browsers',
      installationPath: '~/Applications/Chromeless Apps',
      preferredEngine: 'chrome',
      requireAdmin: false,
      themeSource: 'system',
    });
  });

  it('merges stored preferences over defaults', () => {
    expect(
      mergePreferences(
        {
          defaultHome: 'browsers',
          themeSource: 'system',
        },
        {
          themeSource: 'dark',
        },
      ),
    ).toEqual({
      defaultHome: 'browsers',
      themeSource: 'dark',
    });
  });

  it('detects legacy root installation migration only for installation settings', () => {
    const getSetting = vi.fn((key) =>
      key === `preferences.${PREFERENCES_SCOPE}.installLocation` ? 'root' : null,
    );

    expect(shouldMigrateRootInstallLocation('installationPath', getSetting)).toBe(true);
    expect(shouldMigrateRootInstallLocation('requireAdmin', getSetting)).toBe(true);
    expect(shouldMigrateRootInstallLocation('themeSource', getSetting)).toBe(false);
    expect(getMigratedRootInstallLocationValue('installationPath')).toBe(
      DEFAULT_ADMIN_INSTALLATION_PATH,
    );
    expect(getMigratedRootInstallLocationValue('requireAdmin')).toBe(true);
    expect(getMigratedRootInstallLocationValue('themeSource')).toBeUndefined();
  });

  it('writes migrated install location values before clearing the legacy key', () => {
    const setPreference = vi.fn();
    const unsetLegacyInstallLocation = vi.fn();

    expect(
      migrateRootInstallLocation({
        name: 'installationPath',
        setPreference,
        unsetLegacyInstallLocation,
      }),
    ).toBe(DEFAULT_ADMIN_INSTALLATION_PATH);

    expect(setPreference).toHaveBeenNthCalledWith(
      1,
      'installationPath',
      DEFAULT_ADMIN_INSTALLATION_PATH,
    );
    expect(setPreference).toHaveBeenNthCalledWith(2, 'requireAdmin', true);
    expect(unsetLegacyInstallLocation).toHaveBeenCalledTimes(1);
  });

  it('keeps the legacy install location when the migration write fails', () => {
    const setPreference = vi.fn((name) => {
      if (name === 'requireAdmin') {
        throw new Error('disk write failed');
      }
    });
    const unsetLegacyInstallLocation = vi.fn();

    expect(() =>
      migrateRootInstallLocation({
        name: 'installationPath',
        setPreference,
        unsetLegacyInstallLocation,
      }),
    ).toThrow('disk write failed');

    expect(setPreference).toHaveBeenNthCalledWith(
      1,
      'installationPath',
      DEFAULT_ADMIN_INSTALLATION_PATH,
    );
    expect(setPreference).toHaveBeenNthCalledWith(2, 'requireAdmin', true);
    expect(unsetLegacyInstallLocation).not.toHaveBeenCalled();
  });

  it('updates cache, persists settings, notifies renderer, and updates native theme source', () => {
    const cachedPreferences = {
      themeSource: 'system',
    };
    const notify = vi.fn();
    const persist = vi.fn();
    const setThemeSource = vi.fn();

    applyPreferenceCacheUpdate({
      cachedPreferences,
      name: 'themeSource',
      notify,
      persist,
      setThemeSource,
      value: 'dark',
    });

    expect(cachedPreferences.themeSource).toBe('dark');
    expect(notify).toHaveBeenCalledWith('themeSource', 'dark');
    expect(persist).toHaveBeenCalledWith('themeSource', 'dark');
    expect(setThemeSource).toHaveBeenCalledWith('dark');
  });

  it('does not touch native theme source for unrelated preference updates', () => {
    const setThemeSource = vi.fn();

    applyPreferenceCacheUpdate({
      cachedPreferences: {},
      name: 'defaultHome',
      notify: vi.fn(),
      persist: vi.fn(),
      setThemeSource,
      value: 'installed',
    });

    expect(setThemeSource).not.toHaveBeenCalled();
  });

  it('does not update cache or notify when persist throws', () => {
    const cachedPreferences = { themeSource: 'system' };
    const notify = vi.fn();
    const persist = vi.fn(() => {
      throw new Error('disk write failed');
    });
    const setThemeSource = vi.fn();

    expect(() =>
      applyPreferenceCacheUpdate({
        cachedPreferences,
        name: 'themeSource',
        notify,
        persist,
        setThemeSource,
        value: 'dark',
      }),
    ).toThrow('disk write failed');

    expect(cachedPreferences.themeSource).toBe('system');
    expect(notify).not.toHaveBeenCalled();
    expect(setThemeSource).not.toHaveBeenCalled();
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import path from 'node:path';

export const PREFERENCES_SCOPE = '2018';
export const DEFAULT_ADMIN_INSTALLATION_PATH = '/Applications/Chromeless Apps';

export type PreferenceRecord = Record<string, unknown>;

export const getDefaultInstallationPath = () => path.join('~', 'Applications', 'Chromeless Apps');

export const createDefaultPreferences = ({
  hasPrereleaseVersion,
}: {
  hasPrereleaseVersion: boolean;
}) => ({
  allowPrerelease: hasPrereleaseVersion,
  alwaysOnTop: false,
  attachToMenubar: false,
  defaultHome: 'browsers',
  installationPath: getDefaultInstallationPath(),
  preferredEngine: 'chrome',
  requireAdmin: false,
  sortInstalledAppBy: 'last-updated',
  themeSource: 'system',
  useHardwareAcceleration: true,
});

export const mergePreferences = (
  defaultPreferences: PreferenceRecord,
  storedPreferences: PreferenceRecord | null | undefined,
) => ({
  ...defaultPreferences,
  ...(storedPreferences ?? {}),
});

export const shouldMigrateRootInstallLocation = (
  name: string,
  getSetting: (key: string) => unknown,
) =>
  (name === 'installationPath' || name === 'requireAdmin') &&
  getSetting(`preferences.${PREFERENCES_SCOPE}.installLocation`) === 'root';

export const getMigratedRootInstallLocationValue = (name: string) => {
  if (name === 'installationPath') return DEFAULT_ADMIN_INSTALLATION_PATH;
  if (name === 'requireAdmin') return true;
  return undefined;
};

export const migrateRootInstallLocation = ({
  name,
  setPreference,
  unsetLegacyInstallLocation,
}: {
  name: string;
  setPreference: (name: string, value: unknown) => void;
  unsetLegacyInstallLocation: () => void;
}) => {
  const migratedValue = getMigratedRootInstallLocationValue(name);

  if (migratedValue === undefined) {
    return undefined;
  }

  setPreference('installationPath', DEFAULT_ADMIN_INSTALLATION_PATH);
  setPreference('requireAdmin', true);
  unsetLegacyInstallLocation();

  return migratedValue;
};

export const applyPreferenceCacheUpdate = ({
  cachedPreferences,
  name,
  notify,
  persist,
  setThemeSource,
  value,
}: {
  cachedPreferences: PreferenceRecord;
  name: string;
  notify: (name: string, value: unknown) => void;
  persist: (name: string, value: unknown) => void;
  setThemeSource: (value: unknown) => void;
  value: unknown;
}) => {
  persist(name, value);
  cachedPreferences[name] = value;
  notify(name, value);

  if (name === 'themeSource') {
    setThemeSource(value);
  }
};

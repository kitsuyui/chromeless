/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const semver = require('semver');
const settings = require('electron-settings');
const { app, nativeTheme } = require('electron');

const sendToAllWindows = require('./ipc/send-to-all-windows');
const {
  DEFAULT_ADMIN_INSTALLATION_PATH,
  PREFERENCES_SCOPE,
  applyPreferenceCacheUpdate,
  createDefaultPreferences,
  getMigratedRootInstallLocationValue,
  mergePreferences,
  shouldMigrateRootInstallLocation,
} = require('./preference-store');

// scope
const v = PREFERENCES_SCOPE;

const defaultPreferences = createDefaultPreferences({
  hasPrereleaseVersion: Boolean(semver.prerelease(app.getVersion())),
});

let cachedPreferences = null;

const initCachedPreferences = () => {
  cachedPreferences = mergePreferences(defaultPreferences, settings.getSync(`preferences.${v}`));
};

const getPreferences = () => {
  // trigger electron-settings before app ready might fail
  // so catch with default pref as fallback
  // https://github.com/nathanbuchar/electron-settings/issues/111
  try {
    // store in memory to boost performance
    if (cachedPreferences == null) {
      initCachedPreferences();
    }
    return cachedPreferences;
  } catch {
    return defaultPreferences;
  }
};

const setPreference = (name, value) => {
  if (cachedPreferences == null) {
    initCachedPreferences();
  }

  applyPreferenceCacheUpdate({
    cachedPreferences,
    name,
    notify: (preferenceName, preferenceValue) =>
      sendToAllWindows('set-preference', preferenceName, preferenceValue),
    persist: (preferenceName, preferenceValue) =>
      settings.setSync(`preferences.${v}.${preferenceName}`, preferenceValue),
    setThemeSource: (themeSource) => {
      nativeTheme.themeSource = themeSource;
    },
    value,
  });
};

const getPreference = (name) => {
  // trigger electron-settings before app ready might fail
  // so catch with default pref as fallback
  // https://github.com/nathanbuchar/electron-settings/issues/111
  try {
    // ensure compatibility with old version
    if (name === 'installationPath' || name === 'requireAdmin') {
      // old pref, home or root
      if (shouldMigrateRootInstallLocation(name, settings.getSync)) {
        settings.unsetSync('preferences.2018.installLocation');

        setPreference('installationPath', DEFAULT_ADMIN_INSTALLATION_PATH);
        setPreference('requireAdmin', true);

        return getMigratedRootInstallLocationValue(name);
      }
    }

    // store in memory to boost performance
    if (cachedPreferences == null) {
      initCachedPreferences();
    }
    return cachedPreferences[name];
  } catch {
    return defaultPreferences[name];
  }
};

const resetPreferences = () => {
  cachedPreferences = null;
  settings.unsetSync();

  const preferences = getPreferences();
  sendToAllWindows('set-preferences', preferences);
};

module.exports = {
  getPreference,
  getPreferences,
  resetPreferences,
  setPreference,
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const path = require('path');
const fsExtra = require('fs-extra');
const { findFirefoxProfilePath } = require('./firefox-profile.ts');
const { getInstalledAppBundlePath } = require('./installation-path.ts');

const getRelatedPaths = (
  {
    appObj,
    installationPath,
    homePath,
    userDataPath,
    // installationPath = getPreference('installationPath'),
    // homePath = app.getPath('home'),
  },
  fsAccess = fsExtra,
) => {
  const { id, name, engine } = appObj;

  const relatedPaths = [];

  // App
  const dotAppPath = getInstalledAppBundlePath({
    appName: name,
    homePath,
    installationPath,
  });

  relatedPaths.push({ path: dotAppPath, type: 'app' });

  // Data
  switch (engine) {
    case 'firefox/tabs':
    case 'firefox': {
      const profileId = `chromeless-${id}`;

      const firefoxUserDataPath = path.join(homePath, 'Library', 'Application Support', 'Firefox');
      const profilesIniPath = path.join(firefoxUserDataPath, 'profiles.ini');

      const exists = fsAccess.pathExistsSync(profilesIniPath);
      // If user has never opened Firefox app
      // profiles.ini doesn't exist
      if (exists) {
        const profilesIniContent = fsAccess.readFileSync(profilesIniPath, 'utf-8');

        const profilePath = findFirefoxProfilePath(profilesIniContent, profileId);
        if (profilePath) {
          const profileDataPath = path.join(firefoxUserDataPath, profilePath);
          relatedPaths.push({
            path: profileDataPath,
            type: 'data',
          });
        }
      }
      break;
    }
    // Chromium-based browsers
    default: {
      relatedPaths.push({
        path: path.join(userDataPath, 'ChromiumProfiles', id),
        type: 'data',
      });
    }
  }

  return relatedPaths;
};

module.exports = getRelatedPaths;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const fs = require('fs');
const path = require('path');

export const canCheckForUpdates = (
  resourcesPath = process.resourcesPath,
  existsSync = fs.existsSync,
) => Boolean(resourcesPath) && existsSync(path.join(resourcesPath, 'app-update.yml'));

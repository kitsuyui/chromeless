/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import os from 'node:os';

type FirefoxProfileEntry = Record<string, string>;

export const parseFirefoxProfiles = (
  profilesIniContent: string,
  eol: string = os.EOL,
): FirefoxProfileEntry[] =>
  profilesIniContent.split(`${eol}${eol}`).map((entryText) => {
    const lines = entryText.split(eol);

    const entry: FirefoxProfileEntry = {};
    lines.forEach((line, i) => {
      if (i === 0) {
        entry.Header = line;
        return;
      }

      const parts = line.split(/=(.+)/);
      if (parts[1] === undefined) return;
      entry[parts[0]] = parts[1];
    });

    return entry;
  });

export const findFirefoxProfilePath = (
  profilesIniContent: string,
  profileName: string,
  eol: string = os.EOL,
) =>
  parseFirefoxProfiles(profilesIniContent, eol).find((entry) => entry.Name === profileName)?.Path;

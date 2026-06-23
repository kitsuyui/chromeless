/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { findFirefoxProfilePath, parseFirefoxProfiles } from './firefox-profile';

const profilesIni = [
  '[Profile0]',
  'Name=default',
  'IsRelative=1',
  'Path=Profiles/default',
  '',
  '[Profile1]',
  'Name=chromeless-mail',
  'IsRelative=1',
  'Path=Profiles/mail',
].join('\n');

describe('firefox profile metadata', () => {
  it('parses profiles.ini entries', () => {
    expect(parseFirefoxProfiles(profilesIni, '\n')).toEqual([
      {
        Header: '[Profile0]',
        IsRelative: '1',
        Name: 'default',
        Path: 'Profiles/default',
      },
      {
        Header: '[Profile1]',
        IsRelative: '1',
        Name: 'chromeless-mail',
        Path: 'Profiles/mail',
      },
    ]);
  });

  it('finds a profile path by profile name', () => {
    expect(findFirefoxProfilePath(profilesIni, 'chromeless-mail', '\n')).toBe('Profiles/mail');
    expect(findFirefoxProfilePath(profilesIni, 'missing-profile', '\n')).toBeUndefined();
  });

  it('ignores lines without = when parsing entries', () => {
    const iniWithComment = [
      '[Profile0]',
      '; this is a comment',
      'Name=default',
      'Path=Profiles/default',
    ].join('\n');

    expect(parseFirefoxProfiles(iniWithComment, '\n')).toEqual([
      {
        Header: '[Profile0]',
        Name: 'default',
        Path: 'Profiles/default',
      },
    ]);
  });
});

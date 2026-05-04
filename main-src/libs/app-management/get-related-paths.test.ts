/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import getRelatedPaths from './get-related-paths';

const baseInput = {
  homePath: '/Users/alice',
  installationPath: '~/Applications/Chromeless Apps',
  userDataPath: '/Users/alice/Library/Application Support/Chromeless',
};

describe('getRelatedPaths', () => {
  it('returns app and Chromium profile paths by default', () => {
    expect(
      getRelatedPaths({
        ...baseInput,
        appObj: {
          engine: 'chrome',
          id: 'mail',
          name: 'Mail',
        },
      }),
    ).toEqual([
      {
        path: path.join('/Users/alice', 'Applications', 'Chromeless Apps', 'Mail.app'),
        type: 'app',
      },
      {
        path: path.join(
          '/Users/alice/Library/Application Support/Chromeless',
          'ChromiumProfiles',
          'mail',
        ),
        type: 'data',
      },
    ]);
  });

  it('returns Firefox profile paths when profiles.ini contains a matching profile', () => {
    const fsAccess = {
      pathExistsSync: vi.fn(() => true),
      readFileSync: vi.fn(() =>
        ['[Profile0]', 'Name=chromeless-mail', 'IsRelative=1', 'Path=Profiles/mail'].join('\n'),
      ),
    };

    expect(
      getRelatedPaths(
        {
          ...baseInput,
          appObj: {
            engine: 'firefox',
            id: 'mail',
            name: 'Mail',
          },
        },
        fsAccess,
      ),
    ).toEqual([
      {
        path: path.join('/Users/alice', 'Applications', 'Chromeless Apps', 'Mail.app'),
        type: 'app',
      },
      {
        path: path.join(
          '/Users/alice',
          'Library',
          'Application Support',
          'Firefox',
          'Profiles/mail',
        ),
        type: 'data',
      },
    ]);
  });

  it('does not add Firefox data paths when profiles.ini is missing', () => {
    const fsAccess = {
      pathExistsSync: vi.fn(() => false),
      readFileSync: vi.fn(),
    };

    expect(
      getRelatedPaths(
        {
          ...baseInput,
          appObj: {
            engine: 'firefox',
            id: 'mail',
            name: 'Mail',
          },
        },
        fsAccess,
      ),
    ).toEqual([
      {
        path: path.join('/Users/alice', 'Applications', 'Chromeless Apps', 'Mail.app'),
        type: 'app',
      },
    ]);
    expect(fsAccess.readFileSync).not.toHaveBeenCalled();
  });
});

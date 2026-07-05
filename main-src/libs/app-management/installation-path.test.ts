/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getInstalledAppBundlePath, resolveInstallationPath } from './installation-path';

describe('installation path helpers', () => {
  it('expands home-relative installation paths', () => {
    expect(resolveInstallationPath('~/Applications/Chromeless Apps', '/Users/alice')).toBe(
      path.join('/Users/alice', 'Applications', 'Chromeless Apps'),
    );
  });

  it('resolves a bare tilde to the home directory', () => {
    expect(resolveInstallationPath('~', '/Users/alice')).toBe('/Users/alice');
  });

  it('keeps absolute installation paths unchanged', () => {
    expect(resolveInstallationPath('/Applications/Chromeless Apps', '/Users/alice')).toBe(
      '/Applications/Chromeless Apps',
    );
  });

  it('resolves installed app bundle paths', () => {
    expect(
      getInstalledAppBundlePath({
        appName: 'Mail',
        homePath: '/Users/alice',
        installationPath: '~/Applications/Chromeless Apps',
      }),
    ).toBe(path.join('/Users/alice', 'Applications', 'Chromeless Apps', 'Mail.app'));
  });
});

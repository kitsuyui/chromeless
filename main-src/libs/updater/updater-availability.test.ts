/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { canCheckForUpdates } from './updater-availability';

describe('canCheckForUpdates', () => {
  it('requires packaged update metadata before checking for updates', () => {
    const checkedPaths: string[] = [];
    const existsSync = (filePath: string) => {
      checkedPaths.push(filePath);
      return filePath.endsWith('/app-update.yml');
    };

    expect(canCheckForUpdates('/Applications/Chromeless.app/Contents/Resources', existsSync)).toBe(
      true,
    );
    expect(checkedPaths).toEqual([
      '/Applications/Chromeless.app/Contents/Resources/app-update.yml',
    ]);
  });

  it('skips update checks for development builds without update metadata', () => {
    expect(canCheckForUpdates('/tmp/dev-resources', () => false)).toBe(false);
  });

  it('skips update checks when Electron has no resources path', () => {
    expect(canCheckForUpdates('', () => true)).toBe(false);
  });
});

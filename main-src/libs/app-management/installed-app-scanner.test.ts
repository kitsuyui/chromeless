/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';
import { getInstalledAppsFromDirectory } from './installed-app-scanner';

const createDirent = (name: string, isDirectory: boolean) => ({
  isDirectory: () => isDirectory,
  name,
});

describe('installed app scanner', () => {
  it('returns no apps when the installation directory is missing', async () => {
    const fsAccess = {
      pathExistsSync: vi.fn(() => false),
      readdir: vi.fn(),
    };

    await expect(
      getInstalledAppsFromDirectory('/Applications/Chromeless Apps', fsAccess),
    ).resolves.toEqual([]);
    expect(fsAccess.readdir).not.toHaveBeenCalled();
  });

  it('reads app metadata only from directories and drops unreadable apps', async () => {
    const fsAccess = {
      pathExistsSync: vi.fn(() => true),
      readdir: vi
        .fn()
        .mockResolvedValue([
          createDirent('Mail.app', true),
          createDirent('README.txt', false),
          createDirent('Broken.app', true),
        ]),
    };
    const readInstalledApp = vi.fn((installationPath: string, fileName: string) => {
      if (fileName === 'Broken.app') return null;
      return { id: 'mail', installationPath, name: 'Mail' };
    });

    await expect(
      getInstalledAppsFromDirectory('/Applications/Chromeless Apps', fsAccess, readInstalledApp),
    ).resolves.toEqual([
      {
        id: 'mail',
        installationPath: '/Applications/Chromeless Apps',
        name: 'Mail',
      },
    ]);
    expect(fsAccess.readdir).toHaveBeenCalledWith('/Applications/Chromeless Apps', {
      withFileTypes: true,
    });
    expect(readInstalledApp).toHaveBeenCalledTimes(2);
    expect(readInstalledApp).toHaveBeenNthCalledWith(
      1,
      '/Applications/Chromeless Apps',
      'Mail.app',
    );
    expect(readInstalledApp).toHaveBeenNthCalledWith(
      2,
      '/Applications/Chromeless Apps',
      'Broken.app',
    );
  });
});

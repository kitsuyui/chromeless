/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getInstalledAppPaths, readInstalledApp, readPackageVersion } from './installed-app-reader';

const createFs = ({
  existingPaths = new Set<string>(),
  jsonByPath = new Map<string, unknown>(),
  mtimeMs = 1234.56,
}: {
  existingPaths?: Set<string>;
  jsonByPath?: Map<string, unknown>;
  mtimeMs?: number;
} = {}) => ({
  pathExistsSync: vi.fn((targetPath: string) => existingPaths.has(targetPath)),
  readJSONSync: vi.fn((targetPath: string): Record<string, unknown> => {
    const value = jsonByPath.get(targetPath);
    if (value instanceof Error) throw value;
    return value as Record<string, unknown>;
  }),
  statSync: vi.fn(() => ({ mtimeMs })),
});

describe('installed app reader', () => {
  it('resolves metadata paths inside unpacked app resources', () => {
    expect(getInstalledAppPaths('/Applications/Chromeless Apps', 'Mail.app')).toEqual({
      appJsonPath: path.join(
        '/Applications/Chromeless Apps',
        'Mail.app',
        'Contents',
        'Resources',
        'app.asar.unpacked',
        'build',
        'app.json',
      ),
      iconPath: path.join(
        '/Applications/Chromeless Apps',
        'Mail.app',
        'Contents',
        'Resources',
        'app.asar.unpacked',
        'build',
        'icon.png',
      ),
      packageJsonPath: path.join(
        '/Applications/Chromeless Apps',
        'Mail.app',
        'Contents',
        'Resources',
        'app.asar.unpacked',
        'package.json',
      ),
    });
  });

  it('reads package versions with a zero version fallback', () => {
    const packageJsonPath = '/app/package.json';
    const fsAccess = createFs({
      existingPaths: new Set([packageJsonPath]),
      jsonByPath: new Map([[packageJsonPath, { version: '4.0.0' }]]),
    });

    expect(readPackageVersion(packageJsonPath, fsAccess)).toBe('4.0.0');
    expect(readPackageVersion('/missing/package.json', fsAccess)).toBe('0.0.0');
  });

  it('falls back to zero version when package metadata cannot be parsed', () => {
    const packageJsonPath = '/app/package.json';
    const fsAccess = createFs({
      existingPaths: new Set([packageJsonPath]),
      jsonByPath: new Map([[packageJsonPath, new Error('invalid json')]]),
    });

    expect(readPackageVersion(packageJsonPath, fsAccess)).toBe('0.0.0');
  });

  it('reads installed app metadata and derived status fields', () => {
    const paths = getInstalledAppPaths('/Applications/Chromeless Apps', 'Mail.app');
    const fsAccess = createFs({
      existingPaths: new Set([paths.appJsonPath, paths.iconPath, paths.packageJsonPath]),
      jsonByPath: new Map([
        [
          paths.appJsonPath,
          {
            engine: 'chrome',
            id: 'mail',
            name: 'Mail',
          },
        ],
        [paths.packageJsonPath, { version: '1.2.3' }],
      ]),
      mtimeMs: 1234.56,
    });

    expect(readInstalledApp('/Applications/Chromeless Apps', 'Mail.app', fsAccess)).toEqual({
      engine: 'chrome',
      icon: paths.iconPath,
      id: 'mail',
      lastUpdated: 1234,
      name: 'Mail',
      status: 'INSTALLED',
      version: '1.2.3',
    });
  });

  it('returns null when app metadata is missing', () => {
    expect(readInstalledApp('/Applications/Chromeless Apps', 'Mail.app', createFs())).toBeNull();
  });

  it('returns null when app.json is missing the engine field', () => {
    const paths = getInstalledAppPaths('/Applications/Chromeless Apps', 'Mail.app');
    const fsAccess = createFs({
      existingPaths: new Set([paths.appJsonPath]),
      jsonByPath: new Map([[paths.appJsonPath, { id: 'mail', name: 'Mail' }]]),
    });

    expect(readInstalledApp('/Applications/Chromeless Apps', 'Mail.app', fsAccess)).toBeNull();
  });
});

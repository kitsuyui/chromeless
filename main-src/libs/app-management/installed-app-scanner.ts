/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as fsExtra from 'fs-extra';
import { readInstalledApp } from './installed-app-reader';

type DirectoryEntry = {
  isDirectory: () => boolean;
  name: string;
};

type InstalledAppScannerFileSystem = {
  pathExistsSync: (targetPath: string) => boolean;
  readdir: (targetPath: string, options: { withFileTypes: true }) => Promise<DirectoryEntry[]>;
};

type InstalledAppReader = (
  installationPath: string,
  fileName: string,
) => Record<string, unknown> | null;

export const getInstalledAppsFromDirectory = async (
  installationPath: string,
  fsAccess: InstalledAppScannerFileSystem = fsExtra,
  readApp: InstalledAppReader = readInstalledApp,
) => {
  if (!fsAccess.pathExistsSync(installationPath)) return [];

  const files = await fsAccess.readdir(installationPath, { withFileTypes: true });
  return files.flatMap((file) => {
    if (!file.isDirectory()) return [];

    const installedApp = readApp(installationPath, file.name);
    return installedApp ? [installedApp] : [];
  });
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import path from 'node:path';
import * as fsExtra from 'fs-extra';

type InstalledAppFileSystem = {
  pathExistsSync: (targetPath: string) => boolean;
  readJSONSync: (targetPath: string) => Record<string, unknown>;
  statSync: (targetPath: string) => { mtimeMs: number };
};

export const getInstalledAppPaths = (installationPath: string, fileName: string) => {
  const resourcesPath = path.join(installationPath, fileName, 'Contents', 'Resources');
  const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked');

  return {
    appJsonPath: path.join(unpackedPath, 'build', 'app.json'),
    iconPath: path.join(unpackedPath, 'build', 'icon.png'),
    packageJsonPath: path.join(unpackedPath, 'package.json'),
  };
};

export const readPackageVersion = (
  packageJsonPath: string,
  fsAccess: InstalledAppFileSystem = fsExtra,
) => {
  if (!fsAccess.pathExistsSync(packageJsonPath)) return '0.0.0';

  try {
    return fsAccess.readJSONSync(packageJsonPath).version ?? '0.0.0';
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return '0.0.0';
  }
};

export const readInstalledApp = (
  installationPath: string,
  fileName: string,
  fsAccess: InstalledAppFileSystem = fsExtra,
) => {
  const { appJsonPath, iconPath, packageJsonPath } = getInstalledAppPaths(
    installationPath,
    fileName,
  );
  if (!fsAccess.pathExistsSync(appJsonPath)) return null;

  const appJson = fsAccess.readJSONSync(appJsonPath);
  return {
    ...appJson,
    engine: appJson.engine,
    icon: fsAccess.pathExistsSync(iconPath) ? iconPath : null,
    lastUpdated: Math.floor(fsAccess.statSync(appJsonPath).mtimeMs),
    status: 'INSTALLED',
    version: readPackageVersion(packageJsonPath, fsAccess),
  };
};

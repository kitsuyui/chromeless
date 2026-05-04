/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import path from 'node:path';

export const resolveInstallationPath = (installationPath: string, homePath: string) => {
  if (installationPath === '~') return homePath;
  if (installationPath.startsWith('~/')) {
    return path.join(homePath, installationPath.slice(2));
  }
  return installationPath;
};

export const getInstalledAppBundlePath = ({
  appName,
  homePath,
  installationPath,
}: {
  appName: string;
  homePath: string;
  installationPath: string;
}) => path.join(resolveInstallationPath(installationPath, homePath), `${appName}.app`);

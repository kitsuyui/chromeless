/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

type InstallRuntimeInput = {
  engine: string;
  homePath: string;
  id: string;
  installationPath: string;
  name: string;
  requireAdmin: string;
  url: string | null | undefined;
};

export const isStandardInstallationPath = (installationPath: string) =>
  installationPath === '~/Applications/Chromeless Apps' ||
  installationPath === '/Applications/Chromeless Apps';

export const resolveRequireAdmin = (installationPath: string, requireAdmin: string) =>
  isStandardInstallationPath(installationPath) ? 'false' : requireAdmin;

export const buildInstallRuntime = ({
  engine,
  homePath,
  id,
  installationPath,
  name: _name,
  requireAdmin,
  url,
}: InstallRuntimeInput) => {
  const browserId = engine.split('/')[0];
  const useTabs = !url || engine.endsWith('/tabs');
  const appFolderName = `${id}.app`;
  const firefoxProfileId = `chromeless-${id}`;
  const allAppsPath = installationPath.replace('~', homePath);
  const finalPath = `${allAppsPath}/${appFolderName}`;
  const iconFileName = browserId === 'firefox' ? 'firefox.icns' : 'app.icns';

  return {
    allAppsPath,
    appFolderName,
    browserId,
    finalPath,
    firefoxProfileId,
    iconFileName,
    requireAdmin: resolveRequireAdmin(installationPath, requireAdmin),
    useTabs,
  };
};

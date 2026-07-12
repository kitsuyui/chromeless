/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { resolveInstallationPath } from './installation-path';

type ScanDependencies = {
  getHomePath: () => string;
  getInstallationPreference: () => string;
  getInstalledApps: (installationPath: string) => Promise<unknown[]>;
  send: (channel: string, payload?: unknown) => void;
};

export const runInstalledAppScan = ({
  getHomePath,
  getInstallationPreference,
  getInstalledApps,
  send,
}: ScanDependencies) => {
  send('clean-app-management');

  const installationPath = resolveInstallationPath(getInstallationPreference(), getHomePath());

  return Promise.resolve()
    .then(() => getInstalledApps(installationPath))
    .then((apps) => {
      send('set-app-batch', apps);
      return apps;
    })
    .finally(() => {
      send('set-scanning-for-installed', false);
    });
};

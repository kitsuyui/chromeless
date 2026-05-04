/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import type { RootState } from '../../../state';
import { getInstallingAppsAsList } from '../../../state/app-management/utils';

export type InstallationPathPreference = {
  installationPath: string;
  requireAdmin: boolean;
};

type UpdaterInfo = {
  bytesPerSecond?: number;
  total?: number;
  transferred?: number;
  version?: string;
};

export const DEFAULT_USER_INSTALLATION_PATH = '~/Applications/Chromeless Apps';
export const DEFAULT_ADMIN_INSTALLATION_PATH = '/Applications/Chromeless Apps';
const LEGACY_INSTALLATION_PATH = '/Applications/WebCatalog Apps';

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};

export const getUpdaterDesc = (status: string | null, info?: UpdaterInfo | null) => {
  if (status === 'download-progress') {
    if (
      info != null &&
      info.transferred != null &&
      info.total != null &&
      info.bytesPerSecond != null
    ) {
      const { transferred, total, bytesPerSecond } = info;
      return `Downloading updates (${formatBytes(transferred)}/${formatBytes(total)} at ${formatBytes(bytesPerSecond)}/s)...`;
    }
    return 'Downloading updates...';
  }
  if (status === 'checking-for-update') {
    return 'Checking for updates...';
  }
  if (status === 'update-available') {
    return 'Downloading updates...';
  }
  if (status === 'update-downloaded') {
    if (info && info.version) return `A new version (${info.version}) has been downloaded.`;
    return 'A new version has been downloaded.';
  }
  return null;
};

export const isUpdateCheckDisabled = (status: string | null) =>
  status === 'checking-for-update' ||
  status === 'download-progress' ||
  status === 'update-available';

export const stringifyInstallationPathPreference = (preference: InstallationPathPreference) =>
  JSON.stringify(preference);

export const parseInstallationPathPreference = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return null;

  const preference = JSON.parse(value) as Partial<InstallationPathPreference>;
  if (
    typeof preference.installationPath !== 'string' ||
    typeof preference.requireAdmin !== 'boolean'
  ) {
    return null;
  }

  return preference as InstallationPathPreference;
};

export const getInstallationPathLabel = ({
  installationPath,
  requireAdmin,
}: InstallationPathPreference) => {
  const needsSudoLabel =
    requireAdmin &&
    installationPath !== DEFAULT_USER_INSTALLATION_PATH &&
    installationPath !== DEFAULT_ADMIN_INSTALLATION_PATH;

  return `${installationPath}${needsSudoLabel ? ' (require sudo)' : ''}`;
};

export const shouldShowCurrentInstallationPathOption = (installationPath: string) =>
  installationPath !== DEFAULT_USER_INSTALLATION_PATH &&
  installationPath !== LEGACY_INSTALLATION_PATH;

export const selectPreferencesProps = (state: RootState) => ({
  allowPrerelease: state.preferences.allowPrerelease,
  alwaysOnTop: state.preferences.alwaysOnTop,
  appCount: Object.keys(state.appManagement.apps).length,
  attachToMenubar: state.preferences.attachToMenubar,
  defaultHome: state.preferences.defaultHome,
  installationPath: state.preferences.installationPath,
  installingAppCount: getInstallingAppsAsList(state).length,
  openAtLogin: state.systemPreferences.openAtLogin,
  preferredEngine: state.preferences.preferredEngine,
  requireAdmin: state.preferences.requireAdmin,
  themeSource: state.preferences.themeSource,
  useHardwareAcceleration: state.preferences.useHardwareAcceleration,
});

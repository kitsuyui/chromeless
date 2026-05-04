/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import formatBytes from './format-bytes';

type DownloadProgress = {
  bytesPerSecond: number;
  total: number;
  transferred: number;
};

type UpdaterState =
  | {
      info?: DownloadProgress;
      status?: string;
    }
  | null
  | undefined;

export type UpdaterMenuItemState = {
  enabled?: boolean;
  label: string;
};

export const getUpdaterMenuItemState = (updaterState: UpdaterState): UpdaterMenuItemState => {
  if (updaterState?.status === 'update-downloaded') {
    return { label: 'Restart to Apply Updates...' };
  }

  if (updaterState?.status === 'update-available') {
    return { enabled: false, label: 'Downloading Updates...' };
  }

  if (updaterState?.status === 'download-progress' && updaterState.info) {
    const { transferred, total, bytesPerSecond } = updaterState.info;
    return {
      enabled: false,
      label: `Downloading Updates (${formatBytes(transferred)}/${formatBytes(total)} at ${formatBytes(bytesPerSecond)}/s)...`,
    };
  }

  if (updaterState?.status === 'checking-for-update') {
    return { enabled: false, label: 'Checking for Updates...' };
  }

  return { label: 'Check for Updates...' };
};

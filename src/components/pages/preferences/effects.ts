/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import type { InstallationPathPreference } from './model';

type ApplyInstallationPathInput = {
  appCount: number;
  nextPreference: InstallationPathPreference | null;
  requestSetPreference: (name: string, value: unknown) => void;
  showBlockedDialog: () => Promise<unknown>;
};

type ConfirmResetPreferencesInput = {
  enqueueRequestRestartSnackbar: () => void;
  onceSetPreferences: (listener: () => void) => void;
  requestResetPreferences: () => void;
  showResetDialog: () => Promise<{ response: number }>;
};

export const applyInstallationPathPreference = ({
  appCount,
  nextPreference,
  requestSetPreference,
  showBlockedDialog,
}: ApplyInstallationPathInput) => {
  if (nextPreference == null) return;

  if (appCount > 0) {
    void showBlockedDialog();
    return;
  }

  requestSetPreference('requireAdmin', nextPreference.requireAdmin);
  requestSetPreference('installationPath', nextPreference.installationPath);
};

export const confirmResetPreferences = ({
  enqueueRequestRestartSnackbar,
  onceSetPreferences,
  requestResetPreferences,
  showResetDialog,
}: ConfirmResetPreferencesInput) =>
  showResetDialog().then(({ response }) => {
    if (response !== 0) return;

    onceSetPreferences(enqueueRequestRestartSnackbar);
    requestResetPreferences();
  });

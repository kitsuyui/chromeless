/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

import { applyInstallationPathPreference, confirmResetPreferences } from './effects';

describe('preferences effects', () => {
  it('applies installation path preferences when no apps are installed', () => {
    const requestSetPreference = vi.fn();

    applyInstallationPathPreference({
      appCount: 0,
      nextPreference: {
        installationPath: '/Applications/Chromeless Apps',
        requireAdmin: true,
      },
      requestSetPreference,
      showBlockedDialog: vi.fn(),
    });

    expect(requestSetPreference).toHaveBeenNthCalledWith(1, 'requireAdmin', true);
    expect(requestSetPreference).toHaveBeenNthCalledWith(
      2,
      'installationPath',
      '/Applications/Chromeless Apps',
    );
  });

  it('blocks installation path changes while apps are installed', () => {
    const showBlockedDialog = vi.fn(async () => undefined);
    const requestSetPreference = vi.fn();

    applyInstallationPathPreference({
      appCount: 1,
      nextPreference: {
        installationPath: '/Applications/Chromeless Apps',
        requireAdmin: true,
      },
      requestSetPreference,
      showBlockedDialog,
    });

    expect(showBlockedDialog).toHaveBeenCalled();
    expect(requestSetPreference).not.toHaveBeenCalled();
  });

  it('ignores empty installation path menu selections', () => {
    const requestSetPreference = vi.fn();

    applyInstallationPathPreference({
      appCount: 0,
      nextPreference: null,
      requestSetPreference,
      showBlockedDialog: vi.fn(),
    });

    expect(requestSetPreference).not.toHaveBeenCalled();
  });

  it('resets preferences only after the confirmation dialog accepts', async () => {
    const enqueueRequestRestartSnackbar = vi.fn();
    const onceSetPreferences = vi.fn();
    const requestResetPreferences = vi.fn();

    await confirmResetPreferences({
      enqueueRequestRestartSnackbar,
      onceSetPreferences,
      requestResetPreferences,
      showResetDialog: vi.fn(async () => ({ response: 0 })),
    });

    expect(onceSetPreferences).toHaveBeenCalledWith(enqueueRequestRestartSnackbar);
    expect(requestResetPreferences).toHaveBeenCalled();
  });

  it('keeps preferences unchanged when reset confirmation is canceled', async () => {
    const onceSetPreferences = vi.fn();
    const requestResetPreferences = vi.fn();

    await confirmResetPreferences({
      enqueueRequestRestartSnackbar: vi.fn(),
      onceSetPreferences,
      requestResetPreferences,
      showResetDialog: vi.fn(async () => ({ response: 1 })),
    });

    expect(onceSetPreferences).not.toHaveBeenCalled();
    expect(requestResetPreferences).not.toHaveBeenCalled();
  });
});

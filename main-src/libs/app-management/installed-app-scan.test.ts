/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';
import { runInstalledAppScan } from './installed-app-scan';

describe('runInstalledAppScan', () => {
  it('sends app data and clears scanning after a successful scan', async () => {
    const send = vi.fn();

    await expect(
      runInstalledAppScan({
        getHomePath: () => '/Users/alice',
        getInstallationPreference: () => '~/Applications/Chromeless Apps',
        getInstalledApps: vi.fn().mockResolvedValue([{ id: 'mail', name: 'Mail' }]),
        send,
      }),
    ).resolves.toEqual([{ id: 'mail', name: 'Mail' }]);

    expect(send).toHaveBeenNthCalledWith(1, 'clean-app-management');
    expect(send).toHaveBeenNthCalledWith(2, 'set-app-batch', [{ id: 'mail', name: 'Mail' }]);
    expect(send).toHaveBeenNthCalledWith(3, 'set-scanning-for-installed', false);
  });

  it('clears scanning after a failed scan', async () => {
    const send = vi.fn();
    const error = new Error('scan failed');

    await expect(
      runInstalledAppScan({
        getHomePath: () => '/Users/alice',
        getInstallationPreference: () => '~/Applications/Chromeless Apps',
        getInstalledApps: vi.fn().mockRejectedValue(error),
        send,
      }),
    ).rejects.toThrow('scan failed');

    expect(send).toHaveBeenNthCalledWith(1, 'clean-app-management');
    expect(send).toHaveBeenNthCalledWith(2, 'set-scanning-for-installed', false);
    expect(send).toHaveBeenCalledTimes(2);
  });
});

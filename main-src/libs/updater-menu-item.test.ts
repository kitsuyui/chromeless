/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { getUpdaterMenuItemState } from './updater-menu-item';

describe('getUpdaterMenuItemState', () => {
  it('uses the default check label without updater state', () => {
    expect(getUpdaterMenuItemState(undefined)).toEqual({ label: 'Check for Updates...' });
  });

  it('describes downloaded updates as a restart action', () => {
    expect(getUpdaterMenuItemState({ status: 'update-downloaded' })).toEqual({
      label: 'Restart to Apply Updates...',
    });
  });

  it('disables transient updater states', () => {
    expect(getUpdaterMenuItemState({ status: 'checking-for-update' })).toEqual({
      enabled: false,
      label: 'Checking for Updates...',
    });
  });

  it('formats download progress', () => {
    expect(
      getUpdaterMenuItemState({
        info: { bytesPerSecond: 1024, total: 2048, transferred: 1024 },
        status: 'download-progress',
      }),
    ).toEqual({
      enabled: false,
      label: 'Downloading Updates (1 KB/2 KB at 1 KB/s)...',
    });
  });
});

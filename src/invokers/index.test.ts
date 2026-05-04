/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRelatedPathsAsync } from './index';

const invoke = vi.fn();

beforeEach(() => {
  vi.stubGlobal('window', {
    ipcRenderer: {
      invoke,
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('invokers', () => {
  it('invokes related path lookup through ipcRenderer', async () => {
    invoke.mockResolvedValueOnce(['/Applications/Mail.app']);

    await expect(getRelatedPathsAsync({ id: 'mail' })).resolves.toEqual(['/Applications/Mail.app']);
    expect(invoke).toHaveBeenCalledWith('get-related-paths', { id: 'mail' });
  });
});

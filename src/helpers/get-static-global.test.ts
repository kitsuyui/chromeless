/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadHelper = async () => {
  vi.resetModules();
  return (await import('./get-static-global')).default;
};

beforeEach(() => {
  vi.stubGlobal('window', {
    remote: {
      getGlobal: vi.fn(),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getStaticGlobal', () => {
  it('caches values by key', async () => {
    const getStaticGlobal = await loadHelper();
    vi.mocked(window.remote.getGlobal).mockReturnValue({ version: '1.0.0' });

    expect(getStaticGlobal('updaterObj')).toEqual({ version: '1.0.0' });
    expect(getStaticGlobal('updaterObj')).toEqual({ version: '1.0.0' });
    expect(window.remote.getGlobal).toHaveBeenCalledTimes(1);
    expect(window.remote.getGlobal).toHaveBeenCalledWith('updaterObj');
  });

  it('caches falsy values', async () => {
    const getStaticGlobal = await loadHelper();
    vi.mocked(window.remote.getGlobal).mockReturnValue(false);

    expect(getStaticGlobal('isPackaged')).toBe(false);
    expect(getStaticGlobal('isPackaged')).toBe(false);
    expect(window.remote.getGlobal).toHaveBeenCalledTimes(1);
  });
});

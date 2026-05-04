/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

import { getAppIconPath, selectLocalImage } from './app-icon';

describe('app icon dialog contracts', () => {
  it('derives renderer-safe icon image paths', () => {
    expect(
      getAppIconPath({
        defaultIcon: 'default.png',
        icon: 'https://example.com/icon.png',
      }),
    ).toBe('https://example.com/icon.png');
    expect(
      getAppIconPath({
        defaultIcon: 'default.png',
        icon: '/tmp/icon.png',
      }),
    ).toBe('file:///tmp/icon.png');
    expect(
      getAppIconPath({
        defaultIcon: 'default.png',
        internetIcon: 'https://example.com/favicon.png',
      }),
    ).toBe('https://example.com/favicon.png');
    expect(getAppIconPath({ defaultIcon: 'default.png' })).toBe('default.png');
  });

  it('selects the first local image returned by Electron', async () => {
    const onSelect = vi.fn();
    const showOpenDialog = vi.fn(async () => ({
      canceled: false,
      filePaths: ['/tmp/icon.png', '/tmp/other.png'],
    }));

    await selectLocalImage({ onSelect, showOpenDialog });

    expect(showOpenDialog).toHaveBeenCalledWith({
      filters: [
        {
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'bmp', 'dib'],
          name: 'Images',
        },
      ],
      properties: ['openFile'],
    });
    expect(onSelect).toHaveBeenCalledWith('/tmp/icon.png');
  });

  it('ignores canceled or empty file selections', async () => {
    const onSelect = vi.fn();

    await selectLocalImage({
      onSelect,
      showOpenDialog: vi.fn(async () => ({ canceled: true, filePaths: ['/tmp/icon.png'] })),
    });
    await selectLocalImage({
      onSelect,
      showOpenDialog: vi.fn(async () => ({ canceled: false, filePaths: [] })),
    });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('routes dialog failures through the injected error handler', async () => {
    const error = new Error('failed');
    const onError = vi.fn();

    await selectLocalImage({
      onError,
      onSelect: vi.fn(),
      showOpenDialog: vi.fn(async () => {
        throw error;
      }),
    });

    expect(onError).toHaveBeenCalledWith(error);
  });
});

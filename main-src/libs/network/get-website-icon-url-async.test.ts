/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import getWebsiteIconUrlAsync from './get-website-icon-url-async';

const createTextResponse = ({
  body,
  ok = true,
  status = 200,
  url,
}: {
  body: string;
  ok?: boolean;
  status?: number;
  url: string;
}) =>
  ({
    headers: {
      get: vi.fn(),
    },
    ok,
    status,
    text: vi.fn().mockResolvedValue(body),
    url,
  }) as unknown as Response & {
    headers: {
      get: ReturnType<typeof vi.fn>;
    };
  };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getWebsiteIconUrlAsync', () => {
  it('resolves the largest manifest icon and verifies it can be downloaded', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        createTextResponse({
          body: '<html><head><link rel="manifest" href="/manifest.json"></head></html>',
          url: 'https://example.com/',
        }),
      )
      .mockResolvedValueOnce(
        createTextResponse({
          body: JSON.stringify({
            icons: [
              { sizes: '48x48', src: '/icon-48.png' },
              { sizes: '512x512', src: '/icon-512.png' },
            ],
          }),
          url: 'https://example.com/manifest.json',
        }),
      )
      .mockResolvedValueOnce(
        createTextResponse({
          body: '',
          url: 'https://example.com/icon-512.png',
        }),
      );

    await expect(getWebsiteIconUrlAsync('https://example.com')).resolves.toBe(
      'https://example.com/icon-512.png',
    );
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://example.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://example.com/manifest.json',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'https://example.com/icon-512.png',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('falls back to apple-touch-icon.png when no declared icon is available', async () => {
    const appleTouchIconResponse = createTextResponse({
      body: '',
      url: 'https://example.com/apple-touch-icon.png',
    });
    appleTouchIconResponse.headers.get.mockReturnValue('image/png');

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        createTextResponse({
          body: '<html><head></head></html>',
          url: 'https://example.com/',
        }),
      )
      .mockResolvedValueOnce(appleTouchIconResponse);

    await expect(getWebsiteIconUrlAsync('https://example.com')).resolves.toBe(
      'https://example.com/apple-touch-icon.png',
    );
  });
});

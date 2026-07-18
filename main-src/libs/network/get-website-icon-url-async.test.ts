/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import getWebsiteIconUrlAsync from './get-website-icon-url-async';

const originalFetch = globalThis.fetch;

const streamChunks = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

const createTextResponse = ({
  body,
  contentLength,
  ok = true,
  status = 200,
  url,
}: {
  body: string;
  contentLength?: string;
  ok?: boolean;
  status?: number;
  url: string;
}) =>
  ({
    body: streamChunks([body]),
    headers: {
      get: vi.fn((name: string) => {
        if (name.toLowerCase() === 'content-length') return contentLength ?? null;
        return null;
      }),
    },
    ok,
    status,
    text: vi.fn().mockResolvedValue(body),
    url,
  }) as unknown as Response & {
    body: ReadableStream<Uint8Array>;
    headers: {
      get: ReturnType<typeof vi.fn>;
    };
  };

const createStreamingResponse = ({
  chunks,
  contentLength,
  ok = true,
  status = 200,
  url,
}: {
  chunks: string[];
  contentLength?: string;
  ok?: boolean;
  status?: number;
  url: string;
}) => {
  const body = chunks.join('');
  return {
    body: streamChunks(chunks),
    headers: {
      get: vi.fn((name: string) => {
        if (name.toLowerCase() === 'content-length') return contentLength ?? null;
        return null;
      }),
    },
    ok,
    status,
    text: vi.fn().mockResolvedValue(body),
    url,
  } as unknown as Response & {
    body: ReadableStream<Uint8Array>;
    headers: {
      get: ReturnType<typeof vi.fn>;
    };
  };
};

beforeEach(() => {
  globalThis.fetch = vi.fn() as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('getWebsiteIconUrlAsync', () => {
  it('resolves the largest manifest icon and verifies it can be downloaded', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;

    fetchMock
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
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://example.com/manifest.json',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://example.com/icon-512.png',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('falls back to apple-touch-icon.png when no declared icon is available', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const appleTouchIconResponse = createTextResponse({
      body: '',
      url: 'https://example.com/apple-touch-icon.png',
    });
    appleTouchIconResponse.headers.get.mockReturnValue('image/png');

    fetchMock
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

  it('rejects an oversized HTML response before reading the full body', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce(
      createTextResponse({
        body: '<html><head><link rel="icon" href="/favicon.ico"></head></html>',
        contentLength: String(1024 * 1024 + 1),
        url: 'https://example.com/',
      }),
    );

    await expect(getWebsiteIconUrlAsync('https://example.com')).rejects.toThrow(
      /exceeds 1048576 bytes/i,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to a declared favicon when the manifest stream grows beyond the limit', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const oversizedManifestChunks = ['{"icons":[', ' '.repeat(1024 * 1024), ']}'];

    fetchMock
      .mockResolvedValueOnce(
        createTextResponse({
          body: [
            '<html><head>',
            '<link rel="manifest" href="/manifest.json">',
            '<link rel="icon" href="/favicon.png">',
            '</head></html>',
          ].join(''),
          url: 'https://example.com/',
        }),
      )
      .mockResolvedValueOnce(
        createStreamingResponse({
          chunks: oversizedManifestChunks,
          url: 'https://example.com/manifest.json',
        }),
      )
      .mockResolvedValueOnce(
        createTextResponse({
          body: '',
          url: 'https://example.com/favicon.png',
        }),
      );

    await expect(getWebsiteIconUrlAsync('https://example.com')).resolves.toBe(
      'https://example.com/favicon.png',
    );
  });
});

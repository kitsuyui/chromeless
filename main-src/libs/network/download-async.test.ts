/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const downloadAsync = require('./download-async');

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

let tmpDir: string;
let dest: string;

beforeEach(() => {
  globalThis.fetch = vi.fn() as typeof fetch;
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'download-async-test-'));
  dest = path.join(tmpDir, 'icon.png');
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('downloadAsync', () => {
  it('does not leave a dest file behind when the response is not ok', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      body: streamChunks(['']),
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as unknown as Response);

    await expect(downloadAsync('https://example.com/icon.png', dest)).rejects.toThrow(
      /Failed to download/,
    );
    expect(fs.existsSync(dest)).toBe(false);
  });

  it('does not leave a dest file behind when the response body is empty', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      body: null,
      ok: true,
      status: 200,
      statusText: 'OK',
    } as unknown as Response);

    await expect(downloadAsync('https://example.com/icon.png', dest)).rejects.toThrow(
      /empty response body/,
    );
    expect(fs.existsSync(dest)).toBe(false);
  });

  it('writes the response body to dest when the download succeeds', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      body: streamChunks(['hello']),
      ok: true,
      status: 200,
      statusText: 'OK',
    } as unknown as Response);

    await downloadAsync('https://example.com/icon.png', dest);
    expect(fs.readFileSync(dest, 'utf8')).toBe('hello');
  });
});

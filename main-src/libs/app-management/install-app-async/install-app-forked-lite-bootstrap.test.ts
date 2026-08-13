/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

import { createTmpPathCleaner, parseInstallOpts } from './install-app-forked-lite-bootstrap';

describe('install app forked lite bootstrap', () => {
  it('does not attempt cleanup before a tmp path exists', async () => {
    const remove = vi.fn(async () => undefined);
    const writeStderr = vi.fn();
    const cleaner = createTmpPathCleaner({ remove, writeStderr });

    await expect(cleaner.removeTmpPath()).resolves.toBeUndefined();

    expect(remove).not.toHaveBeenCalled();
    expect(writeStderr).not.toHaveBeenCalled();
    expect(cleaner.isTmpPathCleaned()).toBe(false);
  });

  it('cleans the tmp path once after initialization', async () => {
    const remove = vi.fn(async () => undefined);
    const cleaner = createTmpPathCleaner({
      remove,
      writeStderr: vi.fn(),
    });

    cleaner.setTmpPath('/tmp/chromeless-worker');

    await cleaner.removeTmpPath();
    await cleaner.removeTmpPath();

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('/tmp/chromeless-worker');
    expect(cleaner.isTmpPathCleaned()).toBe(true);
  });

  it('reports cleanup failures to stderr without rethrowing', async () => {
    const writeStderr = vi.fn();
    const cleaner = createTmpPathCleaner({
      remove: vi.fn(async () => {
        throw new Error('permission denied');
      }),
      writeStderr,
    });

    cleaner.setTmpPath('/tmp/chromeless-worker');

    await expect(cleaner.removeTmpPath()).resolves.toBeUndefined();

    expect(writeStderr).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to remove temporary install directory /tmp/chromeless-worker: Error: permission denied',
      ),
    );
  });

  it('parses install opts when valid JSON is provided', () => {
    expect(parseInstallOpts('{"silent":true}')).toEqual({
      silent: true,
    });
  });

  it('surfaces JSON parse failures for malformed opts', () => {
    expect(() => parseInstallOpts('{')).toThrow(SyntaxError);
  });
});

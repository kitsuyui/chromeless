/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

import { createTmpFileCleaner } from './uninstall-app-forked-bootstrap';

describe('uninstall app forked bootstrap', () => {
  it('does not attempt cleanup before a tmp file path is set', () => {
    const removeSync = vi.fn();
    const writeStderr = vi.fn();
    const cleaner = createTmpFileCleaner({ removeSync, writeStderr });

    cleaner.removeTmpFilePath();

    expect(removeSync).not.toHaveBeenCalled();
    expect(writeStderr).not.toHaveBeenCalled();
  });

  it('removes the tracked tmp file path once', () => {
    const removeSync = vi.fn();
    const cleaner = createTmpFileCleaner({
      removeSync,
      writeStderr: vi.fn(),
    });

    cleaner.setTmpFilePath('/tmp/profiles.ini.tmp');
    cleaner.removeTmpFilePath();
    cleaner.removeTmpFilePath();

    expect(removeSync).toHaveBeenCalledTimes(1);
    expect(removeSync).toHaveBeenCalledWith('/tmp/profiles.ini.tmp');
  });

  it('does not remove a path that was cleared after a successful rename', () => {
    const removeSync = vi.fn();
    const cleaner = createTmpFileCleaner({
      removeSync,
      writeStderr: vi.fn(),
    });

    cleaner.setTmpFilePath('/tmp/profiles.ini.tmp');
    cleaner.clearTmpFilePath();
    cleaner.removeTmpFilePath();

    expect(removeSync).not.toHaveBeenCalled();
  });

  it('reports cleanup failures to stderr without throwing', () => {
    const writeStderr = vi.fn();
    const cleaner = createTmpFileCleaner({
      removeSync: () => {
        throw new Error('permission denied');
      },
      writeStderr,
    });

    cleaner.setTmpFilePath('/tmp/profiles.ini.tmp');

    expect(() => cleaner.removeTmpFilePath()).not.toThrow();
    expect(writeStderr).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to remove temporary file /tmp/profiles.ini.tmp: Error: permission denied',
      ),
    );
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { isWindowsDrivePath, toFileUrlIfLocalPath, toLocalFileUrl } from './local-file-url';

describe('toLocalFileUrl', () => {
  it('escapes reserved URL characters in POSIX file paths', () => {
    expect(toLocalFileUrl('/tmp/a b#c?d%.png')).toBe('file:///tmp/a%20b%23c%3Fd%25.png');
  });

  it('keeps Windows drive paths as file URLs', () => {
    expect(toLocalFileUrl('C:\\Users\\me\\a b#c.png')).toBe('file:///C:/Users/me/a%20b%23c.png');
  });

  it('detects Windows drive paths before URL parsing', () => {
    expect(isWindowsDrivePath('C:/Users/me/icon.png')).toBe(true);
    expect(isWindowsDrivePath('C:\\Users\\me\\icon.png')).toBe(true);
    expect(isWindowsDrivePath('https://example.com/icon.png')).toBe(false);
  });

  it('passes URL values through unchanged', () => {
    expect(toFileUrlIfLocalPath('https://example.com/icon.png')).toBe(
      'https://example.com/icon.png',
    );
    expect(toFileUrlIfLocalPath('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });
});

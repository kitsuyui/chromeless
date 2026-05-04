/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import formatBytes from './index';

describe('formatBytes', () => {
  it('formats zero bytes without scaling', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('scales byte counts using 1024-based units', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('clamps negative decimal precision to an integer display', () => {
    expect(formatBytes(1536, -1)).toBe('2 KB');
  });
});

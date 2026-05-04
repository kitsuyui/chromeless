/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import extractHostname from './extract-hostname';

describe('extractHostname', () => {
  it('normalizes common URL forms to a hostname', () => {
    expect(extractHostname('https://www.example.com:443/path?x=1')).toBe('example.com');
    expect(extractHostname('example.com/path')).toBe('example.com');
  });

  it('returns an empty string for missing input', () => {
    expect(extractHostname('')).toBe('');
  });
});

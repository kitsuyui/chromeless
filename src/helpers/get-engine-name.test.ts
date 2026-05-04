/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import getEngineName from './get-engine-name';

describe('getEngineName', () => {
  it('returns the configured display name for a known browser engine', () => {
    expect(getEngineName('chrome')).toBe('Google Chrome');
    expect(getEngineName('edge')).toBe('Microsoft Edge');
  });

  it('marks tabbed engines in the display name', () => {
    expect(getEngineName('chrome/tabs')).toBe('Google Chrome (tabbed)');
  });

  it('falls back for an unknown browser engine', () => {
    expect(getEngineName('webkit')).toBe('Unknown Engine');
  });
});

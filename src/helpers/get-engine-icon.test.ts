/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import engines from '../constants/engines';
import getEngineIcon from './get-engine-icon';

describe('getEngineIcon', () => {
  it('returns the configured icon path for a known browser engine', () => {
    expect(getEngineIcon('chrome')).toBe(engines.chrome.iconPath);
  });

  it('ignores tabbed mode when resolving the browser engine icon', () => {
    expect(getEngineIcon('chrome/tabs')).toBe(engines.chrome.iconPath);
  });

  it('returns null for an unknown browser engine', () => {
    expect(getEngineIcon('webkit')).toBeNull();
  });
});

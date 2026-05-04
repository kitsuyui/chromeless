/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { selectFirstAvailableIconHref, selectLargestPngIconHref } from './website-icon-selection';

describe('website icon selection', () => {
  it('selects the largest png candidate', () => {
    expect(
      selectLargestPngIconHref([
        { href: '/favicon.ico', sizes: '256x256', type: 'image/png' },
        { href: '/icon-32.png', sizes: '32x32' },
        { href: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ]),
    ).toBe('/icon-192.png');
  });

  it('falls back through icon declaration groups', () => {
    expect(
      selectFirstAvailableIconHref([
        [{ href: '/favicon.ico', sizes: '64x64' }],
        [{ href: '/shortcut.png', sizes: '16x16' }],
        [{ href: '/touch.png', sizes: '180x180' }],
      ]),
    ).toBe('/shortcut.png');
  });
});

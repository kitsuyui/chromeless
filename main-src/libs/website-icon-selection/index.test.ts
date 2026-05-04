/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { selectFirstAvailableIconHref, selectLargestPngIconHref } from './select-icon';

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

  it('uses extension and declared image type to accept png candidates', () => {
    expect(
      selectLargestPngIconHref([
        { href: '/declared', sizes: '96x96', type: 'image/png' },
        { href: '/larger.ico', sizes: '512x512', type: 'image/png' },
        { href: '/largest.png', sizes: '256x256' },
      ]),
    ).toBe('/largest.png');
  });

  it('treats missing and invalid sizes as zero', () => {
    expect(
      selectLargestPngIconHref([
        { href: '/missing-size.png' },
        { href: '/invalid-size.png', sizes: 'auto' },
      ]),
    ).toBe('/invalid-size.png');
  });

  it('keeps the current selection when a later png is smaller', () => {
    expect(
      selectLargestPngIconHref([
        { href: '/large.png', sizes: '256x256' },
        { href: '/small.png', sizes: '32x32' },
      ]),
    ).toBe('/large.png');
  });

  it('ignores candidates without a usable href', () => {
    expect(selectLargestPngIconHref([{ sizes: '512x512', type: 'image/png' }])).toBeUndefined();
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

  it('returns undefined when every icon declaration group is unusable', () => {
    expect(
      selectFirstAvailableIconHref([
        [{ href: '/favicon.ico', sizes: '64x64' }],
        [{ href: '/vector.svg', sizes: '256x256', type: 'image/svg+xml' }],
      ]),
    ).toBeUndefined();
  });
});

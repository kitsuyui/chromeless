/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { selectLargestManifestIconSrc } from './manifest-icon';

describe('manifest icon selection', () => {
  it('selects the largest declared manifest icon', () => {
    expect(
      selectLargestManifestIconSrc(
        JSON.stringify({
          icons: [
            { sizes: '48x48', src: '/icon-48.png' },
            { sizes: '192x192', src: '/icon-192.png' },
            { sizes: '512x512', src: '/icon-512.png' },
          ],
        }),
      ),
    ).toBe('/icon-512.png');
  });

  it('ignores icons without usable src values', () => {
    expect(
      selectLargestManifestIconSrc(
        JSON.stringify({
          icons: [{ sizes: '512x512' }, { sizes: '192x192', src: '/icon-192.png' }],
        }),
      ),
    ).toBe('/icon-192.png');
  });

  it('returns undefined for invalid or unusable manifests', () => {
    expect(selectLargestManifestIconSrc('not-json')).toBeUndefined();
    expect(selectLargestManifestIconSrc(JSON.stringify({}))).toBeUndefined();
    expect(selectLargestManifestIconSrc(JSON.stringify({ icons: [] }))).toBeUndefined();
  });
});

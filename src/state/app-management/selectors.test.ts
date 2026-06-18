/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { getBrowserInstanceAppIds } from './selectors';

describe('app-management selectors', () => {
  it('keeps only browser instances while preserving sort order', () => {
    expect(
      getBrowserInstanceAppIds({
        appManagement: {
          apps: {
            browser: { id: 'browser', name: 'Browser' },
            mail: { id: 'mail', name: 'Mail', url: 'https://mail.example' },
            private: { id: 'private', name: 'Private Browser' },
          },
          sortedAppIds: ['mail', 'private', 'browser'],
        },
      }),
    ).toEqual(['private', 'browser']);
  });

  it('skips ids absent from apps without throwing', () => {
    expect(
      getBrowserInstanceAppIds({
        appManagement: {
          apps: {
            browser: { id: 'browser', name: 'Browser' },
          },
          sortedAppIds: ['orphan', 'browser'],
        },
      }),
    ).toEqual(['browser']);
  });
});

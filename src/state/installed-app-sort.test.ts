/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { getInstalledAppSort } from './installed-app-sort';

describe('installed app sort helpers', () => {
  it('defaults the sort order when no suffix is present', () => {
    expect(getInstalledAppSort('last-updated')).toEqual({
      key: 'last-updated',
      order: 'asc',
    });
  });

  it('keeps explicit descending order', () => {
    expect(getInstalledAppSort('name/desc')).toEqual({
      key: 'name',
      order: 'desc',
    });
  });
});

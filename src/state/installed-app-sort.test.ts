/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { getInstalledAppSort, orderInstalledAppIds } from './installed-app-sort';

const apps = {
  alpha: {
    id: 'alpha',
    lastUpdated: 100,
    name: 'Alpha',
  },
  beta: {
    id: 'beta',
    lastUpdated: 300,
    name: 'Beta',
  },
  gamma: {
    id: 'gamma',
    lastUpdated: 200,
    name: 'Gamma',
  },
};

describe('installed app sort helpers', () => {
  it('defaults last-updated to descending order when no suffix is present', () => {
    expect(getInstalledAppSort('last-updated')).toEqual({
      key: 'last-updated',
      order: 'desc',
    });
  });

  it('defaults name to ascending order when no suffix is present', () => {
    expect(getInstalledAppSort('name')).toEqual({
      key: 'name',
      order: 'asc',
    });
  });

  it('keeps explicit descending order', () => {
    expect(getInstalledAppSort('name/desc')).toEqual({
      key: 'name',
      order: 'desc',
    });
  });

  it('sorts explicit ascending last-updated values from oldest to newest', () => {
    expect(orderInstalledAppIds(['alpha', 'beta', 'gamma'], apps, 'last-updated/asc')).toEqual([
      'alpha',
      'gamma',
      'beta',
    ]);
  });

  it('keeps the default last-updated sort newest first', () => {
    expect(orderInstalledAppIds(['alpha', 'beta', 'gamma'], apps, 'last-updated')).toEqual([
      'beta',
      'gamma',
      'alpha',
    ]);
  });
});

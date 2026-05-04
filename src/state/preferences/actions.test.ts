/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';
import { SET_PREFERENCE, SET_PREFERENCES, SORT_APPS } from '../../constants/actions';
import { setPreference, setPreferences } from './actions';

vi.mock('../app-management/actions', () => ({
  sortApps: () => ({
    type: SORT_APPS,
  }),
}));

describe('preferences actions', () => {
  it('dispatches a single preference update for ordinary preferences', () => {
    const dispatched: object[] = [];

    setPreference(
      'themeSource',
      'dark',
    )((action: object) => {
      dispatched.push(action);
    });

    expect(dispatched).toEqual([
      {
        type: SET_PREFERENCE,
        name: 'themeSource',
        value: 'dark',
      },
    ]);
  });

  it('resorts apps when the installed app sort preference changes', () => {
    const dispatched: object[] = [];

    setPreference(
      'sortInstalledAppBy',
      'name',
    )((action: object) => {
      dispatched.push(action);
    });

    expect(dispatched).toEqual([
      {
        type: SET_PREFERENCE,
        name: 'sortInstalledAppBy',
        value: 'name',
      },
      {
        type: SORT_APPS,
      },
    ]);
  });

  it('resorts apps after replacing all preferences', () => {
    const dispatched: object[] = [];
    const preferences = {
      preferredEngine: 'chrome',
    };

    setPreferences(preferences)((action: object) => {
      dispatched.push(action);
    });

    expect(dispatched).toEqual([
      {
        type: SET_PREFERENCES,
        preferences,
      },
      {
        type: SORT_APPS,
      },
    ]);
  });
});

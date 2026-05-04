/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';
import { SET_PREFERENCE, SET_PREFERENCES } from '../../constants/actions';
import reducer from './reducers';

vi.mock('../../senders', () => ({
  getPreferences: () => ({
    startupPage: 'installed',
    themeSource: 'system',
  }),
}));

describe('preferences reducer', () => {
  it('uses the current persisted preferences as the initial state', () => {
    expect(reducer(undefined, { type: '@@init' })).toEqual({
      startupPage: 'installed',
      themeSource: 'system',
    });
  });

  it('replaces all preferences when a full preference payload arrives', () => {
    expect(
      reducer(
        { startupPage: 'installed' },
        {
          type: SET_PREFERENCES,
          preferences: {
            startupPage: 'browsers',
            themeSource: 'dark',
          },
        },
      ),
    ).toEqual({
      startupPage: 'browsers',
      themeSource: 'dark',
    });
  });

  it('updates one preference without mutating the previous state', () => {
    const previous = {
      startupPage: 'installed',
      themeSource: 'system',
    };

    const next = reducer(previous, {
      type: SET_PREFERENCE,
      name: 'themeSource',
      value: 'light',
    });

    expect(next).toEqual({
      startupPage: 'installed',
      themeSource: 'light',
    });
    expect(previous.themeSource).toBe('system');
  });
});

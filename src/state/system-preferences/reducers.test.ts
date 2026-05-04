/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';
import { SET_SYSTEM_PREFERENCE } from '../../constants/actions';
import reducer from './reducers';

vi.mock('../../senders', () => ({
  getSystemPreferences: () => ({
    useHardwareAcceleration: true,
  }),
}));

describe('system-preferences reducer', () => {
  it('uses the current system preferences as the initial state', () => {
    expect(reducer(undefined, { type: '@@init' })).toEqual({
      useHardwareAcceleration: true,
    });
  });

  it('updates one system preference without mutating the previous state', () => {
    const previous = {
      useHardwareAcceleration: true,
    };

    const next = reducer(previous, {
      type: SET_SYSTEM_PREFERENCE,
      name: 'useHardwareAcceleration',
      value: false,
    });

    expect(next).toEqual({
      useHardwareAcceleration: false,
    });
    expect(previous.useHardwareAcceleration).toBe(true);
  });
});

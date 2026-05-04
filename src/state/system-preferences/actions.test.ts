/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { SET_SYSTEM_PREFERENCE } from '../../constants/actions';
import { setSystemPreference } from './actions';

describe('system-preferences actions', () => {
  it('dispatches one system preference update', () => {
    const dispatched: object[] = [];

    setSystemPreference(
      'useHardwareAcceleration',
      false,
    )((action: object) => {
      dispatched.push(action);
    });

    expect(dispatched).toEqual([
      {
        type: SET_SYSTEM_PREFERENCE,
        name: 'useHardwareAcceleration',
        value: false,
      },
    ]);
  });
});

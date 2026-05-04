/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { BROWSERS_UPDATE_SCROLL_OFFSET } from '../../constants/actions';
import reducer from './reducers';

describe('browsers reducers', () => {
  it('tracks browser list scroll offset', () => {
    expect(
      reducer(undefined, {
        type: BROWSERS_UPDATE_SCROLL_OFFSET,
        scrollOffset: 240,
      }),
    ).toEqual({
      scrollOffset: 240,
    });
  });
});

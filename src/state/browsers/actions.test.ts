/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { BROWSERS_UPDATE_SCROLL_OFFSET } from '../../constants/actions';
import { updateScrollOffset } from './actions';

describe('browsers actions', () => {
  it('creates a scroll offset update action', () => {
    expect(updateScrollOffset(320)).toEqual({
      type: BROWSERS_UPDATE_SCROLL_OFFSET,
      scrollOffset: 320,
    });
  });
});

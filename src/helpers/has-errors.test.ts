/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import hasErrors from './has-errors';

describe('hasErrors', () => {
  it('returns true when any error field has a value', () => {
    expect(
      hasErrors({
        name: 'Mail',
        nameError: null,
        urlError: 'URL is not valid.',
      }),
    ).toBe(true);
  });

  it('ignores non-error fields and empty error values', () => {
    expect(
      hasErrors({
        name: 'Mail',
        nameError: null,
        urlError: '',
      }),
    ).toBe(false);
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { getErrorMessage } from './message';

describe('getErrorMessage', () => {
  it('returns Error messages', () => {
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom');
  });

  it('returns string message fields from error-like objects', () => {
    expect(getErrorMessage({ message: 'No browser engine is available.' })).toBe(
      'No browser engine is available.',
    );
  });

  it('ignores non-string message fields', () => {
    expect(getErrorMessage({ message: 404 })).toBe('');
  });

  it('ignores primitive thrown values', () => {
    expect(getErrorMessage('failed')).toBe('');
  });
});

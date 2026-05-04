/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { getInstallFailureMessage } from './failure-message';

describe('getInstallFailureMessage', () => {
  it('passes through missing engine errors', () => {
    expect(getInstallFailureMessage(new Error('Google Chrome is not installed.'), 'Mail')).toBe(
      'Google Chrome is not installed.',
    );
  });

  it('passes through Chromeless compatibility errors', () => {
    expect(
      getInstallFailureMessage(new Error('Chromeless is outdated for this app.'), 'Mail'),
    ).toBe('Chromeless is outdated for this app.');
  });

  it('falls back to a generic install failure', () => {
    expect(getInstallFailureMessage(new Error('Unexpected'), 'Mail')).toBe(
      'Failed to install Mail.',
    );
  });
});

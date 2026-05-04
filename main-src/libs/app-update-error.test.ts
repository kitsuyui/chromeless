/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { getUpdateFailureMessage } from './app-update-error';

describe('getUpdateFailureMessage', () => {
  it('passes through missing engine errors', () => {
    expect(getUpdateFailureMessage(new Error('Google Chrome is not installed.'), 'Mail')).toBe(
      'Google Chrome is not installed.',
    );
  });

  it('describes applications that are still running', () => {
    expect(getUpdateFailureMessage(new Error('Application is in use.'), 'Mail')).toBe(
      'Failed to update Mail as the application is in use.',
    );
  });

  it('passes through Chromeless compatibility errors', () => {
    expect(getUpdateFailureMessage(new Error('Chromeless is outdated for this app.'), 'Mail')).toBe(
      'Chromeless is outdated for this app.',
    );
  });

  it('falls back to a generic update failure', () => {
    expect(getUpdateFailureMessage(new Error('Unexpected'), 'Mail')).toBe('Failed to update Mail.');
  });
});

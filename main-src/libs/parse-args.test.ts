/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, describe, expect, it } from 'vitest';
import parseStringArgs from './parse-args';

const originalArgv = process.argv;

afterEach(() => {
  process.argv = originalArgv;
});

describe('parseStringArgs', () => {
  it('extracts declared string options from process arguments', () => {
    process.argv = ['electron', 'script.js', '--profile-id', 'work', '--app-id=mail'];

    expect(parseStringArgs(['profile-id', 'app-id'])).toEqual({
      'profile-id': 'work',
      'app-id': 'mail',
    });
  });

  it('keeps undeclared flags as booleans because strict parsing is disabled', () => {
    process.argv = ['electron', 'script.js', '--app-id', 'mail', '--unknown', 'value'];

    expect(parseStringArgs(['app-id'])).toEqual({
      'app-id': 'mail',
      unknown: true,
    });
  });
});

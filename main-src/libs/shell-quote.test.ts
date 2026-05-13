/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import { quoteShellArg } from './shell-quote';

describe('quoteShellArg', () => {
  it('single-quotes shell metacharacters without evaluating them', () => {
    expect(quoteShellArg('Mail $(touch file); $HOME')).toBe("'Mail $(touch file); $HOME'");
  });

  it('escapes embedded single quotes', () => {
    expect(quoteShellArg("Bob's Mail")).toBe("'Bob'\\''s Mail'");
  });

  it('represents an empty value as an empty quoted argument', () => {
    expect(quoteShellArg('')).toBe("''");
    expect(quoteShellArg(null)).toBe("''");
  });
});

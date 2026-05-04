/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('comlink', () => ({
  expose: vi.fn(),
}));

import { filterApps } from './worker';

describe('browsers worker filterApps', () => {
  it('filters sorted app ids by case-insensitive name and URL matches', async () => {
    await expect(
      filterApps(
        {
          docs: { name: 'Docs', url: 'https://docs.example' },
          mail: { name: 'Mail', url: 'https://mail.example' },
          notes: { name: 'Notes' },
        },
        ['mail', 'docs', 'notes'],
        ' EXAMPLE ',
      ),
    ).resolves.toEqual(['mail', 'docs']);
  });
});

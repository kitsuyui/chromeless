/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('comlink', () => ({
  expose: vi.fn(),
}));

import { filterApps } from './worker';

describe('installed worker filterApps', () => {
  it('keeps original sort order while filtering by name and URL', async () => {
    await expect(
      filterApps(
        {
          calendar: { name: 'Calendar', url: 'https://calendar.example' },
          mail: { name: 'Mail', url: 'https://mail.example' },
          notes: { name: 'Notes' },
        },
        ['notes', 'calendar', 'mail'],
        'mail',
      ),
    ).resolves.toEqual(['mail']);
  });
});

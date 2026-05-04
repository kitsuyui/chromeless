/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { buildEditAppSubmission } from './save-submission';

describe('buildEditAppSubmission', () => {
  it('returns validation changes for invalid edits', () => {
    expect(
      buildEditAppSubmission({
        defaultIcon: 'default.png',
        form: { id: 'mail', name: 'Mail:Team', url: '' },
      }),
    ).toMatchObject({
      changes: {
        nameError: 'Name cannot contain any of the following characters: / : or NUL.',
        urlError: 'URL is required.',
      },
      status: 'invalid',
    });
  });

  it('builds a ready update payload without mutating opts', () => {
    const opts = { category: 'Productivity' };

    expect(
      buildEditAppSubmission({
        defaultIcon: 'default.png',
        form: {
          id: 'mail',
          internetIcon: 'internet.png',
          name: 'Mail',
          opts,
          url: 'mail.example',
        },
      }),
    ).toEqual({
      payload: {
        icon: 'internet.png',
        id: 'mail',
        name: 'Mail',
        opts: { category: 'Productivity' },
        url: 'http://mail.example',
      },
      status: 'ready',
    });

    expect(opts).toEqual({ category: 'Productivity' });
  });

  it('preserves absolute URLs and converts disabled URLs to null', () => {
    expect(
      buildEditAppSubmission({
        defaultIcon: 'default.png',
        form: {
          icon: 'icon.png',
          id: 'mail',
          name: 'Mail',
          url: 'https://mail.example',
          urlDisabled: false,
        },
      }),
    ).toMatchObject({
      payload: {
        icon: 'icon.png',
        url: 'https://mail.example',
      },
      status: 'ready',
    });

    expect(
      buildEditAppSubmission({
        defaultIcon: 'default.png',
        form: { id: 'local', name: 'Local', url: '', urlDisabled: true },
      }),
    ).toMatchObject({
      payload: {
        icon: 'default.png',
        url: null,
      },
      status: 'ready',
    });
  });
});

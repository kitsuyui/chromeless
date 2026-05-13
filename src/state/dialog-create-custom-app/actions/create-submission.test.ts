/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { buildCreateCustomAppSubmission } from './create-submission';

describe('buildCreateCustomAppSubmission', () => {
  it('returns validation changes before preparing an app install payload', () => {
    expect(
      buildCreateCustomAppSubmission({
        defaultIcon: 'default.png',
        form: { name: '', url: 'not a url' },
        nameExists: false,
        id: '123',
      }),
    ).toMatchObject({
      changes: {
        nameError: 'Name is required.',
        urlError: 'URL is not valid.',
      },
      status: 'invalid',
    });
  });

  it('returns duplicate-name copy after validation succeeds', () => {
    expect(
      buildCreateCustomAppSubmission({
        defaultIcon: 'default.png',
        form: { name: 'Mail', url: 'mail.example' },
        nameExists: true,
        id: '123',
      }),
    ).toEqual({
      message: 'An app named Mail already exists.',
      status: 'duplicate',
    });
  });

  it('builds a ready custom app payload with stable id, URL, icon, and slug contracts', () => {
    expect(
      buildCreateCustomAppSubmission({
        defaultIcon: 'default.png',
        form: { internetIcon: 'internet.png', name: 'Team Mail', url: 'mail.example' },
        nameExists: false,
        id: '123',
      }),
    ).toEqual({
      payload: {
        icon: 'internet.png',
        id: 'custom-123',
        name: 'Team Mail',
        opts: { slug: 'team-mail' },
        url: 'http://mail.example',
      },
      status: 'ready',
    });
  });

  it('uses a null URL and default icon for URL-disabled apps', () => {
    expect(
      buildCreateCustomAppSubmission({
        defaultIcon: 'default.png',
        form: { name: 'Local Tool', url: '', urlDisabled: true },
        nameExists: false,
        id: '456',
      }),
    ).toMatchObject({
      payload: {
        icon: 'default.png',
        id: 'custom-456',
        url: null,
      },
      status: 'ready',
    });
  });

  it('preserves explicit icons and absolute URLs when no slug can be generated', () => {
    expect(
      buildCreateCustomAppSubmission({
        defaultIcon: 'default.png',
        form: { icon: 'custom.png', name: '日本', url: 'https://tool.example' },
        nameExists: false,
        id: '789',
      }),
    ).toEqual({
      payload: {
        icon: 'custom.png',
        id: 'custom-789',
        name: '日本',
        opts: {},
        url: 'https://tool.example',
      },
      status: 'ready',
    });
  });
});

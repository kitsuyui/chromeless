/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import validate from './validate';

describe('validate', () => {
  it('marks required fields as invalid when they are empty', () => {
    const result = validate(
      { name: '' },
      {
        name: {
          fieldName: 'Name',
          required: true,
        },
      },
    );

    expect(result).toEqual({
      name: '',
      nameError: 'Name is required.',
    });
  });

  it('accepts strict and less-strict URLs according to their rules', () => {
    expect(
      validate(
        { website: 'example.com' },
        {
          website: {
            fieldName: 'Website',
            lessStrictUrl: true,
          },
        },
      ),
    ).toMatchObject({ websiteError: null });

    expect(
      validate(
        { website: 'example.com' },
        {
          website: {
            fieldName: 'Website',
            url: true,
          },
        },
      ),
    ).toMatchObject({ websiteError: 'Website is not valid.' });
  });

  it('rejects path separators that would create nested or invalid app names', () => {
    const result = validate(
      { appName: 'Mail/Work' },
      {
        appName: {
          fieldName: 'App name',
          filePath: true,
        },
      },
    );

    expect(result).toMatchObject({
      appNameError: 'App name cannot contain any of the following characters: / : or NUL.',
    });
  });
});

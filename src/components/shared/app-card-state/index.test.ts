/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import packageJson from '../../../../package.json';
import { INSTALLED } from '../../../constants/app-statuses';
import type { RootState } from '../../../state';
import { selectAppCardProps } from './index';

const closedDialogState = {
  form: {},
  open: false,
};

const createState = () =>
  ({
    appManagement: {
      apps: {
        mail: {
          cancelable: true,
          engine: 'chrome',
          icon: '/tmp/mail.png',
          icon128: '/tmp/mail-128.png',
          id: 'mail',
          name: 'Mail',
          opts: {
            category: 'Productivity',
          },
          status: INSTALLED,
          url: 'https://example.com',
          version: packageJson.scriptVersion,
        },
      },
      scanning: false,
      sortedAppIds: ['mail'],
    },
    browsers: {
      scrollOffset: 0,
    },
    dialogChooseEngine: closedDialogState,
    dialogCreateCustomApp: {
      ...closedDialogState,
      downloadingIcon: false,
    },
    dialogEditApp: {
      ...closedDialogState,
      downloadingIcon: false,
      savable: false,
    },
    dialogSetInstallationPath: closedDialogState,
    dialogSetPreferredEngine: closedDialogState,
    installed: {
      activeQuery: '',
      filteredSortedAppIds: null,
      isSearching: false,
      query: '',
      scrollOffset: 0,
    },
    preferences: {},
    systemPreferences: {},
  }) satisfies RootState;

describe('selectAppCardProps', () => {
  it('maps app card props from the current root state contract', () => {
    expect(selectAppCardProps(createState(), { id: 'mail' })).toEqual({
      cancelable: true,
      category: 'Productivity',
      engine: 'chrome',
      icon: '/tmp/mail.png',
      iconThumbnail: '/tmp/mail-128.png',
      isOutdated: false,
      name: 'Mail',
      opts: {
        category: 'Productivity',
      },
      status: INSTALLED,
      url: 'https://example.com',
      version: packageJson.scriptVersion,
    });
  });

  it('lets explicit own props override persisted app fields', () => {
    expect(
      selectAppCardProps(createState(), {
        category: 'Custom',
        icon: '/tmp/custom.png',
        iconThumbnail: '/tmp/custom-128.png',
        id: 'mail',
        name: 'Custom Mail',
        url: 'https://custom.example.com',
      }),
    ).toMatchObject({
      category: 'Custom',
      icon: '/tmp/custom.png',
      iconThumbnail: '/tmp/custom-128.png',
      name: 'Custom Mail',
      url: 'https://custom.example.com',
    });
  });

  it('returns safe empty values while an app is not yet loaded', () => {
    expect(selectAppCardProps(createState(), { id: 'missing', icon: '/tmp/new.png' })).toEqual({
      cancelable: false,
      category: undefined,
      engine: null,
      icon: '/tmp/new.png',
      iconThumbnail: null,
      isOutdated: true,
      name: undefined,
      opts: undefined,
      status: null,
      url: null,
      version: null,
    });
  });
});

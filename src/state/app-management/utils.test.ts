/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import packageJson from '../../../package.json';
import { INSTALLED, INSTALLING, UNINSTALLING } from '../../constants/app-statuses';
import {
  getAppBadgeCount,
  getCancelableAppsAsList,
  getInstalledAppCount,
  getInstallingAppsAsList,
  getOutdatedAppsAsList,
  isInstalledApp,
  isNameExisted,
  isOutdatedApp,
} from './utils';

const currentVersion = packageJson.scriptVersion;

const createState = () => ({
  appManagement: {
    apps: {
      current: {
        id: 'current',
        name: 'Current App',
        status: INSTALLED,
        version: currentVersion,
      },
      old: {
        id: 'old',
        name: 'Old App',
        status: INSTALLED,
        version: '0.0.1',
      },
      installing: {
        id: 'installing',
        name: 'Installing App',
        status: INSTALLING,
        version: '',
      },
      uninstalling: {
        id: 'uninstalling',
        name: 'Uninstalling App',
        status: UNINSTALLING,
        version: currentVersion,
        cancelable: true,
      },
    },
    sortedAppIds: ['current', 'old', 'installing', 'uninstalling'],
  },
});

describe('app-management utils', () => {
  it('identifies installed and outdated apps', () => {
    const state = createState();

    expect(isInstalledApp('current', state)).toBe(true);
    expect(isInstalledApp('installing', state)).toBe(false);
    expect(isOutdatedApp('current', state)).toBe(false);
    expect(isOutdatedApp('old', state)).toBe(true);
    expect(isOutdatedApp('missing', state)).toBe(true);
    expect(isOutdatedApp('installing', state)).toBe(false);
  });

  it('derives app lists from sorted ids', () => {
    const state = createState();

    expect(getOutdatedAppsAsList(state).map((app) => app.id)).toEqual(['old']);
    expect(getCancelableAppsAsList(state).map((app) => app.id)).toEqual(['uninstalling']);
    expect(getInstallingAppsAsList(state).map((app) => app.id)).toEqual([
      'installing',
      'uninstalling',
    ]);
  });

  it('counts installed apps and badge-worthy apps', () => {
    const state = createState();

    expect(getInstalledAppCount(state)).toBe(2);
    expect(getAppBadgeCount(state)).toBe(3);
  });

  it('checks app name collisions', () => {
    const state = createState();

    expect(isNameExisted('Old App', state)).toBe(true);
    expect(isNameExisted('New App', state)).toBe(false);
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import {
  CLEAN_APP_MANAGEMENT,
  REMOVE_APP,
  SET_APP,
  SET_SCANNING_FOR_INSTALLED,
  SORT_APPS,
} from '../../constants/actions';
import { INSTALLED, INSTALLING, UNINSTALLING } from '../../constants/app-statuses';
import reducer from './reducers';

const apps = {
  alpha: {
    id: 'alpha',
    lastUpdated: 100,
    name: 'Alpha',
    status: INSTALLED,
  },
  beta: {
    id: 'beta',
    lastUpdated: 300,
    name: 'Beta',
    status: INSTALLED,
  },
  gamma: {
    id: 'gamma',
    lastUpdated: 200,
    name: 'Gamma',
    status: INSTALLING,
  },
};

describe('app-management reducers', () => {
  it('adds and merges apps without mutating the previous app record', () => {
    const state = reducer(
      {
        apps: {
          alpha: apps.alpha,
        },
        scanning: true,
        sortedAppIds: ['alpha'],
      },
      {
        type: SET_APP,
        app: {
          lastUpdated: 400,
          name: 'Alpha Mail',
        },
        apps,
        id: 'alpha',
        sortInstalledAppBy: 'name',
      },
    );

    expect(state.apps).toMatchObject({
      alpha: {
        id: 'alpha',
        lastUpdated: 400,
        name: 'Alpha Mail',
        status: INSTALLED,
      },
    });
    expect(apps.alpha.name).toBe('Alpha');
  });

  it('inserts new app ids at their sorted position', () => {
    const state = reducer(
      {
        apps,
        scanning: false,
        sortedAppIds: ['beta'],
      },
      {
        type: SET_APP,
        app: apps.alpha,
        apps,
        id: 'alpha',
        sortInstalledAppBy: 'name',
      },
    );

    expect(state.sortedAppIds).toEqual(['alpha', 'beta']);
  });

  it('resorts ids by newest update by default', () => {
    const state = reducer(
      {
        apps,
        scanning: false,
        sortedAppIds: ['alpha', 'beta', 'gamma'],
      },
      {
        type: SORT_APPS,
        apps,
        sortInstalledAppBy: 'last-updated',
      },
    );

    expect(state.sortedAppIds).toEqual(['beta', 'gamma', 'alpha']);
  });

  it('removes app ids and keeps only installing records during cleanup', () => {
    let state = reducer(
      {
        apps,
        scanning: false,
        sortedAppIds: ['alpha', 'beta', 'gamma'],
      },
      {
        type: REMOVE_APP,
        id: 'beta',
      },
    );

    expect(state.apps).not.toHaveProperty('beta');
    expect(state.sortedAppIds).toEqual(['alpha', 'gamma']);

    state = reducer(state, {
      type: CLEAN_APP_MANAGEMENT,
      apps,
    });

    expect(state.apps).toEqual({
      gamma: apps.gamma,
    });
    expect(state.sortedAppIds).toEqual(['gamma']);
    expect(state.scanning).toBe(true);
  });

  it('keeps uninstalling apps during cleanup', () => {
    const appsWithUninstalling = {
      ...apps,
      delta: {
        id: 'delta',
        lastUpdated: 50,
        name: 'Delta',
        status: UNINSTALLING,
      },
    };

    const state = reducer(
      {
        apps: appsWithUninstalling,
        scanning: false,
        sortedAppIds: ['alpha', 'beta', 'gamma', 'delta'],
      },
      {
        type: CLEAN_APP_MANAGEMENT,
        apps: appsWithUninstalling,
      },
    );

    expect(state.apps).toEqual({
      gamma: appsWithUninstalling.gamma,
      delta: appsWithUninstalling.delta,
    });
    expect(state.sortedAppIds).toEqual(['gamma', 'delta']);
    expect(state.scanning).toBe(true);
  });

  it('drops stale ids absent from action.apps during cleanup without throwing', () => {
    const state = reducer(
      {
        apps: {
          gamma: apps.gamma,
          orphan: { id: 'orphan', lastUpdated: 0, name: 'Orphan', status: INSTALLING },
        },
        scanning: false,
        sortedAppIds: ['gamma', 'orphan'],
      },
      {
        type: CLEAN_APP_MANAGEMENT,
        apps: { gamma: apps.gamma }, // orphan is absent from action.apps
      },
    );

    expect(state.sortedAppIds).toEqual(['gamma']);
  });

  it('updates the installed app scan flag', () => {
    const state = reducer(undefined, {
      type: SET_SCANNING_FOR_INSTALLED,
      scanning: false,
    });

    expect(state.scanning).toBe(false);
  });
});

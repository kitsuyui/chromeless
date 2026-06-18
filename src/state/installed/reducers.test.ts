/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import {
  CLEAN_APP_MANAGEMENT,
  INSTALLED_SET_IS_SEARCHING,
  INSTALLED_UPDATE_ACTIVE_QUERY,
  INSTALLED_UPDATE_QUERY,
  INSTALLED_UPDATE_SCROLL_OFFSET,
  REMOVE_APP,
  SET_APP,
  SORT_APPS,
} from '../../constants/actions';
import { INSTALLED, INSTALLING } from '../../constants/app-statuses';
import reducer from './reducers';

const apps = {
  alpha: {
    id: 'alpha',
    lastUpdated: 100,
    name: 'Alpha',
    status: INSTALLED,
    url: 'https://alpha.example',
  },
  beta: {
    id: 'beta',
    lastUpdated: 300,
    name: 'Beta',
    status: INSTALLED,
    url: 'https://beta.example',
  },
  gamma: {
    id: 'gamma',
    lastUpdated: 200,
    name: 'Gamma',
    status: INSTALLING,
    url: 'https://gamma.example',
  },
};

describe('installed reducers', () => {
  it('updates search state and scroll offset independently', () => {
    let state = reducer(undefined, { type: '@@init' });

    state = reducer(state, { type: INSTALLED_SET_IS_SEARCHING, isSearching: true });
    state = reducer(state, { type: INSTALLED_UPDATE_QUERY, query: 'mail' });
    state = reducer(state, { type: INSTALLED_UPDATE_ACTIVE_QUERY, activeQuery: 'mail' });
    state = reducer(state, { type: INSTALLED_UPDATE_SCROLL_OFFSET, scrollOffset: 120 });

    expect(state).toMatchObject({
      activeQuery: 'mail',
      isSearching: true,
      query: 'mail',
      scrollOffset: 120,
    });
  });

  it('sorts and removes filtered app ids from installed app results', () => {
    let state = reducer(
      { filteredSortedAppIds: ['alpha', 'beta', 'gamma'] },
      {
        type: SORT_APPS,
        apps,
        sortInstalledAppBy: 'last-updated',
      },
    );

    expect(state.filteredSortedAppIds).toEqual(['beta', 'gamma', 'alpha']);

    state = reducer(state, { type: REMOVE_APP, id: 'gamma' });

    expect(state.filteredSortedAppIds).toEqual(['beta', 'alpha']);
  });

  it('respects explicit descending sort order for installed app results', () => {
    const state = reducer(
      { filteredSortedAppIds: ['alpha', 'beta', 'gamma'] },
      {
        type: SORT_APPS,
        apps,
        sortInstalledAppBy: 'last-updated/desc',
      },
    );

    expect(state.filteredSortedAppIds).toEqual(['beta', 'gamma', 'alpha']);
  });

  it('keeps only installing apps when app management is cleaned', () => {
    const state = reducer(
      { filteredSortedAppIds: ['alpha', 'gamma'] },
      {
        type: CLEAN_APP_MANAGEMENT,
        apps,
      },
    );

    expect(state.filteredSortedAppIds).toEqual(['gamma']);
  });

  it('drops stale ids absent from action.apps during cleanup without throwing', () => {
    const state = reducer(
      { filteredSortedAppIds: ['gamma', 'orphan'] },
      {
        type: CLEAN_APP_MANAGEMENT,
        apps: { gamma: apps.gamma }, // orphan is absent from action.apps
      },
    );

    expect(state.filteredSortedAppIds).toEqual(['gamma']);
  });

  it('inserts matching apps into sorted search results', () => {
    const state = reducer(
      { filteredSortedAppIds: ['beta'] },
      {
        type: SET_APP,
        activeQuery: 'example',
        app: apps.alpha,
        apps,
        id: 'alpha',
        sortInstalledAppBy: 'name',
      },
    );

    expect(state.filteredSortedAppIds).toEqual(['alpha', 'beta']);
  });

  it('repositions an existing app when its sorting value changes', () => {
    const state = reducer(
      { filteredSortedAppIds: ['beta', 'alpha'] },
      {
        type: SET_APP,
        activeQuery: 'example',
        app: { lastUpdated: 400 },
        apps,
        id: 'alpha',
        sortInstalledAppBy: 'last-updated',
      },
    );

    expect(state.filteredSortedAppIds).toEqual(['alpha', 'beta']);
  });
});

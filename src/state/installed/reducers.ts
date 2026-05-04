/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { orderBy, sortedIndexBy, without } from 'lodash';
import { combineReducers } from 'redux';

import {
  CLEAN_APP_MANAGEMENT,
  INSTALLED_SET_IS_SEARCHING,
  INSTALLED_UPDATE_ACTIVE_QUERY,
  INSTALLED_UPDATE_QUERY,
  INSTALLED_UPDATE_SCROLL_OFFSET,
  INSTALLED_UPDATE_SORTED_APP_IDS,
  REMOVE_APP,
  SET_APP,
  SORT_APPS,
} from '../../constants/actions';

import { INSTALLING } from '../../constants/app-statuses';

const isSearching = (state = false, action) => {
  switch (action.type) {
    case INSTALLED_SET_IS_SEARCHING:
      return action.isSearching;
    default:
      return state;
  }
};

const query = (state = '', action) => {
  switch (action.type) {
    case INSTALLED_UPDATE_QUERY:
      return action.query;
    default:
      return state;
  }
};

const activeQuery = (state = '', action) => {
  switch (action.type) {
    case INSTALLED_UPDATE_ACTIVE_QUERY:
      return action.activeQuery;
    default:
      return state;
  }
};

const iterateeFunc = (app, sortInstalledAppBy) => {
  if (sortInstalledAppBy === 'name') {
    return app.name;
  }
  // action.sortInstalledAppBy === 'last-updated'
  return -(app.lastUpdated || 0);
};

const appMatchesQuery = (app, query) => {
  const processedQuery = query.trim().toLowerCase();
  const appName = app.name.toLowerCase();
  const appUrl = app.url ? app.url.toLowerCase() : '';

  return appName.includes(processedQuery) || appUrl.includes(processedQuery);
};

const buildCurrentApp = (action) => ({ ...action.apps[action.id], ...action.app });

const insertSortedAppId = (state, action) => {
  const newState = [...state];
  const index = sortedIndexBy(newState, action.id, (id) => {
    const app = id === action.id ? buildCurrentApp(action) : action.apps[id];
    return iterateeFunc(app, action.sortInstalledAppBy);
  });
  newState.splice(index, 0, action.id);
  return newState;
};

const sortingValueChanged = (action) =>
  (action.sortInstalledAppBy === 'name' && action.app.name) ||
  (action.sortInstalledAppBy === 'last-updated' && action.app.lastUpdated);

const updateFilteredSortedAppIdsForSetApp = (state, action) => {
  const currentApp = buildCurrentApp(action);
  if (!appMatchesQuery(currentApp, action.activeQuery)) return state;

  if (state.indexOf(action.id) < 0) {
    return insertSortedAppId(state, action);
  }

  if (!sortingValueChanged(action)) return state;

  return insertSortedAppId(without(state, action.id), action);
};

const filteredSortedAppIds = (state = null, action) => {
  switch (action.type) {
    case INSTALLED_UPDATE_SORTED_APP_IDS: {
      return action.sortedAppIds;
    }
    case CLEAN_APP_MANAGEMENT: {
      // keep apps which are in installing/updating state
      if (!state) return null;
      const newLst = state.filter((id) => action.apps[id].status === INSTALLING);
      return newLst;
    }
    case SET_APP: {
      if (!state) return null;
      return updateFilteredSortedAppIdsForSetApp(state, action);
    }
    case REMOVE_APP: {
      if (!state) return null;
      return without(state, action.id);
    }
    case SORT_APPS: {
      if (!state) return null;
      // resort
      return orderBy(state, (id) => {
        const app = action.apps[id];
        return iterateeFunc(app, action.sortInstalledAppBy);
      });
    }
    default:
      return state;
  }
};

const scrollOffset = (state = 0, action) => {
  switch (action.type) {
    case INSTALLED_UPDATE_SCROLL_OFFSET:
      return action.scrollOffset;
    default:
      return state;
  }
};

export default combineReducers({
  activeQuery,
  filteredSortedAppIds,
  isSearching,
  query,
  scrollOffset,
});

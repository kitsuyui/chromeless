/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { without } from 'lodash';
import { combineReducers } from 'redux';
import {
  CLEAN_APP_MANAGEMENT,
  REMOVE_APP,
  SET_APP,
  SET_SCANNING_FOR_INSTALLED,
  SORT_APPS,
} from '../../constants/actions';
import { INSTALLING, UNINSTALLING } from '../../constants/app-statuses';
import { getInstalledAppSort, orderInstalledAppIds } from '../installed-app-sort';

const apps = (state = {}, action) => {
  switch (action.type) {
    case CLEAN_APP_MANAGEMENT: {
      // keep apps which are in installing or uninstalling state
      const overwritingState = {};
      Object.keys(state).forEach((id) => {
        if (state[id].status === INSTALLING || state[id].status === UNINSTALLING) {
          overwritingState[id] = state[id];
        }
      });

      return overwritingState;
    }
    case SET_APP: {
      const overwritingState = {};
      overwritingState[action.id] = { ...(state[action.id] || {}), ...action.app };

      return { ...state, ...overwritingState };
    }
    case REMOVE_APP: {
      const newState = { ...state };
      delete newState[action.id];
      return newState;
    }
    default:
      return state;
  }
};

const sortedAppIds = (state = [], action) => {
  switch (action.type) {
    case CLEAN_APP_MANAGEMENT: {
      // keep apps which are in installing or uninstalling state
      const newLst = state.filter(
        (id) => action.apps[id].status === INSTALLING || action.apps[id].status === UNINSTALLING,
      );
      return newLst;
    }
    case SET_APP: {
      const currentApps = {
        ...action.apps,
        [action.id]: { ...(action.apps[action.id] || {}), ...action.app },
      };
      // if id is not in list, insert at sorted position
      if (state.indexOf(action.id) < 0) {
        return orderInstalledAppIds([...state, action.id], currentApps, action.sortInstalledAppBy);
      }
      // if sorting value is updated, remove and reinsert id at new index
      const { key } = getInstalledAppSort(action.sortInstalledAppBy);
      if (
        (key === 'name' && action.app.name) ||
        (key === 'last-updated' && action.app.lastUpdated)
      ) {
        return orderInstalledAppIds(state, currentApps, action.sortInstalledAppBy);
      }
      return state;
    }
    case REMOVE_APP: {
      return without(state, action.id);
    }
    case SORT_APPS: {
      return orderInstalledAppIds(state, action.apps, action.sortInstalledAppBy);
    }
    default:
      return state;
  }
};

const scanning = (state = true, action) => {
  switch (action.type) {
    case CLEAN_APP_MANAGEMENT:
      return true;
    case SET_SCANNING_FOR_INSTALLED:
      return action.scanning;
    default:
      return state;
  }
};

export default combineReducers({
  apps,
  sortedAppIds,
  scanning,
});

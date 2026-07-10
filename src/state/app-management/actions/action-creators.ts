/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import {
  CLEAN_APP_MANAGEMENT,
  REMOVE_APP,
  SET_APP,
  SET_SCANNING_FOR_INSTALLED,
  SORT_APPS,
} from '../../../constants/actions';
import type {
  AppInstallOptions,
  AppIpcEngine,
  AppIpcIcon,
  AppIpcId,
  AppIpcName,
  AppIpcUrl,
} from '../../../senders';
import { requestInstallApp, requestShowMessageBox, requestUpdateApp } from '../../../senders';
import { getOutdatedAppsAsList, isNameExisted } from '../utils';

export const clean = () => (dispatch, getState) => {
  const state = getState();
  const { apps } = state.appManagement;

  dispatch({
    type: CLEAN_APP_MANAGEMENT,
    apps,
  });
};

export const setApp = (id, app) => (dispatch, getState) => {
  const state = getState();
  const { sortInstalledAppBy } = state.preferences;
  const { apps } = state.appManagement;
  const { activeQuery } = state.installed || '';

  dispatch({
    type: SET_APP,
    id,
    app,
    apps,
    sortInstalledAppBy,
    activeQuery,
  });
};

export const removeApp = (id) => ({
  type: REMOVE_APP,
  id,
});

export const installApp =
  (
    engine: AppIpcEngine,
    id: AppIpcId,
    name: AppIpcName,
    url: AppIpcUrl,
    icon: AppIpcIcon,
    opts: AppInstallOptions,
  ) =>
  (dispatch, getState) => {
    const state = getState();

    const sanitizedName = name.trim();
    if (isNameExisted(sanitizedName, state)) {
      requestShowMessageBox(`An app named ${sanitizedName} already exists.`, 'error');
      return null;
    }

    requestInstallApp(engine, id, sanitizedName, url, icon, opts);
    return null;
  };

export const updateApp =
  (
    id: AppIpcId,
    nameOverride: AppIpcName | undefined = undefined,
    urlOverride: AppIpcUrl | undefined = undefined,
    iconOverride: AppIpcIcon | undefined = undefined,
    optsOverride: AppInstallOptions = {},
  ) =>
  async (dispatch, getState) => {
    const appObj = getState().appManagement.apps[id];
    const { engine } = appObj;
    // null/undefined/'' for name and icon all fall back to the existing value
    const name = nameOverride || appObj.name;
    // url uses strict undefined check: null is a valid value that clears the url
    const url = urlOverride !== undefined ? urlOverride : appObj.url;
    const icon = iconOverride || appObj.icon;
    const opts = { ...appObj.opts, ...optsOverride };

    requestUpdateApp(engine, id, name, url, icon, opts);
  };

export const updateApps = (apps) => (dispatch) => {
  apps.forEach((app) => dispatch(updateApp(app.id)));
};

export const updateAllApps = () => (dispatch, getState) => {
  const state = getState();

  const outdatedApps = getOutdatedAppsAsList(state);

  outdatedApps.forEach((app) => dispatch(updateApp(app.id)));

  return null;
};

export const setScanningForInstalled = (scanning) => ({
  type: SET_SCANNING_FOR_INSTALLED,
  scanning,
});

export const sortApps = () => (dispatch, getState) => {
  const state = getState();
  const { sortInstalledAppBy } = state.preferences;
  const { apps } = state.appManagement;

  dispatch({
    type: SORT_APPS,
    apps,
    sortInstalledAppBy,
  });
};

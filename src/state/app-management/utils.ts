/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import semver from 'semver';
import packageJson from '../../../package.json';
import { INSTALLED, INSTALLING } from '../../constants/app-statuses';

const { scriptVersion } = packageJson;

export const isInstalledApp = (id, state) => {
  const { apps } = state.appManagement;
  return apps[id] && apps[id].status === INSTALLED;
};

export const isOutdatedApp = (id, state) => {
  const { apps } = state.appManagement;

  if (!apps[id]) return true;

  const appDetails = apps[id];

  // check if app is installing
  if (appDetails.status === INSTALLING) return false;

  const v = appDetails.version;

  return semver.lt(v, scriptVersion);
};

export const isCancelableApp = (id, state) => {
  const { apps } = state.appManagement;
  return apps[id] && apps[id].cancelable;
};

export const getOutdatedAppsAsList = (state) => {
  const { apps, sortedAppIds } = state.appManagement;
  return sortedAppIds
    .filter((id) => apps[id] != null)
    .map((id) => apps[id])
    .filter((app) => isOutdatedApp(app.id, state));
};

export const getCancelableAppsAsList = (state) => {
  const { apps, sortedAppIds } = state.appManagement;
  return sortedAppIds
    .filter((id) => apps[id] != null)
    .map((id) => apps[id])
    .filter((app) => isCancelableApp(app.id, state));
};

export const getInstallingAppsAsList = (state) => {
  const { apps, sortedAppIds } = state.appManagement;
  return sortedAppIds
    .filter((id) => apps[id] != null)
    .map((id) => apps[id])
    .filter((app) => app.status !== INSTALLED);
};

export const getInstalledAppCount = (state) => {
  const { apps, sortedAppIds } = state.appManagement;
  return sortedAppIds.filter((id) => {
    const app = apps[id];
    if (!app) return false;
    return app.status === INSTALLED || (app.status === INSTALLING && app.version);
  }).length;
};

export const getAppBadgeCount = (state) => {
  const { apps } = state.appManagement;
  return (Object.values(apps) as Array<{ id: string; status: string }>).filter(
    (app) => isOutdatedApp(app.id, state) || app.status !== INSTALLED,
  ).length;
};

export const isNameExisted = (name, state) => {
  const { apps } = state.appManagement;
  return Boolean(
    Object.keys(apps).find((id) => {
      if (apps[id].name === name) {
        return true;
      }

      return false;
    }),
  );
};

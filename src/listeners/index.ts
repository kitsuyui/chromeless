/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { batch } from 'react-redux';

import {
  clean as cleanAppManagement,
  removeApp,
  setApp,
  setScanningForInstalled,
} from '../state/app-management/actions';
import { setPreference, setPreferences } from '../state/preferences/actions';
import { setSystemPreference } from '../state/system-preferences/actions';

const loadListeners = (store) => {
  window.ipcRenderer.on('log', (e, message) => {
    // eslint-disable-next-line
    if (message) console.log(message);
  });

  window.ipcRenderer.on('clean-app-management', () => {
    store.dispatch(cleanAppManagement());
  });

  window.ipcRenderer.on('set-app', (e, id, app) => {
    store.dispatch(setApp(id, app));
  });

  window.ipcRenderer.on('set-app-batch', (e, apps) => {
    batch(() => {
      apps.forEach((app) => {
        store.dispatch(setApp(app.id, app));
      });
    });
  });

  window.ipcRenderer.on('remove-app', (e, id) => store.dispatch(removeApp(id)));

  window.ipcRenderer.on('set-preference', (e, name, value) => {
    store.dispatch(setPreference(name, value));
  });

  window.ipcRenderer.on('set-preferences', (e, newState) => {
    store.dispatch(setPreferences(newState));
  });

  window.ipcRenderer.on('set-system-preference', (e, name, value) => {
    store.dispatch(setSystemPreference(name, value));
  });

  window.ipcRenderer.on('set-scanning-for-installed', (e, scanning) => {
    store.dispatch(setScanningForInstalled(scanning));
  });
};

export default loadListeners;

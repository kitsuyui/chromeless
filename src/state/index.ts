/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk as thunkMiddleware } from 'redux-thunk';

import appManagement from './app-management/reducers';
import dialogChooseEngine from './dialog-choose-engine/reducers';
import dialogCreateCustomApp from './dialog-create-custom-app/reducers';
import dialogEditApp from './dialog-edit-app/reducers';
import dialogSetInstallationPath from './dialog-set-installation-path/reducers';
import dialogSetPreferredEngine from './dialog-set-preferred-engine/reducers';
import browsers from './browsers/reducers';
import general from './general/reducers';
import installed from './installed/reducers';
import preferences from './preferences/reducers';
import systemPreferences from './system-preferences/reducers';

const rootReducer = combineReducers({
  appManagement,
  dialogChooseEngine,
  dialogCreateCustomApp,
  dialogEditApp,
  dialogSetInstallationPath,
  dialogSetPreferredEngine,
  browsers,
  general,
  installed,
  preferences,
  systemPreferences,
});

const configureStore = (initialState) => createStore(
  rootReducer,
  initialState,
  applyMiddleware(thunkMiddleware),
);

// init store
const store = configureStore();

export default store;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';

import './index.css';

import AppWrapper from './components/app-wrapper';
import { AppearanceProvider } from './contexts/appearance';
import { DialogsProvider } from './contexts/dialogs';
import { InstallationProgressProvider } from './contexts/installation-progress';
import { NavigationProvider } from './contexts/navigation';
import { UpdaterProvider } from './contexts/updater';

// listeners to communicate with main process
import loadListeners from './listeners';
import store from './state';

loadListeners(store);

ReactDOM.render(
  <Provider store={store}>
    <NavigationProvider>
      <AppearanceProvider>
        <InstallationProgressProvider>
          <UpdaterProvider>
            <DialogsProvider>
              <AppWrapper />
            </DialogsProvider>
          </UpdaterProvider>
        </InstallationProgressProvider>
      </AppearanceProvider>
    </NavigationProvider>
  </Provider>,
  document.getElementById('app'),
);

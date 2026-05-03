/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';

import './index.css';

import store from './state';
import { NavigationProvider } from './contexts/navigation';

// listeners to communicate with main process
import loadListeners from './listeners';

import AppWrapper from './components/app-wrapper';

loadListeners(store);

ReactDOM.render(
  <Provider store={store}>
    <NavigationProvider>
      <AppWrapper />
    </NavigationProvider>
  </Provider>,
  document.getElementById('app'),
);

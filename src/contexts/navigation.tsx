/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { ROUTE_BROWSERS, ROUTE_INSTALLED, ROUTE_PREFERENCES } from '../constants/routes';
import { getPreference } from '../senders';

const getInitialRoute = () => {
  const defaultHome = getPreference('defaultHome');
  if (defaultHome === 'installed') return ROUTE_INSTALLED;
  if (defaultHome === 'preferences') return ROUTE_PREFERENCES;
  return ROUTE_BROWSERS;
};

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const [route, setRoute] = useState(getInitialRoute);

  useEffect(() => {
    const handleGoToPreferences = () => setRoute(ROUTE_PREFERENCES);

    window.ipcRenderer.on('go-to-preferences', handleGoToPreferences);

    return () => {
      if (window.ipcRenderer.removeListener) {
        window.ipcRenderer.removeListener('go-to-preferences', handleGoToPreferences);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      changeRoute: setRoute,
      route,
    }),
    [route],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

NavigationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

export default NavigationContext;

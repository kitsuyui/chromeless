/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import PropTypes from 'prop-types';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getShouldUseDarkColors } from '../senders';

const AppearanceContext = createContext(null);

export const AppearanceProvider = ({ children }) => {
  const [shouldUseDarkColors, setShouldUseDarkColors] = useState(getShouldUseDarkColors);

  useEffect(() => {
    const handleNativeThemeUpdated = () => setShouldUseDarkColors(getShouldUseDarkColors());

    window.ipcRenderer.on('native-theme-updated', handleNativeThemeUpdated);

    return () => {
      if (window.ipcRenderer.removeListener) {
        window.ipcRenderer.removeListener('native-theme-updated', handleNativeThemeUpdated);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      shouldUseDarkColors,
    }),
    [shouldUseDarkColors],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

AppearanceProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }
  return context;
};

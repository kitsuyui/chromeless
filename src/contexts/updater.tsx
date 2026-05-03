/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const UpdaterContext = createContext(null);

export const UpdaterProvider = ({ children }) => {
  const [updater, setUpdater] = useState({});

  useEffect(() => {
    const handleUpdateUpdater = (e, updaterObj) => setUpdater(updaterObj || {});

    window.ipcRenderer.on('update-updater', handleUpdateUpdater);

    return () => {
      if (window.ipcRenderer.removeListener) {
        window.ipcRenderer.removeListener('update-updater', handleUpdateUpdater);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      updaterInfo: updater.info,
      updaterStatus: updater.status,
    }),
    [updater],
  );

  return (
    <UpdaterContext.Provider value={value}>
      {children}
    </UpdaterContext.Provider>
  );
};

UpdaterProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useUpdater = () => {
  const context = useContext(UpdaterContext);
  if (!context) {
    throw new Error('useUpdater must be used within UpdaterProvider');
  }
  return context;
};

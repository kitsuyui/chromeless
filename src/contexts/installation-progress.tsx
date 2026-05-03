/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import PropTypes from 'prop-types';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const InstallationProgressContext = createContext(null);

type InstallationProgress = {
  desc?: string | null;
  percent?: number;
};

const normalizeProgress = (progress: InstallationProgress = {}) => ({
  desc: progress.desc || null,
  percent: progress.percent || 0,
});

export const InstallationProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(normalizeProgress);

  useEffect(() => {
    const handleInstallationProgress = (e, nextProgress) => {
      setProgress(normalizeProgress(nextProgress));
    };

    window.ipcRenderer.on('update-installation-progress', handleInstallationProgress);

    return () => {
      if (window.ipcRenderer.removeListener) {
        window.ipcRenderer.removeListener(
          'update-installation-progress',
          handleInstallationProgress,
        );
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      progressDesc: progress.desc,
      progressPercent: progress.percent,
    }),
    [progress],
  );

  return (
    <InstallationProgressContext.Provider value={value}>
      {children}
    </InstallationProgressContext.Provider>
  );
};

InstallationProgressProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useInstallationProgress = () => {
  const context = useContext(InstallationProgressContext);
  if (!context) {
    throw new Error('useInstallationProgress must be used within InstallationProgressProvider');
  }
  return context;
};

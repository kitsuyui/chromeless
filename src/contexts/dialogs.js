/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const DialogsContext = createContext(null);

export const DialogsProvider = ({ children }) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [openSourceNoticesOpen, setOpenSourceNoticesOpen] = useState(false);

  useEffect(() => {
    const handleOpenAbout = () => setAboutOpen(true);

    window.ipcRenderer.on('open-dialog-about', handleOpenAbout);

    return () => {
      if (window.ipcRenderer.removeListener) {
        window.ipcRenderer.removeListener('open-dialog-about', handleOpenAbout);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      aboutOpen,
      closeAbout: () => setAboutOpen(false),
      closeOpenSourceNotices: () => setOpenSourceNoticesOpen(false),
      openAbout: () => setAboutOpen(true),
      openOpenSourceNotices: () => setOpenSourceNoticesOpen(true),
      openSourceNoticesOpen,
    }),
    [aboutOpen, openSourceNoticesOpen],
  );

  return (
    <DialogsContext.Provider value={value}>
      {children}
    </DialogsContext.Provider>
  );
};

DialogsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useDialogs = () => {
  const context = useContext(DialogsContext);
  if (!context) {
    throw new Error('useDialogs must be used within DialogsProvider');
  }
  return context;
};

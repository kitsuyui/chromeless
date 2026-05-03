/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from 'react';
import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';

import connectComponent from '../../helpers/connect-component';

import { useDialogs } from '../../contexts/dialogs';
import iconPng from '../../assets/products/chromeless-mac-icon-128@2x.png';

import EnhancedDialogTitle from '../shared/enhanced-dialog-title';

const styles = (theme) => ({
  icon: {
    height: 96,
    width: 96,
  },
  dialogContent: {
    minWidth: 320,
    textAlign: 'center',
    paddingBottom: theme.spacing(2),
  },
  title: {
    marginTop: theme.spacing(1),
  },
  version: {
    marginBottom: theme.spacing(2),
  },
  versionSmallContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  versionSmall: {
    fontSize: 13,
  },
});

const About = ({ classes }) => {
  const {
    aboutOpen,
    closeAbout,
    openOpenSourceNotices,
  } = useDialogs();
  const appVersion = window.remote.app.getVersion();

  return (
    <Dialog className={classes.root} onClose={closeAbout} open={aboutOpen}>
      <EnhancedDialogTitle onClose={closeAbout}>About</EnhancedDialogTitle>
      <DialogContent className={classes.dialogContent}>
        <img src={iconPng} alt="Chromeless" className={classes.icon} />
        <Typography variant="h6" className={classes.title}>
          Chromeless
        </Typography>
        <Typography variant="body2" className={classes.version}>
          {`Version v${appVersion}`}
        </Typography>

        <Button onClick={openOpenSourceNotices}>Open Source Notices</Button>
      </DialogContent>
    </Dialog>
  );
};

About.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default connectComponent(About, null, null, styles);

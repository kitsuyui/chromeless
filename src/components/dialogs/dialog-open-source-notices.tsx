/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDialogs } from '../../contexts/dialogs';
import connectComponent from '../../helpers/connect-component';

import EnhancedDialogTitle from '../shared/enhanced-dialog-title';

const styles = (theme) => ({
  dialogContent: {
    minWidth: 320,
    whiteSpace: 'pre-line',
    paddingBottom: theme.spacing(2),
    overflowX: 'hidden',
  },
});

const DialogOpenSourceNotices = ({ classes }) => {
  const { closeOpenSourceNotices, openSourceNoticesOpen } = useDialogs();
  const [content, setContent] = useState('');
  useEffect(() => {
    window
      .fetch('./open-source-notices.txt')
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
      })
      // eslint-disable-next-line no-console
      .catch(console.log);
  });

  return (
    <Dialog className={classes.root} onClose={closeOpenSourceNotices} open={openSourceNoticesOpen}>
      <EnhancedDialogTitle onClose={closeOpenSourceNotices}>
        Open Source Notices
      </EnhancedDialogTitle>
      <DialogContent className={classes.dialogContent}>{content}</DialogContent>
    </Dialog>
  );
};

DialogOpenSourceNotices.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default connectComponent(DialogOpenSourceNotices, null, null, styles);

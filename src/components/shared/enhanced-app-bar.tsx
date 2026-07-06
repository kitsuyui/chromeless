/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
/* eslint-disable no-constant-condition */

import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import PropTypes from 'prop-types';
import React from 'react';
import { useAppearance } from '../../contexts/appearance';

import connectComponent from '../../helpers/connect-component';
import { requestShowAppMenu } from '../../senders';

const LEFT_RIGHT_WIDTH = 100;
const TOOLBAR_HEIGHT = 32;
const BUTTON_WIDTH = 46;

const styles = (theme) => ({
  appBar: {
    // leave space for resizing cursor
    // https://github.com/electron/electron/issues/3022
    padding: 4,
  },
  toolbar: {
    minHeight: 32,
    paddingLeft: theme.spacing(1) - 6,
    paddingRight: theme.spacing(1) - 6,
    display: 'flex',
    WebkitAppRegion: 'drag',
    userSelect: 'none',
  },
  left: {
    width: LEFT_RIGHT_WIDTH,
    // leave space for traffic light buttons
    paddingLeft: window.remote?.mode !== 'menubar' ? 64 : 0,
    boxSizing: 'border-box',
  },
  center: {
    flex: 1,
  },
  right: {
    width: LEFT_RIGHT_WIDTH,
    textAlign: 'right',
    boxSizing: 'border-box',
  },
  noDrag: {
    WebkitAppRegion: 'no-drag',
  },
  iconButton: {
    width: BUTTON_WIDTH,
    borderRadius: 0,
    height: TOOLBAR_HEIGHT,
  },
});

const EnhancedAppBar = ({ center, classes }) => {
  const { shouldUseDarkColors } = useAppearance();

  const onDoubleClick = (e) => {
    // feature: double click on title bar to expand #656
    // https://github.com/webcatalog/webcatalog-app/issues/656
    // https://stackoverflow.com/questions/10554446/no-onclick-when-child-is-clicked
    if (e.target === e.currentTarget) {
      const win = window.remote.getCurrentWindow();
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  };

  const shouldShowMenuButton = window.remote?.mode === 'menubar';

  return (
    <AppBar
      position="static"
      className={classes.appBar}
      color={shouldUseDarkColors ? 'default' : 'primary'}
    >
      <Toolbar variant="dense" className={classes.toolbar}>
        <div className={classes.left} onDoubleClick={onDoubleClick}>
          {shouldShowMenuButton && (
            <IconButton
              size="small"
              color="inherit"
              aria-label="Menu"
              className={`${classes.iconButton} ${classes.noDrag}`}
              onClick={(e) => {
                e.stopPropagation();
                requestShowAppMenu(e.clientX, e.clientY);
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}
        </div>
        <div className={classes.center} onDoubleClick={onDoubleClick}>
          {center}
        </div>
        <div className={classes.right} onDoubleClick={onDoubleClick} />
      </Toolbar>
    </AppBar>
  );
};

EnhancedAppBar.defaultProps = {
  center: null,
};

EnhancedAppBar.propTypes = {
  center: PropTypes.node,
  classes: PropTypes.object.isRequired,
};

export default connectComponent(EnhancedAppBar, null, null, styles);

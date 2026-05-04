/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PowerIcon from '@mui/icons-material/Power';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import WidgetsIcon from '@mui/icons-material/Widgets';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { useDialogs } from '../../../contexts/dialogs';
import { useUpdater } from '../../../contexts/updater';
import connectComponent from '../../../helpers/connect-component';
import getEngineName from '../../../helpers/get-engine-name';
import {
  enqueueRequestRestartSnackbar,
  requestCheckForUpdates,
  requestOpenInBrowser,
  requestOpenInstallLocation,
  requestQuit,
  requestResetPreferences,
  requestSetPreference,
  requestSetSystemPreference,
} from '../../../senders';
import { open as openDialogSetInstallationPath } from '../../../state/dialog-set-installation-path/actions';
import { open as openDialogSetPreferredEngine } from '../../../state/dialog-set-preferred-engine/actions';
import { PreferenceSelect, PreferenceSwitchItem } from './controls';
import DefinedAppBar from './defined-app-bar';
import { applyInstallationPathPreference, confirmResetPreferences } from './effects';
import {
  DEFAULT_ADMIN_INSTALLATION_PATH,
  DEFAULT_USER_INSTALLATION_PATH,
  getInstallationPathLabel,
  getUpdaterDesc,
  isUpdateCheckDisabled,
  parseInstallationPathPreference,
  selectPreferencesProps,
  shouldShowCurrentInstallationPathOption,
  stringifyInstallationPathPreference,
} from './model';

const styles = (theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    padding: theme.spacing(2),
    overflow: 'auto',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    paddingLeft: theme.spacing(2),
  },
  paper: {
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(3),
    width: '100%',
    WebkitAppRegion: 'none',
    border: theme.palette.mode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
  },
  inner: {
    width: '100%',
    maxWidth: 500,
    margin: '0 auto',
    [theme.breakpoints.between(800, 928)]: {
      margin: 0,
      float: 'right',
      maxWidth: 'calc(100% - 224px)',
    },
  },
  sidebar: {
    position: 'fixed',
    width: 204,
    color: theme.palette.text.primary,
    [theme.breakpoints.down(800)]: {
      display: 'none',
    },
  },
  selectRoot: {
    borderRadius: theme.spacing(0.5),
    fontSize: '0.84375rem',
    minHeight: 36,
    '& .MuiFilledInput-input': {
      minHeight: 'unset',
    },
    '& .MuiSelect-select': {
      minHeight: 'unset',
      paddingTop: theme.spacing(1),
      paddingRight: 26,
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(1.5),
    },
  },
  selectRootExtraMargin: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  select: {
    paddingTop: theme.spacing(1),
    paddingRight: 26,
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(1.5),
  },
});

const Preferences = ({
  allowPrerelease,
  alwaysOnTop,
  appCount,
  attachToMenubar,
  classes,
  defaultHome,
  installationPath,
  installingAppCount,
  onOpenDialogSetInstallationPath,
  onOpenDialogSetPreferredEngine,
  openAtLogin,
  preferredEngine,
  requireAdmin,
  themeSource,
  useHardwareAcceleration,
}) => {
  const { updaterInfo, updaterStatus } = useUpdater();
  const { openAbout, openOpenSourceNotices } = useDialogs();
  const sections = {
    general: {
      text: 'General',
      Icon: WidgetsIcon,
      ref: useRef(),
    },
    advanced: {
      text: 'Advanced',
      Icon: PowerIcon,
      ref: useRef(),
    },
    updates: {
      text: 'Updates',
      Icon: SystemUpdateAltIcon,
      ref: useRef(),
    },
    reset: {
      text: 'Reset',
      Icon: RotateLeftIcon,
      ref: useRef(),
    },
    miscs: {
      text: 'Miscellaneous',
      Icon: MoreHorizIcon,
      ref: useRef(),
    },
  };

  return (
    <div className={classes.root}>
      <DefinedAppBar />
      <div className={classes.scrollContainer}>
        <div className={classes.sidebar}>
          <List dense>
            {Object.keys(sections).map((sectionKey, i) => {
              const { Icon, text, ref, hidden } = sections[sectionKey];
              if (hidden) return null;
              return (
                <React.Fragment key={sectionKey}>
                  {i > 0 && <Divider />}
                  <ListItem
                    button
                    onClick={() =>
                      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  >
                    <ListItemIcon>
                      <Icon />
                    </ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </div>
        <div className={classes.inner}>
          <Typography
            variant="subtitle2"
            color="textPrimary"
            className={classes.sectionTitle}
            ref={sections.general.ref}
          >
            General
          </Typography>
          <Paper elevation={0} className={classes.paper}>
            <List disablePadding dense>
              <ListItem>
                <ListItemText primary="Theme" />
                <PreferenceSelect
                  classes={classes}
                  value={themeSource}
                  onChange={(e) => requestSetPreference('themeSource', e.target.value)}
                >
                  <MenuItem dense value="system">
                    System default
                  </MenuItem>
                  <MenuItem dense value="light">
                    Light
                  </MenuItem>
                  <MenuItem dense value="dark">
                    Dark
                  </MenuItem>
                </PreferenceSelect>
              </ListItem>
              <Divider />
              <PreferenceSwitchItem
                primary="Attach to menu bar"
                secondary="Tip: Right-click on app icon to access context menu."
                checked={attachToMenubar}
                onChange={(checked) => {
                  requestSetPreference('attachToMenubar', checked);
                  enqueueRequestRestartSnackbar();
                }}
              />
              <Divider />
              <PreferenceSwitchItem
                primary="Keep window always on top"
                secondary="The window won't be hidden even when you click outside."
                checked={alwaysOnTop}
                onChange={(checked) => {
                  requestSetPreference('alwaysOnTop', checked);
                  enqueueRequestRestartSnackbar();
                }}
              />
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Startup page"
                  secondary="Startup page is the one that shows when you launch the app."
                />
                <PreferenceSelect
                  classes={classes}
                  value={defaultHome}
                  onChange={(e) => requestSetPreference('defaultHome', e.target.value)}
                >
                  <MenuItem dense value="browsers">
                    Browsers
                  </MenuItem>
                  <MenuItem dense value="installed">
                    Installed
                  </MenuItem>
                  <MenuItem dense value="preferences">
                    Preferences
                  </MenuItem>
                </PreferenceSelect>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Open at login" />
                <PreferenceSelect
                  classes={classes}
                  value={openAtLogin}
                  onChange={(e) => requestSetSystemPreference('openAtLogin', e.target.value)}
                >
                  <MenuItem dense value="yes">
                    Yes
                  </MenuItem>
                  <MenuItem dense value="yes-hidden">
                    Yes, but minimized
                  </MenuItem>
                  <MenuItem dense value="no">
                    No
                  </MenuItem>
                </PreferenceSelect>
              </ListItem>
            </List>
          </Paper>

          <Typography
            variant="subtitle2"
            color="textPrimary"
            className={classes.sectionTitle}
            ref={sections.advanced.ref}
          >
            Advanced
          </Typography>
          <Paper elevation={0} className={classes.paper}>
            <List disablePadding dense>
              <ListItem
                button
                onClick={() => {
                  onOpenDialogSetPreferredEngine();
                }}
              >
                <ListItemText
                  primary="Preferred browser engine"
                  secondary={getEngineName(preferredEngine)}
                />
                <ChevronRightIcon color="action" />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Installation path" />
                <PreferenceSelect
                  classes={classes}
                  value=""
                  renderValue={() => getInstallationPathLabel({ installationPath, requireAdmin })}
                  onChange={(e) => {
                    const nextPreference = parseInstallationPathPreference(e.target.value);
                    applyInstallationPathPreference({
                      appCount,
                      nextPreference,
                      requestSetPreference,
                      showBlockedDialog: () =>
                        window.remote.dialog.showMessageBox(window.remote.getCurrentWindow(), {
                          title: 'Uninstall all of Chromeless apps first',
                          message:
                            'You need to uninstall all of your Chromeless apps before changing this preference.',
                          buttons: ['OK'],
                          cancelId: 0,
                          defaultId: 0,
                        }),
                    });
                  }}
                  disabled={installingAppCount > 0}
                >
                  {[
                    shouldShowCurrentInstallationPathOption(installationPath) && (
                      <MenuItem dense key="installation-path-menu-item" value={null}>
                        {installationPath}
                      </MenuItem>
                    ),
                    <MenuItem
                      dense
                      key="default-installation-path-menu-item"
                      value={stringifyInstallationPathPreference({
                        installationPath: DEFAULT_USER_INSTALLATION_PATH,
                        requireAdmin: false,
                      })}
                    >
                      {DEFAULT_USER_INSTALLATION_PATH} (default)
                    </MenuItem>,
                    <MenuItem
                      dense
                      key="default-sudo-installation-path-menu-item"
                      value={stringifyInstallationPathPreference({
                        installationPath: DEFAULT_ADMIN_INSTALLATION_PATH,
                        requireAdmin: true,
                      })}
                    >
                      {DEFAULT_ADMIN_INSTALLATION_PATH}
                    </MenuItem>,
                  ]}
                  <MenuItem dense onClick={onOpenDialogSetInstallationPath}>
                    Custom
                  </MenuItem>
                </PreferenceSelect>
              </ListItem>
              <ListItem button onClick={requestOpenInstallLocation}>
                <ListItemText primary="Open installation path in Finder" />
                <ChevronRightIcon color="action" />
              </ListItem>
              <Divider />
              <PreferenceSwitchItem
                primary="Use hardware acceleration when available"
                checked={useHardwareAcceleration}
                onChange={(checked) => {
                  requestSetPreference('useHardwareAcceleration', checked);
                  enqueueRequestRestartSnackbar();
                }}
              />
            </List>
          </Paper>

          <Typography
            variant="subtitle2"
            color="textPrimary"
            className={classes.sectionTitle}
            ref={sections.updates.ref}
          >
            Updates
          </Typography>
          <Paper elevation={0} className={classes.paper}>
            <List disablePadding dense>
              <ListItem
                button
                onClick={() => requestCheckForUpdates(false)}
                disabled={isUpdateCheckDisabled(updaterStatus)}
              >
                <ListItemText
                  primary={
                    updaterStatus === 'update-downloaded'
                      ? 'Restart to Apply Updates'
                      : 'Check for Updates'
                  }
                  secondary={getUpdaterDesc(updaterStatus, updaterInfo)}
                />
                <ChevronRightIcon color="action" />
              </ListItem>
              <Divider />
              <PreferenceSwitchItem
                primary="Receive pre-release updates"
                checked={allowPrerelease}
                onChange={(checked) => {
                  requestSetPreference('allowPrerelease', checked);
                  enqueueRequestRestartSnackbar();
                }}
              />
            </List>
          </Paper>

          <Typography
            variant="subtitle2"
            color="textPrimary"
            className={classes.sectionTitle}
            ref={sections.reset.ref}
          >
            Reset
          </Typography>
          <Paper elevation={0} className={classes.paper}>
            <List disablePadding dense>
              <ListItem
                button
                onClick={() => {
                  confirmResetPreferences({
                    enqueueRequestRestartSnackbar,
                    onceSetPreferences: (listener) => {
                      window.ipcRenderer.once('set-preferences', listener);
                    },
                    requestResetPreferences,
                    showResetDialog: () =>
                      window.remote.dialog.showMessageBox(window.remote.getCurrentWindow(), {
                        type: 'question',
                        buttons: ['Reset Now', 'Cancel'],
                        message:
                          "Are you sure? All preferences will be restored to their original defaults. Browsing data won't be affected. This action cannot be undone.",
                        cancelId: 1,
                      }),
                  }).catch(console.log); // eslint-disable-line
                }}
              >
                <ListItemText primary="Restore preferences to their original defaults" />
                <ChevronRightIcon color="action" />
              </ListItem>
            </List>
          </Paper>

          <Typography
            variant="subtitle2"
            color="textPrimary"
            className={classes.sectionTitle}
            ref={sections.miscs.ref}
          >
            Miscellaneous
          </Typography>
          <Paper elevation={0} className={classes.paper}>
            <List disablePadding dense>
              <ListItem button onClick={openAbout}>
                <ListItemText primary="About" />
                <ChevronRightIcon color="action" />
              </ListItem>
              <Divider />
              <ListItem button onClick={openOpenSourceNotices}>
                <ListItemText primary="Open Source Notices" />
                <ChevronRightIcon color="action" />
              </ListItem>
              <Divider />
              <ListItem
                button
                onClick={() => requestOpenInBrowser('https://github.com/kitsuyui/chromeless')}
              >
                <ListItemText primary="GitHub" />
                <ChevronRightIcon color="action" />
              </ListItem>
              <Divider />
              <ListItem button onClick={requestQuit}>
                <ListItemText primary="Quit" />
                <ChevronRightIcon color="action" />
              </ListItem>
            </List>
          </Paper>
        </div>
      </div>
    </div>
  );
};

Preferences.propTypes = {
  allowPrerelease: PropTypes.bool.isRequired,
  alwaysOnTop: PropTypes.bool.isRequired,
  appCount: PropTypes.number.isRequired,
  attachToMenubar: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
  defaultHome: PropTypes.string.isRequired,
  installationPath: PropTypes.string.isRequired,
  installingAppCount: PropTypes.number.isRequired,
  onOpenDialogSetInstallationPath: PropTypes.func.isRequired,
  onOpenDialogSetPreferredEngine: PropTypes.func.isRequired,
  openAtLogin: PropTypes.oneOf(['yes', 'yes-hidden', 'no']).isRequired,
  preferredEngine: PropTypes.string.isRequired,
  requireAdmin: PropTypes.bool.isRequired,
  themeSource: PropTypes.string.isRequired,
  useHardwareAcceleration: PropTypes.bool.isRequired,
};

const actionCreators = {
  openDialogSetInstallationPath,
  openDialogSetPreferredEngine,
};

export default connectComponent(Preferences, selectPreferencesProps, actionCreators, styles);

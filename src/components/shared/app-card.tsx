/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import MoreVertIcon from '@mui/icons-material/MoreVert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { INSTALLED, INSTALLING } from '../../constants/app-statuses';
import connectComponent from '../../helpers/connect-component';
import getEngineIcon from '../../helpers/get-engine-icon';
import getEngineName from '../../helpers/get-engine-name';
import { toFileUrlIfLocalPath } from '../../helpers/local-file-url';
import { getRelatedPathsAsync } from '../../invokers';
import {
  requestCancelInstallApp,
  requestCancelUpdateApp,
  requestOpenApp,
  requestOpenInBrowser,
  requestUninstallApp,
} from '../../senders';
import { updateApp } from '../../state/app-management/actions';
import { open as openDialogChooseEngine } from '../../state/dialog-choose-engine/actions';
import { open as openDialogCreateCustomApp } from '../../state/dialog-create-custom-app/actions';
import { open as openDialogEditApp } from '../../state/dialog-edit-app/actions';

import { getPendingActionState } from './app-card-actions-state';
import { createAppCardMenuTemplate } from './app-card-menu';
import { selectAppCardProps } from './app-card-state';
import InstallationProgress from './installation-progress';

const styles = (theme) => ({
  card: {
    width: 168,
    height: 150,
    boxSizing: 'border-box',
    borderRadius: 4,
    padding: theme.spacing(1),
    textAlign: 'center',
    position: 'relative',
    boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 0 0 1px rgba(0, 0, 0, 0.12)',
    transition: 'all 0.2s ease-in-out',
  },
  appName: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    lineHeight: 'normal',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontWeight: 500,
    userSelect: 'none',
  },
  appUrl: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  paperIcon: {
    width: 56,
    height: 56,
    marginTop: 0,
    marginBottom: 0,
    userSelect: 'none',
  },
  actionContainer: {
    marginTop: theme.spacing(1),
  },
  actionButton: {
    minWidth: 'auto',
    '&:not(:first-child)': {
      marginLeft: theme.spacing(1),
    },
  },
  topRight: {
    position: 'absolute',
    padding: 11, // 3 + theme.spacing(1),
    top: 0,
    right: 0,
    color: theme.palette.text.secondary,
    borderRadius: 0,
  },
  topLeft: {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(1),
    height: 20,
    width: 20,
    opacity: 0.75,
    '&:hover': {
      opacity: 1,
    },
  },
});

const AppCard = (props) => {
  const {
    cancelable,
    category,
    classes,
    engine,
    icon,
    iconThumbnail,
    id,
    isOutdated,
    name,
    onOpenDialogChooseEngine,
    onOpenDialogCreateCustomApp,
    onOpenDialogEditApp,
    onUpdateApp,
    opts,
    status,
    url,
    version,
  } = props;

  const combinedOpts = { ...opts };
  if (category) {
    combinedOpts.category = category;
  }

  const engineName = engine ? getEngineName(engine) : '';
  const engineIcon = engine ? getEngineIcon(engine) : null;

  const showMenu = () => {
    const template = createAppCardMenuTemplate(
      {
        cancelable,
        combinedOpts,
        engine,
        engineName,
        icon,
        id,
        isOutdated,
        name,
        onOpenDialogCreateCustomApp,
        onOpenDialogEditApp,
        onUpdateApp,
        showItemInFolder: window.remote.shell.showItemInFolder,
        status,
        url,
        version,
      },
      {
        getRelatedPathsAsync,
        requestCancelInstallApp,
        requestCancelUpdateApp,
        requestOpenInBrowser,
        requestUninstallApp,
      },
    );

    const menu = window.remote.Menu.buildFromTemplate(template);
    menu.popup(window.remote.getCurrentWindow());
  };

  const renderInstalledActionsElement = () => (
    <div>
      <Button
        className={classes.actionButton}
        size="medium"
        variant="text"
        disableElevation
        onClick={(e) => {
          e.stopPropagation();
          requestOpenApp(id, name);
        }}
      >
        Open
      </Button>
      {isOutdated ? (
        <Button
          className={classes.actionButton}
          color="primary"
          size="medium"
          variant="text"
          disableElevation
          onClick={(e) => {
            e.stopPropagation();
            onUpdateApp(id);
          }}
        >
          Update
        </Button>
      ) : (
        <Button
          className={classes.actionButton}
          color="secondary"
          variant="text"
          size="medium"
          disableElevation
          onClick={(e) => {
            e.stopPropagation();
            requestUninstallApp(engine, id, name);
          }}
        >
          Uninstall
        </Button>
      )}
    </div>
  );

  const renderActionsElement = () => {
    if (status === INSTALLED) return renderInstalledActionsElement();

    const pendingAction = getPendingActionState({ cancelable, status, version });

    if (pendingAction.showProgress) {
      return <InstallationProgress defaultDesc="Checking requirements..." />;
    }

    return (
      <Button
        className={classes.actionButton}
        color="primary"
        size="medium"
        variant="text"
        disableElevation
        disabled={pendingAction.disabled}
        onClick={(e) => {
          e.stopPropagation();
          onOpenDialogChooseEngine(id, name, url, icon, combinedOpts);
        }}
      >
        {pendingAction.label}
      </Button>
    );
  };

  return (
    <Grid item>
      <Paper
        elevation={0}
        className={classes.card}
        onContextMenu={() => {
          showMenu();
        }}
      >
        <img
          alt={name}
          className={classes.paperIcon}
          src={toFileUrlIfLocalPath(iconThumbnail || icon)}
        />
        <Typography className={classes.appName} title={name} variant="subtitle2">
          {name}
        </Typography>
        <div className={classes.actionContainer}>{renderActionsElement()}</div>
        {engineIcon && (
          <Tooltip title={`Powered by ${engineName}${version ? ` (script v${version})` : ''}`}>
            <img src={engineIcon} alt={engineName} className={classes.topLeft} />
          </Tooltip>
        )}
        <IconButton
          size="small"
          aria-label={`More Options for ${name}`}
          classes={{ root: classes.topRight }}
          onClick={(e) => {
            e.stopPropagation();
            showMenu();
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Grid>
  );
};

AppCard.defaultProps = {
  category: undefined,
  engine: null,
  iconThumbnail: null,
  opts: {},
  status: null,
  url: null,
  version: null,
};

AppCard.propTypes = {
  cancelable: PropTypes.bool.isRequired,
  category: PropTypes.string,
  classes: PropTypes.object.isRequired,
  engine: PropTypes.string,
  icon: PropTypes.string.isRequired,
  iconThumbnail: PropTypes.string,
  id: PropTypes.string.isRequired,
  isOutdated: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  onOpenDialogChooseEngine: PropTypes.func.isRequired,
  onOpenDialogCreateCustomApp: PropTypes.func.isRequired,
  onOpenDialogEditApp: PropTypes.func.isRequired,
  onUpdateApp: PropTypes.func.isRequired,
  opts: PropTypes.object,
  status: PropTypes.string,
  url: PropTypes.string,
  version: PropTypes.string,
};

const actionCreators = {
  openDialogChooseEngine,
  openDialogCreateCustomApp,
  openDialogEditApp,
  updateApp,
};

export default connectComponent(AppCard, selectAppCardProps, actionCreators, styles);

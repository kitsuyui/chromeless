/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import HelpIcon from '@mui/icons-material/Help';

import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';
import React from 'react';
import engines from '../../constants/engines';
import connectComponent from '../../helpers/connect-component';
import { requestOpenInBrowser } from '../../senders';
import HelpTooltip from './help-tooltip';

const CustomHelpIcon = withStyles((theme) => ({
  fontSizeSmall: {
    marginTop: theme.spacing(0.5),
  },
}))(HelpIcon);

const getDesc = (engineCode, browserName) => {
  const standardDesc = `This option creates bare-bone ${browserName}-based app${engineCode !== 'firefox' ? ' with WebExtension support' : ''}.`;
  const tabbedDesc = `This option creates ${browserName}-based app with traditional browser user interface, tab and WebExtension support.`;
  if (engineCode === 'opera' || engineCode.startsWith('firefox')) {
    return tabbedDesc;
  }

  return (
    <>
      <strong>Standard: </strong>
      {standardDesc}
      <br />
      <br />
      <strong>Tabbed: </strong>
      {tabbedDesc}
    </>
  );
};

const styles = (theme) => ({
  disabledListItem: {
    opacity: '0.2',
    cursor: 'not-allowed',
  },
  toggleButton: {
    padding: theme.spacing(0.5),
  },
  smallAvatar: {
    height: 28,
    width: 28,
  },
  smallListItemAvatar: {
    minWidth: 36,
  },
  download: {
    marginLeft: theme.spacing(1),
  },
});

const EngineList = ({ classes, engine, isMultisite, onEngineSelected }) => {
  const renderItem = ({
    engineVal,
    engineName,
    iconPath,
    disableStandardMode,
    disableTabbedMode,
    defaultMode,
    downloadUrl,
  }) => (
    <ListItem
      dense
      button
      onClick={() => {
        if (engine.startsWith(engineVal)) return;
        onEngineSelected(
          disableStandardMode || defaultMode === 'tabbed' ? `${engineVal}/tabs` : engineVal,
        );
      }}
      selected={engine.startsWith(engineVal)}
    >
      <ListItemAvatar className={classes.smallListItemAvatar}>
        <Avatar alt={engineName} src={iconPath} className={classes.smallAvatar} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Grid container direction="row" alignItems="center" spacing={1}>
            <Grid item>
              <Typography variant="body2" noWrap>
                {engineName}
              </Typography>
            </Grid>
            <Grid item>
              <HelpTooltip
                title={
                  <Typography variant="body2" color="textPrimary">
                    {getDesc(engineVal, engineName)}
                  </Typography>
                }
              >
                <CustomHelpIcon fontSize="small" color="disabled" />
              </HelpTooltip>
              {downloadUrl && (
                <Tooltip title="Download Browser">
                  <CloudDownloadIcon
                    className={classes.download}
                    fontSize="small"
                    color="disabled"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestOpenInBrowser(downloadUrl);
                    }}
                  />
                </Tooltip>
              )}
            </Grid>
          </Grid>
        }
      />
      {!isMultisite && (
        <ListItemSecondaryAction>
          <ToggleButtonGroup
            value={engine}
            exclusive
            onChange={(_, val) => {
              if (!val) return;
              onEngineSelected(val);
            }}
            size="small"
          >
            {!disableStandardMode && (
              <ToggleButton value={engineVal} classes={{ root: classes.toggleButton }}>
                Standard
              </ToggleButton>
            )}
            {!disableTabbedMode && (
              <ToggleButton value={`${engineVal}/tabs`} classes={{ root: classes.toggleButton }}>
                Tabbed
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );

  return (
    <List>
      {Object.keys(engines).map((engineVal) => {
        const engineObj = {
          engineVal,
          ...engines[engineVal],
        };

        if (engines[engineVal].disableMultisiteMode && isMultisite) return null;

        return renderItem(engineObj);
      })}
    </List>
  );
};

EngineList.defaultProps = {
  engine: '',
  isMultisite: false,
};

EngineList.propTypes = {
  classes: PropTypes.object.isRequired,
  engine: PropTypes.string,
  isMultisite: PropTypes.bool,
  onEngineSelected: PropTypes.func.isRequired,
};

export default connectComponent(EngineList, null, null, styles);

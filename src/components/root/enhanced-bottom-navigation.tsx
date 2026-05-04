/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import PublicIcon from '@mui/icons-material/Public';
import SettingsIcon from '@mui/icons-material/Settings';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import Badge from '@mui/material/Badge';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import PropTypes from 'prop-types';
import React from 'react';
import { ROUTE_BROWSERS, ROUTE_INSTALLED, ROUTE_PREFERENCES } from '../../constants/routes';

import { useNavigation } from '../../contexts/navigation';
import connectComponent from '../../helpers/connect-component';
import { getAppBadgeCount } from '../../state/app-management/utils';

const styles = {
  paper: {
    zIndex: 1,
    alignSelf: 'flex-end',
    width: '100%',
  },
  bottomNavigation: {
    height: 40,
  },
  bottomNavigationActionRoot: {
    flexDirection: 'row',
    minWidth: 80,
  },
  bottomNavigationActionLabel: {
    fontSize: '0.8rem !important',
    paddingLeft: 4,
  },
};

const EnhancedBottomNavigation = ({ classes, appBadgeCount }) => {
  const { changeRoute, route } = useNavigation();

  return (
    <Paper elevation={1} className={classes.paper}>
      <BottomNavigation
        value={route}
        onChange={(e, value) => changeRoute(value)}
        showLabels
        classes={{ root: classes.bottomNavigation }}
      >
        <BottomNavigationAction
          label="Browsers"
          icon={<PublicIcon />}
          value={ROUTE_BROWSERS}
          classes={{
            root: classes.bottomNavigationActionRoot,
            label: classes.bottomNavigationActionLabel,
          }}
        />
        <BottomNavigationAction
          label="Installed"
          icon={
            appBadgeCount > 0 ? (
              <Badge color="secondary" badgeContent={appBadgeCount}>
                <SystemUpdateIcon />
              </Badge>
            ) : (
              <SystemUpdateIcon />
            )
          }
          value={ROUTE_INSTALLED}
          classes={{
            root: classes.bottomNavigationActionRoot,
            label: classes.bottomNavigationActionLabel,
          }}
        />
        <BottomNavigationAction
          label="Preferences"
          icon={<SettingsIcon />}
          value={ROUTE_PREFERENCES}
          classes={{
            root: classes.bottomNavigationActionRoot,
            label: classes.bottomNavigationActionLabel,
          }}
        />
      </BottomNavigation>
    </Paper>
  );
};

EnhancedBottomNavigation.propTypes = {
  classes: PropTypes.object.isRequired,
  appBadgeCount: PropTypes.number.isRequired,
};

const mapStateToProps = (state) => ({
  appBadgeCount: getAppBadgeCount(state),
});

export default connectComponent(EnhancedBottomNavigation, mapStateToProps, null, styles);

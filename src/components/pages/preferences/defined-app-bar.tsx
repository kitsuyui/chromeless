/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
/* eslint-disable no-constant-condition */

import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import connectComponent from '../../../helpers/connect-component';

import EnhancedAppBar from '../../shared/enhanced-app-bar';

const styles = () => ({
  title: {
    textAlign: 'center',
    color: 'inherit',
    fontWeight: 400,
  },
});

const DefinedAppBar = ({ classes }) => (
  <EnhancedAppBar
    center={
      <Typography variant="body1" className={classes.title}>
        Preferences
      </Typography>
    }
  />
);

DefinedAppBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default connectComponent(DefinedAppBar, null, null, styles);

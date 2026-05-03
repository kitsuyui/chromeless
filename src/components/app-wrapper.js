/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from 'react';
import PropTypes from 'prop-types';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey, pink as red, teal } from '@mui/material/colors';

import connectComponent from '../helpers/connect-component';

import App from './app';

const AppWrapper = ({ shouldUseDarkColors }) => {
  const themeObj = {
    typography: {
      fontFamily: '"Roboto",-apple-system,BlinkMacSystemFont,"Segoe UI",Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
      fontSize: 13.5,
    },
    palette: {
      mode: shouldUseDarkColors ? 'dark' : 'light',
      primary: {
        light: teal[300],
        main: teal[700],
        dark: teal[900],
      },
      secondary: {
        light: red[300],
        main: red[500],
        dark: red[700],
      },
    },
  };

  if (!shouldUseDarkColors) {
    themeObj.background = {
      primary: grey[200],
    };
  }

  const theme = createTheme(themeObj);

  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
};

AppWrapper.propTypes = {
  shouldUseDarkColors: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  shouldUseDarkColors: state.general.shouldUseDarkColors,
});

export default connectComponent(
  AppWrapper,
  mapStateToProps,
  null,
  null,
);

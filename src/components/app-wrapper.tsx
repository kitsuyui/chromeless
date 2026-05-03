/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { grey, pink as red, teal } from '@mui/material/colors';
import type { ThemeOptions } from '@mui/material/styles';
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import React from 'react';

import { useAppearance } from '../contexts/appearance';

import App from './app';

const AppWrapper = () => {
  const { shouldUseDarkColors } = useAppearance();
  const themeObj: ThemeOptions = {
    typography: {
      fontFamily:
        '"Roboto",-apple-system,BlinkMacSystemFont,"Segoe UI",Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
      fontSize: 13.5,
    },
    palette: {
      mode: shouldUseDarkColors ? 'dark' : 'light',
      background: {
        default: shouldUseDarkColors ? undefined : grey[200],
      },
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

  const theme = createTheme(themeObj);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default AppWrapper;

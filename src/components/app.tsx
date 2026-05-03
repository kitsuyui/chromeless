/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';
import { ROUTE_BROWSERS, ROUTE_INSTALLED, ROUTE_PREFERENCES } from '../constants/routes';
import NavigationContext from '../contexts/navigation';
import connectComponent from '../helpers/connect-component';
import { requestCheckForUpdates, requestGetInstalledApps } from '../senders';
import DialogAbout from './dialogs/dialog-about';
import DialogChooseEngine from './dialogs/dialog-choose-engine';
import DialogCreateCustomApp from './dialogs/dialog-create-custom-app';
import DialogEditApp from './dialogs/dialog-edit-app';
import DialogOpenSourceNotices from './dialogs/dialog-open-source-notices';
import DialogSetInstallationPath from './dialogs/dialog-set-installation-path';
import DialogSetPreferredEngine from './dialogs/dialog-set-preferred-engine';
import Browsers from './pages/browsers';
import Installed from './pages/installed';
import Preferences from './pages/preferences';
import EnhancedBottomNavigation from './root/enhanced-bottom-navigation';
import SnackbarTrigger from './root/snackbar-trigger';

type AppProps = {
  classes: Record<'content' | 'root', string>;
};

type NavigationContextValue = {
  route: string;
};

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    width: '100vw',
    background: theme.palette.background.default,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  notistackContainerRoot: {
    // subtract 22px of FakeTitleBar
    marginTop: window.mode !== 'menubar' ? 64 : 42,
  },
});

class App extends React.Component<AppProps> {
  static contextType = NavigationContext;

  declare context: NavigationContextValue;

  componentDidMount() {
    requestCheckForUpdates(true); // isSilent = true
    requestGetInstalledApps();
  }

  render() {
    const { route } = this.context;
    const { classes } = this.props;
    let pageContent = null;
    switch (route) {
      case ROUTE_PREFERENCES:
        pageContent = <Preferences key="preferences" />;
        break;
      case ROUTE_INSTALLED:
        pageContent = <Installed key="installed" />;
        break;
      case ROUTE_BROWSERS:
        pageContent = <Browsers key="browsers" />;
        break;
      default:
        pageContent = <Browsers key="browsers" />;
    }

    return (
      <div className={classes.root}>
        <div className={classes.content}>{pageContent}</div>
        <EnhancedBottomNavigation />

        <SnackbarTrigger />

        <DialogAbout />
        <DialogChooseEngine />
        <DialogCreateCustomApp />
        <DialogEditApp />
        <DialogOpenSourceNotices />
        <DialogSetInstallationPath />
        <DialogSetPreferredEngine />
      </div>
    );
  }
}

export default connectComponent(App, null, null, styles);

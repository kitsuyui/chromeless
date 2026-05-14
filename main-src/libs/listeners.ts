/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { app, dialog, ipcMain, nativeTheme, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

const sendToAllWindows = require('./send-to-all-windows');
const getWebsiteIconUrlAsyncModule = require('./get-website-icon-url-async');
const getWebsiteIconUrlAsync = getWebsiteIconUrlAsyncModule.default || getWebsiteIconUrlAsyncModule;

const openApp = require('./app-management/open-app');
const installAppAsync = require('./app-management/install-app-async');
const uninstallAppAsync = require('./app-management/uninstall-app-async');
const getInstalledAppsAsync = require('./app-management/get-installed-apps-async');

const { getPreference, getPreferences, setPreference, resetPreferences } = require('./preferences');

const {
  getSystemPreference,
  getSystemPreferences,
  setSystemPreference,
} = require('./system-preferences');

const { createMenu, showMenu } = require('./menu');

const mainWindow = require('./windows/main');
const { canCheckForUpdates } = require('./updater-availability');
const { getUpdateFailureMessage } = require('./app-update-error');
const { getInstallFailureMessage } = require('./app-install-error');
const {
  createInstallTaskManager,
  handleUpdateCheckRequest,
  resolveInstallationPath,
  send,
} = require('./listener-handlers');

const loadListeners = () => {
  ipcMain.on('request-open-in-browser', (e, browserUrl) => {
    shell.openExternal(browserUrl);
  });

  ipcMain.on('request-show-message-box', (e, message, type) => {
    dialog
      .showMessageBox(mainWindow.get(), {
        type: type || 'error',
        message,
        buttons: ['OK'],
        cancelId: 0,
        defaultId: 0,
      })
      .catch(console.log); // eslint-disable-line
  });

  // Preferences
  ipcMain.on('get-preference', (e, name) => {
    const val = getPreference(name);
    e.returnValue = val;
  });

  ipcMain.on('get-preferences', (e) => {
    const preferences = getPreferences();
    e.returnValue = preferences;
  });

  ipcMain.on('request-set-preference', (e, name, value) => {
    setPreference(name, value);
  });

  // System Preferences
  ipcMain.on('get-system-preference', (e, name) => {
    const val = getSystemPreference(name);
    e.returnValue = val;
  });

  ipcMain.on('get-system-preferences', (e) => {
    const preferences = getSystemPreferences();
    e.returnValue = preferences;
  });

  ipcMain.on('request-set-system-preference', (e, name, value) => {
    setSystemPreference(name, value);
  });

  ipcMain.on('request-reset-preferences', () => {
    resetPreferences();
    createMenu();
  });

  ipcMain.on('request-restart', () => {
    app.relaunch();
    app.exit(0);
  });

  ipcMain.on('request-open-install-location', () => {
    const installationPath = resolveInstallationPath(
      getPreference('installationPath'),
      app.getPath('home'),
    );
    shell.openPath(installationPath);
  });

  // App Management
  let scanningPromise = Promise.resolve();
  ipcMain.on('request-get-installed-apps', () => {
    scanningPromise = scanningPromise
      .then(() => getInstalledAppsAsync())
      .catch((error) => {
        dialog
          .showMessageBox(mainWindow.get(), {
            type: 'error',
            message: `Failed to scan for installed apps. (${error.stack})`,
            buttons: ['OK'],
            cancelId: 0,
            defaultId: 0,
          })
          .catch(console.log); // eslint-disable-line
      });
  });

  ipcMain.on('request-open-app', (e, id, name) => openApp(id, name));

  ipcMain.on('request-uninstall-app', (e, engine, id, name) => {
    dialog
      .showMessageBox(mainWindow.get(), {
        type: 'question',
        buttons: ['Uninstall', 'Cancel'],
        message: `Are you sure you want to uninstall ${name}? This action cannot be undone.`,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          send(e.sender, 'set-app', id, {
            status: 'UNINSTALLING',
          });

          uninstallAppAsync(id, name, engine)
            .then(() => {
              send(e.sender, 'remove-app', id);
            })
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.log(error);
              if (
                error &&
                error.message &&
                (error.message.startsWith('EBUSY') || error.message === 'Application is in use.')
              ) {
                send(
                  e.sender,
                  'enqueue-snackbar',
                  `Failed to uninstall ${name} as the application is in use.`,
                  'error',
                );
              } else {
                send(e.sender, 'enqueue-snackbar', `Failed to uninstall ${name}.`, 'error');
              }
              send(e.sender, 'set-app', id, {
                status: 'INSTALLED',
              });
            });
        }
      })
      .catch(console.log); // eslint-disable-line
  });

  const installTaskManager = createInstallTaskManager({
    getInstallFailureMessage,
    getUpdateFailureMessage,
    installAppAsync,
    now: () => new Date().getTime(),
    send,
  });

  ipcMain.on('request-install-app', (e, engine, id, name, url, icon, opts) => {
    Promise.resolve().then(() => {
      installTaskManager.requestInstallApp(e, {
        engine,
        icon,
        id,
        name,
        opts,
        url,
      });
    });
  });

  ipcMain.on('request-update-app', (e, engine, id, name, url, icon, opts) => {
    Promise.resolve().then(() => {
      installTaskManager.requestUpdateApp(e, {
        engine,
        icon,
        id,
        name,
        opts,
        url,
      });
    });
  });

  ipcMain.on('request-cancel-install-app', (e, id) => {
    installTaskManager.cancelInstallApp(e, id);
  });

  ipcMain.on('request-cancel-update-app', (e, id) => {
    installTaskManager.cancelUpdateApp(e, id);
  });

  ipcMain.on('request-quit', () => {
    app.quit();
  });

  ipcMain.on('request-check-for-updates', (e, isSilent) => {
    // https://github.com/electron-userland/electron-builder/issues/4028
    handleUpdateCheckRequest(
      {
        app,
        autoUpdater,
        canCheckForUpdates,
        getMainWindow: mainWindow.get,
        globalObj: global,
        setImmediateFn: setImmediate,
      },
      isSilent,
    );
  });

  // to be replaced with invoke (electron 7+)
  // https://electronjs.org/docs/api/ipc-renderer#ipcrendererinvokechannel-args
  ipcMain.on('request-get-website-icon-url', (e, id, url) => {
    getWebsiteIconUrlAsync(url)
      .then((iconUrl) => {
        sendToAllWindows(id, iconUrl);
      })
      .catch((err) => {
        console.log(err); // eslint-disable-line no-console
        sendToAllWindows(id, null);
      });
  });

  // Native Theme
  ipcMain.on('get-should-use-dark-colors', (e) => {
    e.returnValue = nativeTheme.shouldUseDarkColors;
  });

  // Register an event listener.
  // When ipcRenderer sends mouse click co-ordinates, show menu at that position.
  // https://dev.to/saisandeepvaddi/creating-a-custom-menu-bar-in-electron-1pi3
  ipcMain.on('request-show-app-menu', (e, x, y) => {
    const win = mainWindow.get();
    if (win) {
      showMenu(win, x, y);
    }
  });
};

module.exports.load = loadListeners;

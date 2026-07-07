/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const { menubar } = require('menubar');
const contextMenuModule = require('electron-context-menu');
const electronRemote = require('@electron/remote/main');

const sendToAllWindows = require('../ipc/send-to-all-windows');
const { getPreference } = require('../preferences');
const { REACT_PATH } = require('../constants/paths');

import { getUpdaterMenuItemState } from '../updater-menu-item';

const contextMenu = contextMenuModule.default || contextMenuModule;

type BrowserWindowType = import('electron').BrowserWindow;
type MenuItemConstructorOptions = import('electron').MenuItemConstructorOptions;
type Menubar = import('menubar').Menubar;

let win: BrowserWindowType | null = null;
let mb: Menubar | null = null;
let attachToMenubar = false;

const get = () => {
  if (attachToMenubar) return mb?.window ?? null;
  return win;
};

const createAsync = () =>
  new Promise<void>((resolve) => {
    attachToMenubar = getPreference('attachToMenubar');

    if (attachToMenubar) {
      const menubarWindowState = windowStateKeeper({
        file: 'window-state-menubar.json',
        defaultWidth: 600,
        defaultHeight: 500,
      });

      const tray = new Tray(nativeImage.createEmpty());
      const iconFileName = 'menubarTemplate.png';
      let iconPath = null;
      if (process.env.NODE_ENV === 'production') {
        iconPath = path.resolve(__dirname, 'images', iconFileName);
      } else {
        iconPath = path.resolve(__dirname, '..', '..', 'images', iconFileName);
      }
      tray.setImage(iconPath);

      mb = menubar({
        index: REACT_PATH,
        tray,
        preloadWindow: true,
        tooltip: 'Chromeless',
        browserWindow: {
          alwaysOnTop: getPreference('alwaysOnTop'),
          x: menubarWindowState.x,
          y: menubarWindowState.y,
          width: menubarWindowState.width,
          height: menubarWindowState.height,
          minWidth: 600,
          minHeight: 500,
          webPreferences: {
            enableRemoteModule: false,
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
            preload: path.join(__dirname, 'preload-menubar.js'),
          },
        },
      });

      mb.on('after-create-window', () => {
        if (mb?.window == null) return;

        electronRemote.enable(mb.window.webContents);
        menubarWindowState.manage(mb.window);

        contextMenu({
          window: mb.window,
        });

        mb.window.on('focus', () => {
          const view = mb.window.getBrowserView();
          if (view && view.webContents) {
            view.webContents.focus();
          }
        });
      });

      mb.on('ready', () => {
        if (mb?.tray == null) return;

        mb.tray.on('right-click', () => {
          const updaterEnabled = !process.mas;
          const updaterMenuItemState = getUpdaterMenuItemState(global.updaterObj);
          const updaterMenuItem: MenuItemConstructorOptions = {
            ...updaterMenuItemState,
            click: () => ipcMain.emit('request-check-for-updates'),
            visible: updaterEnabled,
          };

          const trayContextMenu = Menu.buildFromTemplate([
            {
              label: 'Open Chromeless',
              click: () => mb?.showWindow(),
            },
            {
              type: 'separator',
            },
            {
              label: 'About Chromeless',
              click: () => {
                sendToAllWindows('open-dialog-about');
                mb?.showWindow();
              },
            },
            {
              type: 'separator',
              visible: updaterEnabled,
            },
            updaterMenuItem,
            { type: 'separator' },
            {
              label: 'Preferences...',
              click: () => {
                sendToAllWindows('go-to-preferences');
                mb?.showWindow();
              },
            },
            { type: 'separator' },
            {
              label: 'Quit',
              click: () => {
                mb?.app.quit();
              },
            },
          ]);
          mb.tray.popUpContextMenu(trayContextMenu);
        });

        resolve();
      });
      return;
    }

    const mainWindowState = windowStateKeeper({
      defaultWidth: 800,
      defaultHeight: 768,
    });

    const winOpts = {
      backgroundColor: '#FFF',
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      minWidth: 600,
      minHeight: 500,
      titleBarStyle: 'hiddenInset',
      show: false,
      frame: true,
      alwaysOnTop: getPreference('alwaysOnTop'),
      webPreferences: {
        enableRemoteModule: false,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: process.env.NODE_ENV === 'production',
        preload: path.join(__dirname, 'preload-main.js'),
      },
    };
    win = new BrowserWindow(winOpts);
    electronRemote.enable(win.webContents);

    mainWindowState.manage(win);

    contextMenu({
      window: win,
    });

    // check system-preferences.ts
    // wasOpenedAsHidden is only available on macOS
    const { wasOpenedAsHidden } = app.getLoginItemSettings();
    win.once('ready-to-show', () => {
      if (!wasOpenedAsHidden) {
        win.show();
      }
    });

    win.on('closed', () => {
      win = null;
    });

    win.on('enter-full-screen', () => {
      win.webContents.send('set-is-full-screen', true);
    });
    win.on('leave-full-screen', () => {
      win.webContents.send('set-is-full-screen', false);
    });

    win.on('maximize', () => {
      win.webContents.send('set-is-maximized', true);
    });
    win.on('unmaximize', () => {
      win.webContents.send('set-is-maximized', false);
    });

    // ensure redux is loaded first
    // if not, redux might not be able catch changes sent from ipcMain
    win.webContents.once('did-stop-loading', () => {
      resolve();
    });

    win.loadURL(REACT_PATH);
  });

const show = () => {
  if (attachToMenubar) {
    if (mb == null) {
      createAsync();
    } else {
      mb.showWindow();
    }
  } else if (win == null) {
    createAsync();
  } else {
    win.show();
  }
};

const send = (channel: string, ...args: unknown[]) => {
  if (get() !== null) {
    get()?.webContents.send(channel, ...args);
  }
};

module.exports = {
  createAsync,
  get,
  send,
  show,
};

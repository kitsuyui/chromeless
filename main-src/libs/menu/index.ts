/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { app, Menu, shell, ipcMain } = require('electron');

const sendToAllWindows = require('../ipc/send-to-all-windows');

import { createMenuTemplate } from './menu-template';

let menu = null;

const createMenu = () => {
  const template = createMenuTemplate({
    appName: app.name,
    emitCheckForUpdates: () => ipcMain.emit('request-check-for-updates'),
    openExternal: shell.openExternal,
    sendToAllWindows,
    updaterState: global.updaterObj,
  });

  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// https://dev.to/saisandeepvaddi/creating-a-custom-menu-bar-in-electron-1pi3
// Register an event listener.
// When ipcRenderer sends mouse click co-ordinates, show menu at that position.
const showMenu = (window, x, y) => {
  if (!menu) return;
  menu.popup({
    window,
    x,
    y,
  });
};

module.exports = {
  createMenu,
  showMenu,
};

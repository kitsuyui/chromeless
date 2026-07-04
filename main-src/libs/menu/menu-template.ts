/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import type { MenuItemConstructorOptions } from 'electron';
import { getUpdaterMenuItemState } from '../updater-menu-item';

type MenuTemplateInput = {
  appName: string;
  emitCheckForUpdates: () => void;
  openExternal: (url: string) => void;
  sendToAllWindows: (...args: unknown[]) => void;
  updaterState?: {
    info?: {
      bytesPerSecond: number;
      total: number;
      transferred: number;
    };
    status?: string;
  } | null;
};

type ZoomWindow = {
  webContents: {
    zoomFactor: number;
  };
};

const setZoomFactor = (browserWindow: ZoomWindow | null | undefined, zoomFactor: number) => {
  if (browserWindow != null) {
    browserWindow.webContents.zoomFactor = zoomFactor;
  }
};

const incrementZoomFactor = (browserWindow: ZoomWindow | null | undefined) => {
  if (browserWindow != null) {
    browserWindow.webContents.zoomFactor += 0.1;
  }
};

const decrementZoomFactor = (browserWindow: ZoomWindow | null | undefined) => {
  if (browserWindow == null) return;

  const contents = browserWindow.webContents;
  if (contents.zoomFactor.toFixed(1) !== '0.1') {
    contents.zoomFactor -= 0.1;
  }
};

export const createMenuTemplate = ({
  appName,
  emitCheckForUpdates,
  openExternal,
  sendToAllWindows,
  updaterState,
}: MenuTemplateInput): MenuItemConstructorOptions[] => {
  const updaterMenuItem: MenuItemConstructorOptions = {
    ...getUpdaterMenuItemState(updaterState),
    click: emitCheckForUpdates,
  };

  const macMenuItems: MenuItemConstructorOptions[] = [
    { type: 'separator' },
    { role: 'services', submenu: [] },
    { type: 'separator' },
    { role: 'hide' },
    { role: 'hideOthers' },
    { role: 'unhide' },
  ];

  return [
    {
      label: appName,
      submenu: [
        {
          label: 'About Chromeless',
          click: () => sendToAllWindows('open-dialog-about'),
        },
        {
          type: 'separator',
        },
        updaterMenuItem,
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => sendToAllWindows('go-to-preferences'),
        },
        ...macMenuItems,
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        {
          role: 'pasteAndMatchStyle',
          accelerator: 'Shift+CmdOrCtrl+F',
        },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => sendToAllWindows('focus-search'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: (_menuItem, browserWindow) =>
            setZoomFactor(browserWindow as unknown as ZoomWindow, 1),
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: (_menuItem, browserWindow) =>
            incrementZoomFactor(browserWindow as unknown as ZoomWindow),
          visible: false,
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: (_menuItem, browserWindow) =>
            incrementZoomFactor(browserWindow as unknown as ZoomWindow),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: (_menuItem, browserWindow) =>
            decrementZoomFactor(browserWindow as unknown as ZoomWindow),
        },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Report a Bug via GitHub...',
          click: () => openExternal('https://github.com/kitsuyui/chromeless/issues'),
        },
        {
          label: 'Request a New Feature via GitHub...',
          click: () =>
            openExternal(
              'https://github.com/kitsuyui/chromeless/issues/new?template=feature.md&title=feature%3A+',
            ),
        },
        { type: 'separator' },
        {
          role: 'toggleDevTools',
          accelerator: '',
        },
      ],
    },
  ];
};

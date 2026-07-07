/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { contextBridge, ipcRenderer } = require('electron');
const remote = require('@electron/remote');

type WindowMode = 'main' | 'menubar';
type IpcListener = (...args: unknown[]) => unknown;
type AllowedChannel =
  | 'clean-app-management'
  | 'enqueue-request-restart-snackbar'
  | 'enqueue-snackbar'
  | 'focus-search'
  | 'go-to-preferences'
  | 'log'
  | 'native-theme-updated'
  | 'open-dialog-about'
  | 'remove-app'
  | 'set-app'
  | 'set-app-batch'
  | 'set-preference'
  | 'set-preferences'
  | 'set-scanning-for-installed'
  | 'set-system-preference'
  | 'update-installation-progress'
  | 'update-updater';
type SendChannel =
  | 'request-cancel-install-app'
  | 'request-cancel-update-app'
  | 'request-check-for-updates'
  | 'request-get-installed-apps'
  | 'request-get-website-icon-url'
  | 'request-install-app'
  | 'request-open-app'
  | 'request-open-in-browser'
  | 'request-open-install-location'
  | 'request-quit'
  | 'request-reset-preferences'
  | 'request-restart'
  | 'request-set-preference'
  | 'request-set-system-preference'
  | 'request-show-app-menu'
  | 'request-show-message-box'
  | 'request-uninstall-app'
  | 'request-update-app';
type SyncChannel =
  | 'get-preference'
  | 'get-preferences'
  | 'get-should-use-dark-colors'
  | 'get-system-preference'
  | 'get-system-preferences';
type InvokeChannel = 'get-related-paths';

type ListenerEntry = {
  listener: IpcListener;
  once?: boolean;
};

const localListeners = new Map<string, Set<ListenerEntry>>();

const allowedGlobalKeys = new Set(['defaultIcon', 'updaterObj']);

const getListenerSet = (channel: string) => {
  const existing = localListeners.get(channel);
  if (existing) return existing;

  const created = new Set<ListenerEntry>();
  localListeners.set(channel, created);
  return created;
};

const dispatch = (channel: string, args: unknown[]) => {
  const listeners = localListeners.get(channel);
  if (!listeners || listeners.size === 0) return;

  [...listeners].forEach((entry) => {
    entry.listener(undefined, ...args);
    if (entry.once) {
      listeners.delete(entry);
    }
  });
};

const registerForwarder = (channel: AllowedChannel) => {
  ipcRenderer.on(channel, (_event, ...args) => {
    dispatch(channel, args);
  });
};

const allowedChannels: AllowedChannel[] = [
  'clean-app-management',
  'enqueue-snackbar',
  'focus-search',
  'go-to-preferences',
  'log',
  'native-theme-updated',
  'open-dialog-about',
  'remove-app',
  'set-app',
  'set-app-batch',
  'set-preference',
  'set-preferences',
  'set-scanning-for-installed',
  'set-system-preference',
  'update-installation-progress',
  'update-updater',
];

allowedChannels.forEach(registerForwarder);

const ensureAllowed = (channel: string, allowed: Set<string>) => {
  if (!allowed.has(channel)) {
    throw new Error(`Unsupported IPC channel: ${channel}`);
  }
};

const normalizeDialogArgs = (args: unknown[]) => (args.length === 2 ? args[1] : args[0]);

const exposedIpcRenderer = {
  emit: (channel: AllowedChannel | 'enqueue-request-restart-snackbar', ...args: unknown[]) => {
    if (channel !== 'enqueue-request-restart-snackbar') {
      throw new Error(`Unsupported local IPC channel: ${channel}`);
    }
    dispatch(channel, args);
    return true;
  },
  invoke: <T = unknown>(channel: InvokeChannel, ...args: unknown[]) => {
    ensureAllowed(channel, new Set(['get-related-paths']));
    return ipcRenderer.invoke(channel, ...args) as Promise<T>;
  },
  on: (channel: AllowedChannel, listener: IpcListener) => {
    ensureAllowed(channel, new Set([...allowedChannels, 'enqueue-request-restart-snackbar']));
    getListenerSet(channel).add({ listener });
    return listener;
  },
  once: (channel: AllowedChannel, listener: IpcListener) => {
    ensureAllowed(channel, new Set([...allowedChannels, 'enqueue-request-restart-snackbar']));
    getListenerSet(channel).add({ listener, once: true });
    return listener;
  },
  removeAllListeners: (channel: AllowedChannel) => {
    ensureAllowed(channel, new Set([...allowedChannels, 'enqueue-request-restart-snackbar']));
    localListeners.delete(channel);
  },
  removeListener: (channel: AllowedChannel, listener: IpcListener) => {
    ensureAllowed(channel, new Set([...allowedChannels, 'enqueue-request-restart-snackbar']));
    const listeners = localListeners.get(channel);
    if (!listeners) return;

    [...listeners].forEach((entry) => {
      if (entry.listener === listener) {
        listeners.delete(entry);
      }
    });
  },
  send: (channel: SendChannel, ...args: unknown[]) => {
    ensureAllowed(
      channel,
      new Set([
        'request-cancel-install-app',
        'request-cancel-update-app',
        'request-check-for-updates',
        'request-get-installed-apps',
        'request-get-website-icon-url',
        'request-install-app',
        'request-open-app',
        'request-open-in-browser',
        'request-open-install-location',
        'request-quit',
        'request-reset-preferences',
        'request-restart',
        'request-set-preference',
        'request-set-system-preference',
        'request-show-app-menu',
        'request-show-message-box',
        'request-uninstall-app',
        'request-update-app',
      ]),
    );
    ipcRenderer.send(channel, ...args);
  },
  sendSync: <T = unknown>(channel: SyncChannel, ...args: unknown[]) => {
    ensureAllowed(
      channel,
      new Set([
        'get-preference',
        'get-preferences',
        'get-should-use-dark-colors',
        'get-system-preference',
        'get-system-preferences',
      ]),
    );
    return ipcRenderer.sendSync(channel, ...args) as T;
  },
};

const exposedRemote = {
  mode: 'main' as WindowMode,
  app: {
    getVersion: () => remote.app.getVersion(),
  },
  dialog: {
    showMessageBox: (...args: [unknown, unknown] | [unknown]) =>
      remote.dialog.showMessageBox(normalizeDialogArgs(args) as never),
    showOpenDialog: (...args: [unknown, unknown] | [unknown]) =>
      remote.dialog.showOpenDialog(normalizeDialogArgs(args) as never),
  },
  getCurrentWindow: () => {
    const currentWindow = remote.getCurrentWindow();
    return {
      isMaximized: () => currentWindow.isMaximized(),
      maximize: () => currentWindow.maximize(),
      unmaximize: () => currentWindow.unmaximize(),
    };
  },
  getGlobal: <T = unknown>(key: string) => {
    if (!allowedGlobalKeys.has(key)) {
      throw new Error(`Unsupported global key: ${key}`);
    }

    return remote.getGlobal(key) as T;
  },
  Menu: {
    buildFromTemplate: (...args: unknown[]) => {
      const menu = remote.Menu.buildFromTemplate(...args);
      return {
        popup: () => menu.popup(),
      };
    },
  },
  shell: {
    openExternal: (...args: unknown[]) => remote.shell.openExternal(...args),
    showItemInFolder: (...args: unknown[]) => remote.shell.showItemInFolder(...args),
  },
};

const loadPreloadShared = (mode: WindowMode) => {
  contextBridge.exposeInMainWorld('ipcRenderer', exposedIpcRenderer);
  contextBridge.exposeInMainWorld('remote', {
    ...exposedRemote,
    mode,
  });
};

module.exports = loadPreloadShared;

/// <reference types="vite/client" />

import type {
  BrowserWindow,
  MessageBoxOptions,
  MessageBoxReturnValue,
  OpenDialogOptions,
  OpenDialogReturnValue,
} from 'electron';

declare module '*.css';

declare module '*.png' {
  const src: string;
  export default src;
}

type IpcRendererLike = {
  emit: (...args: unknown[]) => unknown;
  invoke: (...args: unknown[]) => Promise<unknown>;
  on: (...args: unknown[]) => unknown;
  once: (...args: unknown[]) => unknown;
  send: (...args: unknown[]) => unknown;
  sendSync: <T = unknown>(...args: unknown[]) => T;
  removeAllListeners: (...args: unknown[]) => unknown;
  removeListener?: (...args: unknown[]) => unknown;
};

type WindowControlsLike = Pick<BrowserWindow, 'isMaximized' | 'maximize' | 'unmaximize'>;

type RemoteLike = {
  mode: string;
  app: {
    getVersion: () => string;
  };
  dialog: {
    showMessageBox: (
      ...args:
        | [BrowserWindow, MessageBoxOptions]
        | [WindowControlsLike, MessageBoxOptions]
        | [MessageBoxOptions]
    ) => Promise<MessageBoxReturnValue>;
    showOpenDialog: (
      ...args:
        | [BrowserWindow, OpenDialogOptions]
        | [WindowControlsLike, OpenDialogOptions]
        | [OpenDialogOptions]
    ) => Promise<OpenDialogReturnValue>;
  };
  getCurrentWindow: () => WindowControlsLike;
  getGlobal: <T = unknown>(key: string) => T;
  Menu: {
    buildFromTemplate: (...args: unknown[]) => {
      popup: (...args: unknown[]) => unknown;
    };
  };
  shell: {
    openExternal: (...args: unknown[]) => unknown;
    showItemInFolder: (...args: unknown[]) => unknown;
  };
};

declare global {
  namespace NodeJS {
    interface Process {
      mas?: boolean;
    }
  }

  interface Window {
    ipcRenderer: IpcRendererLike;
    remote: RemoteLike;
  }
}

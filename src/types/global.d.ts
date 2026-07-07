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

type RemoteLike = {
  app: {
    getVersion: () => string;
  };
  dialog: {
    showMessageBox: (
      ...args: [BrowserWindow, MessageBoxOptions] | [MessageBoxOptions]
    ) => Promise<MessageBoxReturnValue>;
    showOpenDialog: (
      ...args: [BrowserWindow, OpenDialogOptions] | [OpenDialogOptions]
    ) => Promise<OpenDialogReturnValue>;
  };
  getCurrentWindow: () => BrowserWindow;
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
    interface Global {
      updateInstallSilent?: boolean;
      updateSilent?: boolean;
      updaterObj?: {
        status?: string;
      };
    }

    interface Process {
      mas?: boolean;
    }
  }

  interface Window {
    ipcRenderer: IpcRendererLike;
    mode?: string;
    remote: RemoteLike;
  }
}

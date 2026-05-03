/// <reference types="vite/client" />

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
  sendSync: (...args: unknown[]) => unknown;
  removeAllListeners: (...args: unknown[]) => unknown;
  removeListener?: (...args: unknown[]) => unknown;
};

type RemoteLike = {
  app: {
    getVersion: () => string;
  };
  dialog: {
    showMessageBox: (...args: unknown[]) => Promise<unknown>;
    showOpenDialog: (...args: unknown[]) => Promise<unknown>;
  };
  getCurrentWindow: () => unknown;
  getGlobal: (key: string) => unknown;
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
  interface Window {
    ipcRenderer: IpcRendererLike;
    mode?: string;
    process: {
      platform: string;
    };
    remote: RemoteLike;
  }
}

export {};

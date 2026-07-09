/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

type WebContentsLike = {
  isDestroyed: () => boolean;
  send: (...args: unknown[]) => void;
};

type SenderEventLike = {
  sender: WebContentsLike;
};

type AppInstallDetails = {
  engine: string;
  icon: string;
  id: string;
  name: string;
  opts: Record<string, unknown>;
  url: string | null;
};

type InstallTaskDependencies = {
  getInstallFailureMessage: (error: unknown, name: string) => string;
  getUpdateFailureMessage: (error: unknown, name: string) => string;
  installAppAsync: (
    engine: string,
    id: string,
    name: string,
    url: string | null,
    icon: string,
    opts: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<Record<string, unknown>>;
  now: () => number;
  send: (webContents: WebContentsLike, ...args: unknown[]) => void;
};

type UpdateCheckDependencies = {
  app: {
    removeAllListeners: (eventName: string) => void;
  };
  autoUpdater: {
    checkForUpdates: () => void;
    isUpdaterActive: () => boolean;
    quitAndInstall: (isSilent: boolean) => void;
  };
  canCheckForUpdates: () => boolean;
  getMainWindow: () => { close: () => void } | null;
  globalObj: {
    updateInstallSilent?: boolean;
    updateSilent?: boolean;
    updaterObj?: {
      status?: string;
    };
  };
  setImmediateFn: (callback: () => void) => void;
};

type RestartDownloadedUpdateDependencies = {
  app: {
    removeAllListeners: (eventName: string) => void;
  };
  autoUpdater: {
    quitAndInstall: (isSilent: boolean) => void;
  };
  getMainWindow: () => { close: () => void } | null;
  setImmediateFn: (callback: () => void) => void;
};

export const send = (webContents: WebContentsLike | null | undefined, ...args: unknown[]) => {
  if (webContents && !webContents.isDestroyed()) {
    webContents.send(...args);
  }
};

export const createInstallTaskManager = ({
  getInstallFailureMessage,
  getUpdateFailureMessage,
  installAppAsync,
  now,
  send,
}: InstallTaskDependencies) => {
  let queue = Promise.resolve<unknown>(null);
  const taskMap: Record<string, (() => Promise<unknown>) | undefined> = {};
  const cancelledIds = new Set<string>();
  const cancelableIds = new Set<string>();
  const controllerMap: Record<string, AbortController | undefined> = {};

  const enqueue = (id: string) => {
    queue = queue.then(() => {
      const task = taskMap[id];
      if (task) return task();
      return null;
    });
  };

  const requestInstallApp = (event: SenderEventLike, details: AppInstallDetails) => {
    const { engine, icon, id, name, opts, url } = details;

    cancelledIds.delete(id);
    cancelableIds.add(id);

    send(event.sender, 'set-app', id, {
      status: 'INSTALLING',
      lastUpdated: now(),
      engine,
      id,
      name,
      url,
      icon,
      opts,
      cancelable: true,
    });

    taskMap[id] = () => {
      cancelableIds.delete(id);
      send(event.sender, 'set-app', id, {
        cancelable: false,
      });

      const controller = new AbortController();
      controllerMap[id] = controller;

      return installAppAsync(engine, id, name, url, icon, opts, controller.signal)
        .then((newApp) => {
          if (!cancelledIds.has(id)) {
            send(event.sender, 'set-app', id, {
              ...newApp,
              status: 'INSTALLED',
            });
          }
          delete taskMap[id];
          delete controllerMap[id];
          cancelledIds.delete(id);
        })
        .catch((error) => {
          if (!cancelledIds.has(id)) {
            console.error(error); // eslint-disable-line no-console
            send(event.sender, 'enqueue-snackbar', getInstallFailureMessage(error, name), 'error');
            send(event.sender, 'remove-app', id);
          }
          delete taskMap[id];
          delete controllerMap[id];
          cancelledIds.delete(id);
        });
    };

    enqueue(id);
  };

  const requestUpdateApp = (event: SenderEventLike, details: AppInstallDetails) => {
    const { engine, icon, id, name, opts, url } = details;

    cancelledIds.delete(id);
    cancelableIds.add(id);

    send(event.sender, 'set-app', id, {
      status: 'INSTALLING',
      cancelable: true,
    });

    taskMap[id] = () => {
      cancelableIds.delete(id);
      send(event.sender, 'set-app', id, {
        cancelable: false,
      });

      const controller = new AbortController();
      controllerMap[id] = controller;

      return installAppAsync(engine, id, name, url, icon, opts, controller.signal)
        .then((newApp) => {
          if (!cancelledIds.has(id)) {
            send(event.sender, 'set-app', id, {
              ...newApp,
              status: 'INSTALLED',
              lastUpdated: now(),
            });
          }
          delete taskMap[id];
          delete controllerMap[id];
          cancelledIds.delete(id);
        })
        .catch((error) => {
          if (!cancelledIds.has(id)) {
            console.error(error); // eslint-disable-line no-console
            send(event.sender, 'enqueue-snackbar', getUpdateFailureMessage(error, name), 'error');
            send(event.sender, 'set-app', id, {
              status: 'INSTALLED',
            });
          }
          delete taskMap[id];
          delete controllerMap[id];
          cancelledIds.delete(id);
        });
    };

    enqueue(id);
  };

  const cancelInstallApp = (event: SenderEventLike, id: string) => {
    if (taskMap[id]) {
      cancelableIds.delete(id);
      send(event.sender, 'remove-app', id);
      controllerMap[id]?.abort();
      delete controllerMap[id];
      delete taskMap[id];
      cancelledIds.add(id);
    }
  };

  const cancelUpdateApp = (event: SenderEventLike, id: string) => {
    if (taskMap[id]) {
      cancelableIds.delete(id);
      send(event.sender, 'set-app', id, {
        status: 'INSTALLED',
        cancelable: false,
      });
      controllerMap[id]?.abort();
      delete controllerMap[id];
      delete taskMap[id];
      cancelledIds.add(id);
    }
  };

  const waitForIdle = () => queue;

  return {
    cancelInstallApp,
    cancelUpdateApp,
    requestInstallApp,
    requestUpdateApp,
    waitForIdle,
  };
};

export const handleUpdateCheckRequest = (
  {
    app,
    autoUpdater,
    canCheckForUpdates,
    getMainWindow,
    globalObj,
    setImmediateFn,
  }: UpdateCheckDependencies,
  isSilent: boolean,
) => {
  if (!autoUpdater.isUpdaterActive()) return;
  if (!canCheckForUpdates()) return;

  if (globalObj.updaterObj && globalObj.updaterObj.status === 'update-downloaded') {
    restartDownloadedUpdate(
      {
        app,
        autoUpdater,
        getMainWindow,
        setImmediateFn,
      },
      isSilent,
    );
  }

  globalObj.updateInstallSilent = Boolean(isSilent);
  globalObj.updateSilent = Boolean(isSilent);
  autoUpdater.checkForUpdates();
};

export const restartDownloadedUpdate = (
  { app, autoUpdater, getMainWindow, setImmediateFn }: RestartDownloadedUpdateDependencies,
  isSilent: boolean,
) => {
  setImmediateFn(() => {
    app.removeAllListeners('window-all-closed');
    const win = getMainWindow();
    if (win != null) {
      win.close();
    }
    autoUpdater.quitAndInstall(isSilent);
  });
};

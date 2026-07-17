/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { writeObservabilityEvent } from '../../../../src/helpers/observability';

type ForkMessage = {
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
  progress?: {
    desc: string | null;
    percent: number;
  };
};

type InstallAppAsyncDependencies = {
  app: {
    getPath: (name: string) => string;
  };
  envPaths: (
    name: string,
    opts: { suffix: string },
  ) => {
    cache: string;
  };
  fork: (
    scriptPath: string,
    params: string[],
    opts: {
      env: Record<string, string>;
    },
  ) => {
    kill: () => void;
    on: (eventName: string, listener: (...args: unknown[]) => void) => void;
  };
  getEngineAppPath: (engine: string, homePath: string) => string | null;
  getEngineInfo: (engine: string) => { name: string } | null;
  getPreferences: () => {
    installationPath: string;
    requireAdmin: boolean;
  };
  packageJson: {
    scriptVersion: string;
  };
  path: {
    join: (...parts: string[]) => string;
    resolve: (...parts: string[]) => string;
  };
  sendToAllWindows: (
    channel: 'update-installation-progress',
    payload: {
      desc: string | null;
      percent: number;
    },
  ) => void;
};

export const createInstallAppAsync = ({
  app,
  envPaths,
  fork,
  getEngineAppPath,
  getEngineInfo,
  getPreferences,
  packageJson,
  path,
  sendToAllWindows,
}: InstallAppAsyncDependencies) => {
  const assertEngineInstalled = (engine: string) => {
    if (getEngineAppPath(engine, app.getPath('home'))) return;

    const engineInfo = getEngineInfo(engine);
    const engineName = engineInfo ? engineInfo.name : 'Browser';
    throw new Error(`${engineName} is not installed.`);
  };

  const getHelperPath = (url: string | null) => {
    // the helper extension for apps has window management logic, but that logic prevents users from
    // opening new windows in browser instances. See upstream issue #88 for context.
    const helperDirName = url != null ? 'chromeless-helper' : 'chromeless-helper-browser-instances';

    if (process.env.NODE_ENV === 'production') {
      return path.resolve(__dirname, helperDirName).replace('app.asar', 'app.asar.unpacked');
    }

    return path.resolve(__dirname, '..', '..', '..', '..', 'public', helperDirName);
  };

  const buildForkParams = ({
    cacheRoot,
    engine,
    icon,
    id,
    installationPath,
    name,
    opts,
    requireAdmin,
    url,
  }: {
    cacheRoot: string;
    engine: string;
    icon: string;
    id: string;
    installationPath: string;
    name: string;
    opts: Record<string, unknown>;
    requireAdmin: boolean;
    url: string | null;
  }) => {
    const params = [
      '--engine',
      engine,
      '--id',
      id,
      '--name',
      name,
      '--icon',
      icon,
      '--opts',
      JSON.stringify(opts),
      '--helperPath',
      getHelperPath(url),
      '--homePath',
      app.getPath('home'),
      '--appDataPath',
      app.getPath('appData'),
      '--installationPath',
      installationPath,
      '--requireAdmin',
      requireAdmin.toString(),
      '--username',
      process.env.USER ?? '',
      '--cacheRoot',
      cacheRoot,
    ];

    if (url != null) {
      params.push('--url');
      params.push(url);
    }

    return params;
  };

  const toForkError = (message: ForkMessage) => {
    const err = new Error(message.error?.message ?? 'Unknown fork error');
    err.stack = message.error?.stack;
    err.name = message.error?.name ?? 'Error';
    return err;
  };

  const runForkedInstall = ({
    cacheRoot,
    engine,
    icon,
    id,
    installationPath,
    name,
    opts,
    requireAdmin,
    signal,
    url,
  }: {
    cacheRoot: string;
    engine: string;
    icon: string;
    id: string;
    installationPath: string;
    name: string;
    opts: Record<string, unknown>;
    requireAdmin: boolean;
    signal?: AbortSignal;
    url: string | null;
  }) =>
    new Promise<void>((resolve, reject) => {
      try {
        assertEngineInstalled(engine);
      } catch (error) {
        reject(error);
        return;
      }

      const child = fork(
        path.join(__dirname, 'install-app-forked-lite.js').replace('app.asar', 'app.asar.unpacked'),
        buildForkParams({
          cacheRoot,
          engine,
          icon,
          id,
          installationPath,
          name,
          opts,
          requireAdmin,
          url,
        }),
        {
          env: {
            APPDATA: app.getPath('appData'),
            ELECTRON_NO_ASAR: 'true',
            ELECTRON_RUN_AS_NODE: 'true',
          },
        },
      );

      if (signal) {
        if (signal.aborted) {
          child.kill();
        } else {
          const handleAbort = () => child.kill();
          signal.addEventListener('abort', handleAbort, { once: true });
          child.on('exit', () => signal.removeEventListener('abort', handleAbort));
        }
      }

      let err: Error | null = null;
      child.on('message', (message: ForkMessage) => {
        if (message?.progress) {
          sendToAllWindows('update-installation-progress', message.progress);
        } else if (message?.error) {
          err = toForkError(message);
        } else {
          writeObservabilityEvent({
            correlationKey: `install:${id}`,
            details: { message },
            level: 'warn',
            message: 'Install worker sent an unexpected message payload.',
            operation: 'install-app',
            stage: 'child-message',
            subsystem: 'app-management',
            target: { id, name },
          });
        }
      });

      child.on('exit', (code: number) => {
        if (code !== 0 || err !== null) {
          reject(err || new Error('Forked script failed to run correctly.'));
          return;
        }

        sendToAllWindows('update-installation-progress', {
          desc: null,
          percent: 100,
        });
        resolve();
      });
    });

  return (
    engine: string,
    id: string,
    name: string,
    url: string | null,
    icon: string,
    _opts: Record<string, unknown> = {},
    signal?: AbortSignal,
  ) => {
    const opts = { ..._opts };
    const { installationPath, requireAdmin } = getPreferences();
    const cacheRoot = envPaths('chromeless', { suffix: '' }).cache;
    let version = '0.0.0';

    return Promise.resolve()
      .then(() => {
        sendToAllWindows('update-installation-progress', {
          desc: null,
          percent: 0,
        });
        version = packageJson.scriptVersion;
      })
      .then(async () =>
        runForkedInstall({
          cacheRoot,
          engine,
          icon,
          id,
          installationPath,
          name,
          opts,
          requireAdmin,
          signal,
          url,
        }),
      )
      .then(() => ({
        engine,
        icon,
        id,
        name,
        opts,
        url,
        version,
      }));
  };
};

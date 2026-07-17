/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { EventEmitter } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

import { createInstallAppAsync } from './install-app-async-core';

class FakeChildProcess extends EventEmitter {
  kill = vi.fn();
}

const createInstallHarness = ({
  engineAppPath = '/Applications/Google Chrome.app',
  helperName = 'Google Chrome',
} = {}) => {
  const fork = vi.fn(
    (
      _scriptPath: string,
      _params: string[],
      _opts: {
        env: Record<string, string>;
      },
    ) => new FakeChildProcess(),
  );
  const sendToAllWindows = vi.fn();

  const installAppAsync = createInstallAppAsync({
    app: {
      getPath: vi.fn((name: string) => {
        if (name === 'home') return '/Users/example';
        if (name === 'appData') return '/Users/example/Library/Application Support';
        throw new Error(`Unexpected Electron path lookup: ${name}`);
      }),
    },
    envPaths: vi.fn(() => ({
      cache: '/Users/example/Library/Caches/chromeless',
    })),
    fork,
    getEngineAppPath: vi.fn(() => engineAppPath),
    getEngineInfo: vi.fn(() => ({
      name: helperName,
    })),
    getPreferences: vi.fn(() => ({
      installationPath: '~/Applications/Chromeless Apps',
      requireAdmin: false,
    })),
    packageJson: {
      scriptVersion: '2.14.0',
    },
    path: {
      join: (...parts: string[]) => parts.join('/'),
      resolve: (...parts: string[]) => parts.join('/'),
    },
    sendToAllWindows,
  });

  return {
    fork,
    installAppAsync,
    sendToAllWindows,
  };
};

const waitForFork = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('installAppAsync', () => {
  it('rejects when the selected engine is not installed', async () => {
    const { fork, installAppAsync, sendToAllWindows } = createInstallHarness({
      engineAppPath: null,
    });

    await expect(
      installAppAsync('chrome', 'mail', 'Mail', 'https://mail.example', '/tmp/icon.png', {
        category: 'Productivity',
      }),
    ).rejects.toThrow('Google Chrome is not installed.');

    expect(fork).not.toHaveBeenCalled();
    expect(sendToAllWindows).toHaveBeenCalledWith('update-installation-progress', {
      desc: null,
      percent: 0,
    });
  });

  it('forwards child progress updates and resolves with the installed app metadata', async () => {
    const { fork, installAppAsync, sendToAllWindows } = createInstallHarness();

    const pending = installAppAsync(
      'chrome',
      'mail',
      'Mail',
      'https://mail.example',
      '/tmp/icon.png',
      { category: 'Productivity' },
    );

    await waitForFork();

    expect(fork).toHaveBeenCalledTimes(1);
    const child = fork.mock.results[0]?.value as FakeChildProcess;
    child.emit('message', {
      progress: {
        desc: 'Installing...',
        percent: 45,
      },
    });
    child.emit('exit', 0);

    await expect(pending).resolves.toEqual({
      engine: 'chrome',
      icon: '/tmp/icon.png',
      id: 'mail',
      name: 'Mail',
      opts: { category: 'Productivity' },
      url: 'https://mail.example',
      version: '2.14.0',
    });

    const forkArgs = fork.mock.calls[0];
    expect(forkArgs?.[1]).toEqual(
      expect.arrayContaining([
        '--engine',
        'chrome',
        '--id',
        'mail',
        '--name',
        'Mail',
        '--url',
        'https://mail.example',
      ]),
    );
    expect(sendToAllWindows).toHaveBeenCalledWith('update-installation-progress', {
      desc: 'Installing...',
      percent: 45,
    });
    expect(sendToAllWindows).toHaveBeenCalledWith('update-installation-progress', {
      desc: null,
      percent: 100,
    });
  });

  it('rejects with the child error payload even if the child exits cleanly', async () => {
    const { fork, installAppAsync } = createInstallHarness();

    const pending = installAppAsync('chrome', 'mail', 'Mail', null, '/tmp/icon.png', {});

    await waitForFork();

    const child = fork.mock.results[0]?.value as FakeChildProcess;
    child.emit('message', {
      error: {
        message: 'fork failed',
        name: 'InstallError',
        stack: 'stack trace',
      },
    });
    child.emit('exit', 0);

    await expect(pending).rejects.toMatchObject({
      message: 'fork failed',
      name: 'InstallError',
      stack: 'stack trace',
    });
  });

  it('logs unexpected child messages with install context', async () => {
    const { fork, installAppAsync } = createInstallHarness();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const pending = installAppAsync('chrome', 'mail', 'Mail', null, '/tmp/icon.png', {});

    await waitForFork();

    const child = fork.mock.results[0]?.value as FakeChildProcess;
    child.emit('message', { hello: 'world' });
    child.emit('exit', 0);

    await expect(pending).resolves.toMatchObject({
      id: 'mail',
      name: 'Mail',
    });
    expect(warn).toHaveBeenCalledWith(
      '[chromeless][app-management][install-app][child-message][install:mail] Install worker sent an unexpected message payload. target=Mail (mail)',
      {
        details: { message: { hello: 'world' } },
        targetId: 'mail',
        targetName: 'Mail',
      },
    );
  });

  it('kills the child process when the install is aborted', async () => {
    const { fork, installAppAsync } = createInstallHarness();
    const controller = new AbortController();

    const pending = installAppAsync(
      'chrome',
      'mail',
      'Mail',
      null,
      '/tmp/icon.png',
      {},
      controller.signal,
    );

    await waitForFork();

    const child = fork.mock.results[0]?.value as FakeChildProcess;
    controller.abort();
    child.emit('exit', 1);

    expect(child.kill).toHaveBeenCalledTimes(1);
    await expect(pending).rejects.toThrow('Forked script failed to run correctly.');
  });
});

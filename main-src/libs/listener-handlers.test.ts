/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createInstallTaskManager,
  handleUpdateCheckRequest,
  resolveInstallationPath,
  send,
} from './listener-handlers';

const createSender = () => ({
  isDestroyed: vi.fn(() => false),
  send: vi.fn(),
});

const createManager = (
  installAppAsync: (
    engine: string,
    id: string,
    name: string,
    url: string | null,
    icon: string,
    opts: Record<string, unknown>,
  ) => Promise<Record<string, unknown>> = vi.fn(async () => ({
    engine: 'chrome',
    id: 'mail',
    name: 'Mail',
  })),
) =>
  createInstallTaskManager({
    getInstallFailureMessage: vi.fn(() => 'install failed'),
    getUpdateFailureMessage: vi.fn(() => 'update failed'),
    installAppAsync,
    now: vi.fn(() => 123),
    send,
  });

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe('listener handlers', () => {
  it('sends only to live web contents', () => {
    const sender = createSender();

    send(sender, 'set-app', 'mail');
    expect(sender.send).toHaveBeenCalledWith('set-app', 'mail');

    sender.isDestroyed.mockReturnValue(true);
    send(sender, 'set-app', 'docs');
    expect(sender.send).toHaveBeenCalledTimes(1);

    send(null, 'set-app', 'notes');
    expect(sender.send).toHaveBeenCalledTimes(1);
  });

  it('resolves tilde installation paths with the Electron home path', () => {
    expect(resolveInstallationPath('~/Applications/Chromeless Apps', '/Users/example')).toBe(
      '/Users/example/Applications/Chromeless Apps',
    );
    expect(resolveInstallationPath('/Applications/Chromeless Apps', '/Users/example')).toBe(
      '/Applications/Chromeless Apps',
    );
  });

  it('queues install requests and reports success back to the renderer', async () => {
    const sender = createSender();
    const event = { sender };
    const installAppAsync = vi.fn(async () => ({ icon: 'new-icon.png', version: '1.2.3' }));
    const manager = createManager(installAppAsync);

    manager.requestInstallApp(event, {
      engine: 'chrome',
      icon: 'icon.png',
      id: 'mail',
      name: 'Mail',
      opts: { category: 'Productivity' },
      url: 'https://mail.example',
    });
    await manager.waitForIdle();

    expect(sender.send).toHaveBeenNthCalledWith(1, 'set-app', 'mail', {
      cancelable: true,
      engine: 'chrome',
      icon: 'icon.png',
      id: 'mail',
      lastUpdated: 123,
      name: 'Mail',
      opts: { category: 'Productivity' },
      status: 'INSTALLING',
      url: 'https://mail.example',
    });
    expect(sender.send).toHaveBeenNthCalledWith(2, 'set-app', 'mail', {
      cancelable: false,
    });
    expect(sender.send).toHaveBeenNthCalledWith(3, 'set-app', 'mail', {
      icon: 'new-icon.png',
      status: 'INSTALLED',
      version: '1.2.3',
    });
  });

  it('removes failed install attempts after showing a failure message', async () => {
    const sender = createSender();
    const error = new Error('boom');
    const manager = createInstallTaskManager({
      getInstallFailureMessage: vi.fn(() => 'Install failed for Mail.'),
      getUpdateFailureMessage: vi.fn(() => 'Update failed for Mail.'),
      installAppAsync: vi.fn(async () => {
        throw error;
      }),
      now: vi.fn(() => 123),
      send,
    });

    manager.requestInstallApp(
      { sender },
      {
        engine: 'chrome',
        icon: 'icon.png',
        id: 'mail',
        name: 'Mail',
        opts: {},
        url: null,
      },
    );
    await manager.waitForIdle();

    expect(sender.send).toHaveBeenCalledWith(
      'enqueue-snackbar',
      'Install failed for Mail.',
      'error',
    );
    expect(sender.send).toHaveBeenCalledWith('remove-app', 'mail');
  });

  it('restores installed status when an update fails', async () => {
    const sender = createSender();
    const manager = createInstallTaskManager({
      getInstallFailureMessage: vi.fn(() => 'Install failed for Mail.'),
      getUpdateFailureMessage: vi.fn(() => 'Update failed for Mail.'),
      installAppAsync: vi.fn(async () => {
        throw new Error('boom');
      }),
      now: vi.fn(() => 123),
      send,
    });

    manager.requestUpdateApp(
      { sender },
      {
        engine: 'chrome',
        icon: 'icon.png',
        id: 'mail',
        name: 'Mail',
        opts: {},
        url: null,
      },
    );
    await manager.waitForIdle();

    expect(sender.send).toHaveBeenCalledWith(
      'enqueue-snackbar',
      'Update failed for Mail.',
      'error',
    );
    expect(sender.send).toHaveBeenCalledWith('set-app', 'mail', {
      status: 'INSTALLED',
    });
  });

  it('updates app details and timestamps after successful updates', async () => {
    const sender = createSender();
    const manager = createInstallTaskManager({
      getInstallFailureMessage: vi.fn(() => 'Install failed for Mail.'),
      getUpdateFailureMessage: vi.fn(() => 'Update failed for Mail.'),
      installAppAsync: vi.fn(async () => ({ icon: 'new-icon.png', version: '2.0.0' })),
      now: vi.fn(() => 456),
      send,
    });

    manager.requestUpdateApp(
      { sender },
      {
        engine: 'chrome',
        icon: 'icon.png',
        id: 'mail',
        name: 'Mail',
        opts: {},
        url: null,
      },
    );
    await manager.waitForIdle();

    expect(sender.send).toHaveBeenCalledWith('set-app', 'mail', {
      icon: 'new-icon.png',
      lastUpdated: 456,
      status: 'INSTALLED',
      version: '2.0.0',
    });
  });

  it('cancels pending install and update tasks before they start', async () => {
    const sender = createSender();
    const manager = createManager();

    manager.requestInstallApp(
      { sender },
      {
        engine: 'chrome',
        icon: 'icon.png',
        id: 'install',
        name: 'Install',
        opts: {},
        url: null,
      },
    );
    manager.cancelInstallApp({ sender }, 'install');

    manager.requestUpdateApp(
      { sender },
      {
        engine: 'chrome',
        icon: 'icon.png',
        id: 'update',
        name: 'Update',
        opts: {},
        url: null,
      },
    );
    manager.cancelUpdateApp({ sender }, 'update');
    await manager.waitForIdle();

    expect(sender.send).toHaveBeenCalledWith('remove-app', 'install');
    expect(sender.send).toHaveBeenCalledWith('set-app', 'update', {
      cancelable: false,
      status: 'INSTALLED',
    });
  });

  it('skips update checks when updater is inactive or unavailable', () => {
    const autoUpdater = {
      checkForUpdates: vi.fn(),
      isUpdaterActive: vi.fn(() => false),
      quitAndInstall: vi.fn(),
    };

    handleUpdateCheckRequest(
      {
        app: { removeAllListeners: vi.fn() },
        autoUpdater,
        canCheckForUpdates: vi.fn(() => true),
        getMainWindow: vi.fn(() => null),
        globalObj: {},
        setImmediateFn: vi.fn((callback) => callback()),
      },
      true,
    );
    expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();

    autoUpdater.isUpdaterActive.mockReturnValue(true);
    handleUpdateCheckRequest(
      {
        app: { removeAllListeners: vi.fn() },
        autoUpdater,
        canCheckForUpdates: vi.fn(() => false),
        getMainWindow: vi.fn(() => null),
        globalObj: {},
        setImmediateFn: vi.fn((callback) => callback()),
      },
      true,
    );
    expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
  });

  it('applies downloaded updates before checking for updates again', () => {
    const win = { close: vi.fn() };
    const app = { removeAllListeners: vi.fn() };
    const autoUpdater = {
      checkForUpdates: vi.fn(),
      isUpdaterActive: vi.fn(() => true),
      quitAndInstall: vi.fn(),
    };
    const globalObj: {
      updateSilent?: boolean;
      updaterObj: { status: string };
    } = {
      updaterObj: { status: 'update-downloaded' },
    };

    handleUpdateCheckRequest(
      {
        app,
        autoUpdater,
        canCheckForUpdates: vi.fn(() => true),
        getMainWindow: vi.fn(() => win),
        globalObj,
        setImmediateFn: vi.fn((callback) => callback()),
      },
      true,
    );

    expect(app.removeAllListeners).toHaveBeenCalledWith('window-all-closed');
    expect(win.close).toHaveBeenCalled();
    expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(false);
    expect(globalObj.updateSilent).toBe(true);
    expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
  });
});

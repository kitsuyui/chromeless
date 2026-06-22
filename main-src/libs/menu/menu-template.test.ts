/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

import { createMenuTemplate } from './menu-template';

type TestMenuItem = {
  click?: (...args: unknown[]) => void;
  enabled?: boolean;
  label?: string;
  role?: string;
  submenu?: TestMenuItem[];
  visible?: boolean;
};

const createTemplate = (overrides = {}) => {
  const input = {
    appName: 'Chromeless',
    emitCheckForUpdates: vi.fn(),
    openExternal: vi.fn(),
    sendToAllWindows: vi.fn(),
    updaterState: null,
    ...overrides,
  };

  return { input, template: createMenuTemplate(input) as TestMenuItem[] };
};

const getSubmenu = (item: TestMenuItem) => item.submenu ?? [];

describe('createMenuTemplate', () => {
  it('creates app menu actions from injected dependencies', () => {
    const { input, template } = createTemplate();
    const appMenu = getSubmenu(template[0]);

    expect(template[0].label).toBe('Chromeless');
    appMenu.find((item) => item.label === 'About Chromeless')?.click?.();
    appMenu.find((item) => item.label === 'Preferences...')?.click?.();
    appMenu.find((item) => item.label === 'Check for Updates...')?.click?.();

    expect(input.sendToAllWindows).toHaveBeenNthCalledWith(1, 'open-dialog-about');
    expect(input.sendToAllWindows).toHaveBeenNthCalledWith(2, 'go-to-preferences');
    expect(input.emitCheckForUpdates).toHaveBeenCalled();
  });

  it('uses updater state to describe disabled updater menu items', () => {
    const { template } = createTemplate({
      updaterState: {
        info: {
          bytesPerSecond: 2048,
          total: 4096,
          transferred: 1024,
        },
        status: 'download-progress',
      },
    });

    const appMenu = getSubmenu(template[0]);
    const updaterItem = appMenu.find((item) =>
      String(item.label).startsWith('Downloading Updates'),
    );

    expect(updaterItem).toMatchObject({
      enabled: false,
      label: 'Downloading Updates (1 KB/4 KB at 2 KB/s)...',
    });
  });

  it('routes help menu links to the fork repository', () => {
    const { input, template } = createTemplate();
    const helpMenu = getSubmenu(template[4]);

    helpMenu.find((item) => item.label === 'Report a Bug via GitHub...')?.click?.();
    helpMenu.find((item) => item.label === 'Request a New Feature via GitHub...')?.click?.();

    expect(input.openExternal).toHaveBeenNthCalledWith(
      1,
      'https://github.com/kitsuyui/chromeless/issues',
    );
    expect(input.openExternal).toHaveBeenNthCalledWith(
      2,
      'https://github.com/kitsuyui/chromeless/issues/new?template=feature.md&title=feature%3A+',
    );
  });

  it('updates browser window zoom without touching absent windows', () => {
    const { template } = createTemplate();
    const viewMenu = getSubmenu(template[2]);
    const browserWindow = {
      webContents: {
        zoomFactor: 1,
      },
    };

    viewMenu.find((item) => item.label === 'Actual Size')?.click?.({}, browserWindow);
    expect(browserWindow.webContents.zoomFactor).toBe(1);

    viewMenu
      .filter((item) => item.label === 'Zoom In' && item.visible !== false)[0]
      .click?.({}, browserWindow);
    expect(browserWindow.webContents.zoomFactor).toBe(1.1);

    viewMenu.find((item) => item.label === 'Zoom Out')?.click?.({}, browserWindow);
    expect(browserWindow.webContents.zoomFactor).toBe(1);

    browserWindow.webContents.zoomFactor = 0.1;
    viewMenu.find((item) => item.label === 'Zoom Out')?.click?.({}, browserWindow);
    expect(browserWindow.webContents.zoomFactor).toBe(0.1);

    viewMenu.find((item) => item.label === 'Actual Size')?.click?.({}, null);
  });
});

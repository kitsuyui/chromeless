/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it, vi } from 'vitest';

import { INSTALLED, INSTALLING } from '../../constants/app-statuses';
import { createAppCardMenuTemplate } from './app-card-menu';

const createDependencies = () => ({
  getRelatedPathsAsync: vi.fn(async () => [
    { path: '/Applications/Mail.app' },
    { path: '/Users/example/Library/Application Support/Mail' },
  ]),
  requestCancelInstallApp: vi.fn(),
  requestCancelUpdateApp: vi.fn(),
  requestOpenInBrowser: vi.fn(),
  requestUninstallApp: vi.fn(),
});

const createInput = (overrides = {}) => ({
  cancelable: true,
  combinedOpts: { category: 'Productivity' },
  engine: 'chrome',
  engineName: 'Google Chrome',
  icon: 'icon.png',
  id: 'mail',
  isOutdated: false,
  name: 'Mail',
  onOpenDialogCreateCustomApp: vi.fn(),
  onOpenDialogEditApp: vi.fn(),
  onUpdateApp: vi.fn(),
  showItemInFolder: vi.fn(),
  status: INSTALLED,
  url: 'https://mail.example',
  version: '1.2.3',
  ...overrides,
});

describe('createAppCardMenuTemplate', () => {
  it('creates installed-app menu actions without touching Electron APIs directly', async () => {
    const dependencies = createDependencies();
    const input = createInput();

    const template = createAppCardMenuTemplate(input, dependencies);
    const labels = template.map((item) => item.label ?? item.type);

    expect(labels).toEqual([
      'Edit',
      'Clone',
      'Reinstall (Repair)',
      'separator',
      'Show App in Finder',
      'Show Data Directory in Finder',
      'separator',
      "What's New",
      'Powered by Google Chrome (script v1.2.3)',
    ]);

    template.find((item) => item.label === 'Edit')?.click?.();
    expect(input.onOpenDialogEditApp).toHaveBeenCalledWith({
      engine: 'chrome',
      icon: 'icon.png',
      id: 'mail',
      name: 'Mail',
      opts: { category: 'Productivity' },
      url: 'https://mail.example',
      urlDisabled: false,
    });

    await template.find((item) => item.label === 'Show Data Directory in Finder')?.click?.();
    expect(input.showItemInFolder).toHaveBeenCalledWith(
      '/Users/example/Library/Application Support/Mail',
    );
  });

  it('switches installed actions between repair and uninstall by outdated state', () => {
    const dependencies = createDependencies();
    const input = createInput({ isOutdated: true });

    const template = createAppCardMenuTemplate(input, dependencies);

    expect(template.map((item) => item.label).filter(Boolean)).toContain('Uninstall');
    expect(template.map((item) => item.label).filter(Boolean)).not.toContain('Reinstall (Repair)');

    template.find((item) => item.label === 'Uninstall')?.click?.();
    expect(dependencies.requestUninstallApp).toHaveBeenCalledWith('chrome', 'mail', 'Mail');
  });

  it('uses cancel-update for installing apps with an existing version', () => {
    const dependencies = createDependencies();
    const input = createInput({ status: INSTALLING, version: '1.2.3' });

    const template = createAppCardMenuTemplate(input, dependencies);

    expect(template[0].label).toBe('Cancel Update');
    template[0].click?.();
    expect(dependencies.requestCancelUpdateApp).toHaveBeenCalledWith('mail');
    expect(dependencies.requestCancelInstallApp).not.toHaveBeenCalled();
  });

  it('keeps clone available for entries without a URL and marks the cloned URL disabled', () => {
    const dependencies = createDependencies();
    const input = createInput({ engine: null, status: null, url: null, version: null });

    const template = createAppCardMenuTemplate(input, dependencies);

    expect(template.map((item) => item.label ?? item.type)).toEqual([
      'Clone',
      'separator',
      'separator',
    ]);
    template[0].click?.();
    expect(input.onOpenDialogCreateCustomApp).toHaveBeenCalledWith({
      icon: 'icon.png',
      name: 'Mail 2',
      url: null,
      urlDisabled: true,
    });
  });
});

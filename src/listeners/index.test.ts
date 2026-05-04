/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  batch: vi.fn((callback: () => void) => callback()),
  cleanAppManagement: vi.fn(() => ({ type: 'clean-app-management-action' })),
  removeApp: vi.fn((id) => ({ id, type: 'remove-app-action' })),
  setApp: vi.fn((id, app) => ({ app, id, type: 'set-app-action' })),
  setPreference: vi.fn((name, value) => ({ name, type: 'set-preference-action', value })),
  setPreferences: vi.fn((preferences) => ({ preferences, type: 'set-preferences-action' })),
  setScanningForInstalled: vi.fn((scanning) => ({
    scanning,
    type: 'set-scanning-for-installed-action',
  })),
  setSystemPreference: vi.fn((name, value) => ({
    name,
    type: 'set-system-preference-action',
    value,
  })),
}));

vi.mock('react-redux', () => ({
  batch: mocks.batch,
}));

vi.mock('../state/app-management/actions', () => ({
  clean: mocks.cleanAppManagement,
  removeApp: mocks.removeApp,
  setApp: mocks.setApp,
  setScanningForInstalled: mocks.setScanningForInstalled,
}));

vi.mock('../state/preferences/actions', () => ({
  setPreference: mocks.setPreference,
  setPreferences: mocks.setPreferences,
}));

vi.mock('../state/system-preferences/actions', () => ({
  setSystemPreference: mocks.setSystemPreference,
}));

import loadListeners from './index';

const listeners = new Map<string, (...args: unknown[]) => void>();
const ipcRenderer = {
  on: vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
    listeners.set(channel, listener);
  }),
};

beforeEach(() => {
  vi.stubGlobal('window', { ipcRenderer });
  listeners.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('loadListeners', () => {
  it('registers IPC listeners for renderer state updates', () => {
    loadListeners({ dispatch: vi.fn() });

    expect([...listeners.keys()]).toEqual([
      'log',
      'clean-app-management',
      'set-app',
      'set-app-batch',
      'remove-app',
      'set-preference',
      'set-preferences',
      'set-system-preference',
      'set-scanning-for-installed',
    ]);
  });

  it('dispatches app management actions from IPC payloads', () => {
    const store = { dispatch: vi.fn() };
    loadListeners(store);

    listeners.get('clean-app-management')?.();
    listeners.get('set-app')?.({}, 'mail', { name: 'Mail' });
    listeners.get('remove-app')?.({}, 'mail');
    listeners.get('set-scanning-for-installed')?.({}, true);

    expect(store.dispatch).toHaveBeenNthCalledWith(1, { type: 'clean-app-management-action' });
    expect(store.dispatch).toHaveBeenNthCalledWith(2, {
      app: { name: 'Mail' },
      id: 'mail',
      type: 'set-app-action',
    });
    expect(store.dispatch).toHaveBeenNthCalledWith(3, { id: 'mail', type: 'remove-app-action' });
    expect(store.dispatch).toHaveBeenNthCalledWith(4, {
      scanning: true,
      type: 'set-scanning-for-installed-action',
    });
  });

  it('batches app updates from IPC payloads', () => {
    const store = { dispatch: vi.fn() };
    loadListeners(store);

    listeners.get('set-app-batch')?.({}, [
      { id: 'mail', name: 'Mail' },
      { id: 'docs', name: 'Docs' },
    ]);

    expect(mocks.batch).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenNthCalledWith(1, {
      app: { id: 'mail', name: 'Mail' },
      id: 'mail',
      type: 'set-app-action',
    });
    expect(store.dispatch).toHaveBeenNthCalledWith(2, {
      app: { id: 'docs', name: 'Docs' },
      id: 'docs',
      type: 'set-app-action',
    });
  });

  it('dispatches preference updates from IPC payloads', () => {
    const store = { dispatch: vi.fn() };
    loadListeners(store);

    listeners.get('set-preference')?.({}, 'theme', 'dark');
    listeners.get('set-preferences')?.({}, { theme: 'dark' });
    listeners.get('set-system-preference')?.({}, 'hardwareAcceleration', true);

    expect(store.dispatch).toHaveBeenNthCalledWith(1, {
      name: 'theme',
      type: 'set-preference-action',
      value: 'dark',
    });
    expect(store.dispatch).toHaveBeenNthCalledWith(2, {
      preferences: { theme: 'dark' },
      type: 'set-preferences-action',
    });
    expect(store.dispatch).toHaveBeenNthCalledWith(3, {
      name: 'hardwareAcceleration',
      type: 'set-system-preference-action',
      value: true,
    });
  });
});

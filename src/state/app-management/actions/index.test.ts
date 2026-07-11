/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CLEAN_APP_MANAGEMENT,
  REMOVE_APP,
  SET_APP,
  SET_SCANNING_FOR_INSTALLED,
  SORT_APPS,
} from '../../../constants/actions';
import { INSTALLED } from '../../../constants/app-statuses';
import { requestInstallApp, requestShowMessageBox, requestUpdateApp } from '../../../senders';
import {
  clean,
  installApp,
  removeApp,
  setApp,
  setScanningForInstalled,
  sortApps,
  updateAllApps,
  updateApp,
  updateApps,
} from './index';

vi.mock('../../../senders', () => ({
  requestInstallApp: vi.fn(),
  requestShowMessageBox: vi.fn(),
  requestUpdateApp: vi.fn(),
}));

const createState = () => ({
  appManagement: {
    apps: {
      mail: {
        engine: 'chrome',
        icon: 'mail.png',
        id: 'mail',
        name: 'Mail',
        opts: { category: 'Productivity' },
        status: INSTALLED,
        url: 'https://mail.example',
        version: '0.0.1',
      },
      notes: {
        engine: 'chrome',
        icon: 'notes.png',
        id: 'notes',
        name: 'Notes',
        opts: {},
        status: INSTALLED,
        url: 'https://notes.example',
        version: '999.0.0',
      },
    },
    sortedAppIds: ['mail', 'notes'],
  },
  installed: {
    activeQuery: 'ma',
  },
  preferences: {
    sortInstalledAppBy: 'name',
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('app-management actions', () => {
  it('creates simple action objects', () => {
    expect(removeApp('mail')).toEqual({ id: 'mail', type: REMOVE_APP });
    expect(setScanningForInstalled(true)).toEqual({
      scanning: true,
      type: SET_SCANNING_FOR_INSTALLED,
    });
  });

  it('dispatches state-derived clean, set, and sort payloads', () => {
    const dispatch = vi.fn();
    const getState = () => createState();

    clean()(dispatch, getState);
    setApp('calendar', { name: 'Calendar' })(dispatch, getState);
    sortApps()(dispatch, getState);

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      apps: getState().appManagement.apps,
      type: CLEAN_APP_MANAGEMENT,
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      activeQuery: 'ma',
      app: { name: 'Calendar' },
      apps: getState().appManagement.apps,
      id: 'calendar',
      sortInstalledAppBy: 'name',
      type: SET_APP,
    });
    expect(dispatch).toHaveBeenNthCalledWith(3, {
      apps: getState().appManagement.apps,
      sortInstalledAppBy: 'name',
      type: SORT_APPS,
    });
  });

  it('trims app names before install requests', () => {
    installApp('chrome', 'calendar', ' Calendar ', 'https://calendar.example', 'icon.png', {
      category: 'Calendar',
    })(vi.fn(), createState);

    expect(requestInstallApp).toHaveBeenCalledWith(
      'chrome',
      'calendar',
      'Calendar',
      'https://calendar.example',
      'icon.png',
      { category: 'Calendar' },
    );
  });

  it('shows a message instead of installing duplicate names', () => {
    installApp(
      'chrome',
      'mail2',
      ' Mail ',
      'https://mail.example',
      'icon.png',
      {},
    )(vi.fn(), createState);

    expect(requestShowMessageBox).toHaveBeenCalledWith(
      'An app named Mail already exists.',
      'error',
    );
    expect(requestInstallApp).not.toHaveBeenCalled();
  });

  it('merges existing app details into update requests', async () => {
    await updateApp('mail', 'Team Mail', undefined, undefined, { pinned: true })(
      vi.fn(),
      createState,
    );

    expect(requestUpdateApp).toHaveBeenCalledWith(
      'chrome',
      'mail',
      'Team Mail',
      'https://mail.example',
      'mail.png',
      {
        category: 'Productivity',
        pinned: true,
      },
    );
  });

  it('keeps explicit null URLs when updating apps', async () => {
    await updateApp('mail', undefined, null, 'custom.png')(vi.fn(), createState);

    expect(requestUpdateApp).toHaveBeenCalledWith('chrome', 'mail', 'Mail', null, 'custom.png', {
      category: 'Productivity',
    });
  });

  it('dispatches updates for explicit and outdated app lists', () => {
    const dispatch = vi.fn();

    updateApps([{ id: 'mail' }, { id: 'notes' }])(dispatch);
    updateAllApps()(dispatch, createState);

    expect(dispatch).toHaveBeenNthCalledWith(1, expect.any(Function));
    expect(dispatch).toHaveBeenNthCalledWith(2, expect.any(Function));
    expect(dispatch).toHaveBeenNthCalledWith(3, expect.any(Function));
  });
});

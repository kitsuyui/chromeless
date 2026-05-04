/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DIALOG_SET_INSTALLATION_PATH_CLOSE,
  DIALOG_SET_INSTALLATION_PATH_FORM_UPDATE,
  DIALOG_SET_INSTALLATION_PATH_OPEN,
} from '../../constants/actions';
import { requestSetPreference } from '../../senders';
import { close, open, save, updateForm } from './actions';

vi.mock('../../senders', () => ({
  requestSetPreference: vi.fn(),
}));

const showMessageBox = vi.fn(() => Promise.resolve());

const createState = (apps = {}) => ({
  appManagement: {
    apps,
  },
  dialogSetInstallationPath: {
    form: {
      installationPath: '~/Applications/Chromeless Apps',
      requireAdmin: false,
    },
  },
  preferences: {
    installationPath: '~/Applications',
    requireAdmin: true,
  },
});

beforeEach(() => {
  vi.stubGlobal('window', {
    remote: {
      dialog: { showMessageBox },
      getCurrentWindow: vi.fn(() => 'window'),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('dialog-set-installation-path actions', () => {
  it('creates simple action objects', () => {
    expect(close()).toEqual({ type: DIALOG_SET_INSTALLATION_PATH_CLOSE });
    expect(updateForm({ requireAdmin: false })).toEqual({
      changes: { requireAdmin: false },
      type: DIALOG_SET_INSTALLATION_PATH_FORM_UPDATE,
    });
  });

  it('opens with the current preference values as initial form', () => {
    const dispatch = vi.fn();

    open()(dispatch, () => createState());

    expect(dispatch).toHaveBeenCalledWith({
      initialForm: {
        installationPath: '~/Applications',
        requireAdmin: true,
      },
      type: DIALOG_SET_INSTALLATION_PATH_OPEN,
    });
  });

  it('saves installation preferences when no apps are installed', () => {
    const dispatch = vi.fn();

    save()(dispatch, () => createState());

    expect(requestSetPreference).toHaveBeenNthCalledWith(1, 'requireAdmin', false);
    expect(requestSetPreference).toHaveBeenNthCalledWith(
      2,
      'installationPath',
      '~/Applications/Chromeless Apps',
    );
    expect(dispatch).toHaveBeenCalledWith({ type: DIALOG_SET_INSTALLATION_PATH_CLOSE });
  });

  it('shows a message and leaves preferences unchanged when apps are installed', () => {
    const dispatch = vi.fn();

    save()(dispatch, () => createState({ mail: { id: 'mail' } }));

    expect(showMessageBox).toHaveBeenCalledWith('window', {
      buttons: ['OK'],
      cancelId: 0,
      defaultId: 0,
      message: 'You need to uninstall all of your Chromeless apps before changing this preference.',
      title: 'Uninstall all of Chromeless apps first',
    });
    expect(requestSetPreference).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: DIALOG_SET_INSTALLATION_PATH_CLOSE });
  });
});

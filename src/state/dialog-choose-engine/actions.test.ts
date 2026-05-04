/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DIALOG_CHOOSE_ENGINE_CLOSE,
  DIALOG_CHOOSE_ENGINE_FORM_UPDATE,
  DIALOG_CHOOSE_ENGINE_OPEN,
} from '../../constants/actions';
import { requestShowMessageBox } from '../../senders';
import { close, create, open, updateForm } from './actions';

const mocks = vi.hoisted(() => {
  const installAppThunk = vi.fn();
  return {
    installApp: vi.fn(() => installAppThunk),
    installAppThunk,
  };
});

vi.mock('../../senders', () => ({
  requestShowMessageBox: vi.fn(),
}));

vi.mock('../app-management/actions', () => ({
  installApp: mocks.installApp,
}));

const createState = (name = 'Calendar') => ({
  appManagement: {
    apps: {
      mail: {
        name: 'Mail',
      },
    },
  },
  dialogChooseEngine: {
    form: {
      engine: 'chrome',
      icon: 'icon.png',
      id: 'calendar',
      name,
      opts: { category: 'Calendar' },
      url: 'https://calendar.example',
    },
  },
  preferences: {
    preferredEngine: 'chrome',
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dialog-choose-engine actions', () => {
  it('creates simple action objects', () => {
    expect(close()).toEqual({ type: DIALOG_CHOOSE_ENGINE_CLOSE });
    expect(updateForm({ engine: 'firefox' })).toEqual({
      changes: { engine: 'firefox' },
      type: DIALOG_CHOOSE_ENGINE_FORM_UPDATE,
    });
  });

  it('opens with the preferred engine as the selected form engine', () => {
    const dispatch = vi.fn();

    open('calendar', 'Calendar', 'https://calendar.example', 'icon.png', { category: 'Calendar' })(
      dispatch,
      () => createState(),
    );

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      changes: {
        engine: 'chrome',
        icon: 'icon.png',
        id: 'calendar',
        name: 'Calendar',
        opts: { category: 'Calendar' },
        url: 'https://calendar.example',
      },
      type: DIALOG_CHOOSE_ENGINE_FORM_UPDATE,
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      form: {
        engine: 'chrome',
        icon: 'icon.png',
        id: 'calendar',
        name: 'Calendar',
        opts: { category: 'Calendar' },
        url: 'https://calendar.example',
      },
      type: DIALOG_CHOOSE_ENGINE_OPEN,
    });
  });

  it('creates the selected app and closes when the name is available', () => {
    const dispatch = vi.fn();

    create()(dispatch, () => createState());

    expect(mocks.installApp).toHaveBeenCalledWith(
      'chrome',
      'calendar',
      'Calendar',
      'https://calendar.example',
      'icon.png',
      { category: 'Calendar' },
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, mocks.installAppThunk);
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: DIALOG_CHOOSE_ENGINE_CLOSE });
  });

  it('shows a duplicate-name error instead of creating an app', () => {
    const dispatch = vi.fn();

    create()(dispatch, () => createState('Mail'));

    expect(requestShowMessageBox).toHaveBeenCalledWith(
      'An app named Mail already exists.',
      'error',
    );
    expect(mocks.installApp).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});

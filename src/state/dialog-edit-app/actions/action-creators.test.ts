/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DIALOG_EDIT_APP_CLOSE,
  DIALOG_EDIT_APP_FORM_UPDATE,
  DIALOG_EDIT_APP_OPEN,
} from '../../../constants/actions';
import { close, open, save, updateForm, updateFormOpts } from './action-creators';

const mocks = vi.hoisted(() => ({
  updateApp: vi.fn((...args: unknown[]) => ({
    args,
    type: 'update-app-action',
  })),
}));

vi.mock('../../../helpers/get-static-global', () => ({
  default: vi.fn(() => 'default-icon.png'),
}));

vi.mock('../../app-management/actions', () => ({
  updateApp: mocks.updateApp,
}));

const createState = (form: Record<string, unknown>) => ({
  dialogEditApp: {
    form,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dialog-edit-app action creators', () => {
  it('creates simple action objects', () => {
    expect(close()).toEqual({ type: DIALOG_EDIT_APP_CLOSE });
    expect(open({ id: 'mail' })).toEqual({
      form: { id: 'mail' },
      type: DIALOG_EDIT_APP_OPEN,
    });
  });

  it('validates form updates with current URL-disabled settings', () => {
    const dispatch = vi.fn();

    updateForm({ name: '' })(dispatch, () => createState({ urlDisabled: false }));

    expect(dispatch).toHaveBeenCalledWith({
      changes: {
        name: '',
        nameError: 'Name is required.',
      },
      type: DIALOG_EDIT_APP_FORM_UPDATE,
    });
  });

  it('merges option updates into the current form options', () => {
    const dispatch = vi.fn();

    updateFormOpts({ pinned: true })(dispatch, () =>
      createState({ opts: { category: 'Productivity' } }),
    );

    expect(dispatch).toHaveBeenCalledWith({
      changes: {
        opts: {
          category: 'Productivity',
          pinned: true,
        },
      },
      type: DIALOG_EDIT_APP_FORM_UPDATE,
    });
  });

  it('dispatches validation changes instead of updating invalid apps', () => {
    const dispatch = vi.fn();

    save()(dispatch, () => createState({ id: 'mail', name: '', url: '' }));

    const updateFormThunk = dispatch.mock.calls[0][0];
    const updateFormDispatch = vi.fn();
    updateFormThunk(updateFormDispatch, () => createState({ id: 'mail', name: '', url: '' }));

    expect(updateFormDispatch).toHaveBeenCalledWith({
      changes: expect.objectContaining({
        nameError: 'Name is required.',
        urlError: 'URL is required.',
      }),
      type: DIALOG_EDIT_APP_FORM_UPDATE,
    });
    expect(mocks.updateApp).not.toHaveBeenCalled();
  });

  it('dispatches app updates and closes after building a valid save payload', () => {
    const dispatch = vi.fn();

    save()(dispatch, () =>
      createState({
        icon: 'icon.png',
        id: 'mail',
        name: 'Mail',
        opts: { category: 'Productivity' },
        url: 'mail.example',
      }),
    );

    expect(mocks.updateApp).toHaveBeenCalledWith(
      'mail',
      'Mail',
      'http://mail.example',
      'icon.png',
      { category: 'Productivity' },
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      args: ['mail', 'Mail', 'http://mail.example', 'icon.png', { category: 'Productivity' }],
      type: 'update-app-action',
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: DIALOG_EDIT_APP_CLOSE });
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DIALOG_CREATE_CUSTOM_APP_CLOSE,
  DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
  DIALOG_CREATE_CUSTOM_APP_OPEN,
} from '../../../constants/actions';
import { requestShowMessageBox } from '../../../senders';
import { close, create, open, updateForm } from './action-creators';

const mocks = vi.hoisted(() => ({
  openDialogChooseEngine: vi.fn((...args: unknown[]) => ({
    args,
    type: 'open-dialog-choose-engine-action',
  })),
}));

vi.mock('../../../helpers/get-static-global', () => ({
  default: vi.fn(() => 'default-icon.png'),
}));

vi.mock('../../../senders', () => ({
  requestShowMessageBox: vi.fn(),
}));

vi.mock('../../dialog-choose-engine/actions', () => ({
  open: mocks.openDialogChooseEngine,
}));

const createState = (form: Record<string, unknown>, apps = {}) => ({
  appManagement: {
    apps,
  },
  dialogCreateCustomApp: {
    form,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(123);
});

describe('dialog-create-custom-app action creators', () => {
  it('creates simple action objects', () => {
    expect(close()).toEqual({ type: DIALOG_CREATE_CUSTOM_APP_CLOSE });
    expect(open({ name: 'Mail' })).toEqual({
      form: { name: 'Mail' },
      type: DIALOG_CREATE_CUSTOM_APP_OPEN,
    });
  });

  it('validates form updates with current URL-disabled settings', () => {
    const dispatch = vi.fn();

    updateForm({ url: '' })(dispatch, () => createState({ urlDisabled: false }));

    expect(dispatch).toHaveBeenCalledWith({
      changes: {
        url: '',
        urlError: 'URL is required.',
      },
      type: DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
    });
  });

  it('dispatches validation changes instead of opening engine selection for invalid forms', () => {
    const dispatch = vi.fn();

    create()(dispatch, () => createState({ name: '', url: '' }));

    const updateFormThunk = dispatch.mock.calls[0][0];
    const updateFormDispatch = vi.fn();
    updateFormThunk(updateFormDispatch, () => createState({ name: '', url: '' }));

    expect(updateFormDispatch).toHaveBeenCalledWith({
      changes: expect.objectContaining({
        nameError: 'Name is required.',
        urlError: 'URL is required.',
      }),
      type: DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
    });
    expect(mocks.openDialogChooseEngine).not.toHaveBeenCalled();
  });

  it('shows duplicate-name errors before opening engine selection', () => {
    const dispatch = vi.fn();

    create()(dispatch, () =>
      createState(
        { name: 'Mail', url: 'mail.example' },
        {
          mail: { name: 'Mail' },
        },
      ),
    );

    expect(requestShowMessageBox).toHaveBeenCalledWith(
      'An app named Mail already exists.',
      'error',
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('opens engine selection and closes after building a valid custom app payload', () => {
    const dispatch = vi.fn();

    create()(dispatch, () => createState({ name: 'Team Mail', url: 'mail.example' }));

    expect(mocks.openDialogChooseEngine).toHaveBeenCalledWith(
      'custom-123',
      'Team Mail',
      'http://mail.example',
      'default-icon.png',
      { slug: 'team-mail' },
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      args: [
        'custom-123',
        'Team Mail',
        'http://mail.example',
        'default-icon.png',
        { slug: 'team-mail' },
      ],
      type: 'open-dialog-choose-engine-action',
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: DIALOG_CREATE_CUSTOM_APP_CLOSE });
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import {
  DIALOG_CREATE_CUSTOM_APP_CLOSE,
  DIALOG_CREATE_CUSTOM_APP_DOWNLOADING_ICON_UPDATE,
  DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
  DIALOG_CREATE_CUSTOM_APP_OPEN,
} from '../../constants/actions';
import reducer from './reducers';

describe('dialog-create-custom-app reducers', () => {
  it('opens with default form values plus provided overrides', () => {
    const state = reducer(undefined, {
      type: DIALOG_CREATE_CUSTOM_APP_OPEN,
      form: {
        name: 'Mail',
        url: 'https://mail.example',
      },
    });

    expect(state).toMatchObject({
      downloadingIcon: false,
      form: {
        icon: null,
        name: 'Mail',
        url: 'https://mail.example',
        urlDisabled: false,
      },
      open: true,
    });
  });

  it('updates form fields and download state independently', () => {
    let state = reducer(undefined, {
      type: DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
      changes: {
        name: 'Calendar',
        urlDisabled: true,
      },
    });

    expect(state.form).toMatchObject({
      name: 'Calendar',
      urlDisabled: true,
    });

    state = reducer(state, {
      type: DIALOG_CREATE_CUSTOM_APP_DOWNLOADING_ICON_UPDATE,
      downloadingIcon: true,
    });

    expect(state.downloadingIcon).toBe(true);
  });

  it('closes without discarding the current form draft', () => {
    const state = reducer(
      {
        downloadingIcon: false,
        form: {
          icon: null,
          name: 'Draft',
          url: 'https://draft.example',
          urlDisabled: false,
        },
        open: true,
      },
      { type: DIALOG_CREATE_CUSTOM_APP_CLOSE },
    );

    expect(state.open).toBe(false);
    expect(state.form.name).toBe('Draft');
  });
});

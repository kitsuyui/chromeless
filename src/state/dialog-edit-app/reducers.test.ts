/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import {
  DIALOG_EDIT_APP_CLOSE,
  DIALOG_EDIT_APP_DOWNLOADING_ICON_UPDATE,
  DIALOG_EDIT_APP_FORM_UPDATE,
  DIALOG_EDIT_APP_OPEN,
} from '../../constants/actions';
import reducer from './reducers';

describe('dialog-edit-app reducers', () => {
  it('opens with the selected app form and resets transient state', () => {
    const state = reducer(
      {
        downloadingIcon: true,
        form: { name: 'Old', url: 'https://old.example' },
        open: false,
        savable: true,
      },
      {
        type: DIALOG_EDIT_APP_OPEN,
        form: {
          engine: 'chrome',
          name: 'Mail',
          url: 'https://mail.example',
        },
      },
    );

    expect(state).toMatchObject({
      downloadingIcon: false,
      form: {
        engine: 'chrome',
        name: 'Mail',
        url: 'https://mail.example',
      },
      open: true,
      savable: false,
    });
  });

  it('marks the dialog savable after form updates and clears it on close', () => {
    let state = reducer(undefined, {
      type: DIALOG_EDIT_APP_FORM_UPDATE,
      changes: { name: 'New name' },
    });

    expect(state.form.name).toBe('New name');
    expect(state.savable).toBe(true);

    state = reducer(state, {
      type: DIALOG_EDIT_APP_DOWNLOADING_ICON_UPDATE,
      downloadingIcon: true,
    });

    expect(state.downloadingIcon).toBe(true);

    state = reducer(state, { type: DIALOG_EDIT_APP_CLOSE });

    expect(state.open).toBe(false);
    expect(state.savable).toBe(false);
  });
});

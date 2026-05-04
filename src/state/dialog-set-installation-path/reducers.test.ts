/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import {
  DIALOG_SET_INSTALLATION_PATH_CLOSE,
  DIALOG_SET_INSTALLATION_PATH_FORM_UPDATE,
  DIALOG_SET_INSTALLATION_PATH_OPEN,
} from '../../constants/actions';
import reducer from './reducers';

describe('dialog-set-installation-path reducers', () => {
  it('opens with the provided initial form', () => {
    const state = reducer(undefined, {
      type: DIALOG_SET_INSTALLATION_PATH_OPEN,
      initialForm: {
        path: '~/Applications/Chromeless Apps',
      },
    });

    expect(state).toEqual({
      form: {
        path: '~/Applications/Chromeless Apps',
      },
      open: true,
    });
  });

  it('updates the path form and resets it on close', () => {
    let state = reducer(undefined, {
      type: DIALOG_SET_INSTALLATION_PATH_FORM_UPDATE,
      changes: {
        path: '/Applications/Chromeless Apps',
      },
    });

    expect(state.form).toMatchObject({
      path: '/Applications/Chromeless Apps',
    });

    state = reducer(state, { type: DIALOG_SET_INSTALLATION_PATH_CLOSE });

    expect(state).toEqual({
      form: {
        icon: null,
        name: '',
        url: '',
      },
      open: false,
    });
  });
});

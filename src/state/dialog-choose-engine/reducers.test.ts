/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import {
  DIALOG_CHOOSE_ENGINE_CLOSE,
  DIALOG_CHOOSE_ENGINE_FORM_UPDATE,
  DIALOG_CHOOSE_ENGINE_OPEN,
} from '../../constants/actions';
import reducer from './reducers';

describe('dialog-choose-engine reducers', () => {
  it('opens with app metadata while keeping default engine fields', () => {
    const state = reducer(undefined, {
      type: DIALOG_CHOOSE_ENGINE_OPEN,
      form: {
        id: 'mail',
        name: 'Mail',
        url: 'https://mail.example',
      },
    });

    expect(state).toMatchObject({
      form: {
        engine: 'firefox',
        id: 'mail',
        name: 'Mail',
        url: 'https://mail.example',
      },
      open: true,
    });
  });

  it('updates the selected engine and resets the form on close', () => {
    let state = reducer(undefined, {
      type: DIALOG_CHOOSE_ENGINE_FORM_UPDATE,
      changes: {
        engine: 'chrome',
        opts: { tabbed: true },
      },
    });

    expect(state.form).toMatchObject({
      engine: 'chrome',
      opts: { tabbed: true },
    });

    state = reducer(state, { type: DIALOG_CHOOSE_ENGINE_CLOSE });

    expect(state).toMatchObject({
      form: {
        engine: 'firefox',
        id: '',
        name: '',
        opts: null,
        url: '',
      },
      open: false,
    });
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';
import {
  DIALOG_SET_PREFERRED_ENGINE_CLOSE,
  DIALOG_SET_PREFERRED_ENGINE_FORM_UPDATE,
  DIALOG_SET_PREFERRED_ENGINE_OPEN,
} from '../../constants/actions';
import reducer from './reducers';

describe('dialog-set-preferred-engine reducers', () => {
  it('opens with the current preferred engine', () => {
    const state = reducer(undefined, {
      type: DIALOG_SET_PREFERRED_ENGINE_OPEN,
      engine: 'chrome/tabs',
    });

    expect(state).toEqual({
      form: {
        engine: 'chrome/tabs',
      },
      open: true,
    });
  });

  it('updates the selected engine and resets it on close', () => {
    let state = reducer(undefined, {
      type: DIALOG_SET_PREFERRED_ENGINE_FORM_UPDATE,
      changes: {
        engine: 'edge',
      },
    });

    expect(state.form.engine).toBe('edge');

    state = reducer(state, { type: DIALOG_SET_PREFERRED_ENGINE_CLOSE });

    expect(state).toEqual({
      form: {
        engine: 'firefox',
      },
      open: false,
    });
  });
});

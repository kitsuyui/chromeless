/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DIALOG_SET_PREFERRED_ENGINE_CLOSE,
  DIALOG_SET_PREFERRED_ENGINE_FORM_UPDATE,
  DIALOG_SET_PREFERRED_ENGINE_OPEN,
} from '../../constants/actions';
import { close, open, save, updateForm } from './actions';

const { requestSetPreference } = vi.hoisted(() => ({
  requestSetPreference: vi.fn(),
}));

vi.mock('../../senders', () => ({
  requestSetPreference,
}));

describe('dialog-set-preferred-engine actions', () => {
  beforeEach(() => {
    requestSetPreference.mockClear();
  });

  it('creates close and update actions', () => {
    expect(close()).toEqual({
      type: DIALOG_SET_PREFERRED_ENGINE_CLOSE,
    });
    expect(updateForm({ engine: 'chrome' })).toEqual({
      type: DIALOG_SET_PREFERRED_ENGINE_FORM_UPDATE,
      changes: {
        engine: 'chrome',
      },
    });
  });

  it('opens with the current preferred engine', () => {
    const dispatched: object[] = [];

    open()(
      (action: object) => {
        dispatched.push(action);
      },
      () => ({
        preferences: {
          preferredEngine: 'chrome/tabs',
        },
      }),
    );

    expect(dispatched).toEqual([
      {
        type: DIALOG_SET_PREFERRED_ENGINE_OPEN,
        engine: 'chrome/tabs',
      },
    ]);
  });

  it('saves the selected preferred engine and closes the dialog', () => {
    const dispatched: object[] = [];

    save()(
      (action: object) => {
        dispatched.push(action);
      },
      () => ({
        dialogSetPreferredEngine: {
          form: {
            engine: 'edge',
          },
        },
      }),
    );

    expect(requestSetPreference).toHaveBeenCalledWith('preferredEngine', 'edge');
    expect(dispatched).toEqual([
      {
        type: DIALOG_SET_PREFERRED_ENGINE_CLOSE,
      },
    ]);
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { INSTALLING, UNINSTALLING } from '../../constants/app-statuses';
import { getPendingActionState } from './app-card-actions-state';

describe('getPendingActionState', () => {
  it('describes an installable app', () => {
    expect(getPendingActionState({ status: null })).toEqual({
      disabled: false,
      label: 'Install',
      showProgress: false,
    });
  });

  it('uses update copy when an installed version is being replaced', () => {
    expect(
      getPendingActionState({ cancelable: false, status: INSTALLING, version: '1.2.3' }),
    ).toEqual({
      disabled: true,
      label: 'Updating...',
      showProgress: true,
    });
  });

  it('keeps queued operations cancelable in copy but disabled in the primary button', () => {
    expect(getPendingActionState({ cancelable: true, status: INSTALLING })).toEqual({
      disabled: true,
      label: 'Queueing...',
      showProgress: false,
    });
  });

  it('describes uninstall progress', () => {
    expect(getPendingActionState({ status: UNINSTALLING })).toEqual({
      disabled: true,
      label: 'Uninstalling...',
      showProgress: false,
    });
  });
});

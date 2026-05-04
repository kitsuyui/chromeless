/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { INSTALLING, UNINSTALLING } from '../../../constants/app-statuses';

export type AppCardActionState = {
  disabled: boolean;
  label: string;
  showProgress: boolean;
};

type Input = {
  cancelable?: boolean;
  status: string | null;
  version?: string;
};

export const getPendingActionState = ({
  cancelable,
  status,
  version,
}: Input): AppCardActionState => {
  if (status === INSTALLING) {
    if (cancelable) return { disabled: true, label: 'Queueing...', showProgress: false };
    return {
      disabled: true,
      label: version ? 'Updating...' : 'Installing...',
      showProgress: true,
    };
  }

  if (status === UNINSTALLING) {
    return { disabled: true, label: 'Uninstalling...', showProgress: false };
  }

  return { disabled: status !== null, label: 'Install', showProgress: false };
};

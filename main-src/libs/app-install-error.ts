/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { getErrorMessage } from './error-message';

export const getInstallFailureMessage = (error: unknown, appName: string): string => {
  const message = getErrorMessage(error);

  if (message.includes('is not installed')) return message;
  if (message.startsWith('Chromeless is outdated')) return message;

  return `Failed to install ${appName}.`;
};

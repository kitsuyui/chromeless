/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { getErrorMessage } from './error-message';

export const getUpdateFailureMessage = (error: unknown, appName: string): string => {
  const message = getErrorMessage(error);

  if (message.includes('is not installed')) return message;
  if (message.startsWith('EBUSY') || message === 'Application is in use.') {
    return `Failed to update ${appName} as the application is in use.`;
  }
  if (message.startsWith('Chromeless is outdated')) return message;

  return `Failed to update ${appName}.`;
};

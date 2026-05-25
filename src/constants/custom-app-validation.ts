/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const textEncoder = new TextEncoder();

const MAX_MACOS_FILENAME_BYTES = 255;
const APP_BUNDLE_SUFFIX = '.app';

export const MAX_CUSTOM_APP_NAME_BYTES =
  MAX_MACOS_FILENAME_BYTES - textEncoder.encode(APP_BUNDLE_SUFFIX).length;
export const MAX_CUSTOM_APP_URL_LENGTH = 2048;

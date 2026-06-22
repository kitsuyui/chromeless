/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const DEFAULT_TIMEOUT_MS = 30_000;

const customizedFetch = (url: RequestInfo | URL, opts?: RequestInit) => {
  const signal = opts?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  return fetch(url, { ...opts, signal });
};

export default customizedFetch;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const fsExtra = require('fs-extra');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

import customizedFetch from './customized-fetch';

const getNodeReadableStream = (body) => {
  if (typeof body.pipe === 'function') return body;
  return Readable.fromWeb(body);
};

const downloadAsync = (url, dest, fetchOpts) =>
  customizedFetch(url, fetchOpts).then((res) => {
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
    if (!res.body) throw new Error(`Failed to download ${url}: empty response body`);
    return fsExtra
      .ensureFile(dest)
      .then(() => pipeline(getNodeReadableStream(res.body), fsExtra.createWriteStream(dest)));
  });

module.exports = downloadAsync;

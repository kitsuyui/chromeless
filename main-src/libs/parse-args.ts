/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const { parseArgs } = require('util');

const parseStringArgs = (stringArgs) => {
  const options = Object.fromEntries(stringArgs.map((name) => [name, { type: 'string' }]));
  return parseArgs({
    args: process.argv.slice(1),
    allowPositionals: true,
    options,
    strict: false,
  }).values;
};

module.exports = parseStringArgs;

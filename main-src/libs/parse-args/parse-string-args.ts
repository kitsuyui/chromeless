/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { parseArgs } from 'node:util';

const parseStringArgs = (stringArgs: string[]): Record<string, string | undefined> => {
  const options = Object.fromEntries(stringArgs.map((name) => [name, { type: 'string' as const }]));
  return parseArgs({
    args: process.argv.slice(1),
    allowPositionals: true,
    options,
    strict: false,
  }).values as Record<string, string | undefined>;
};

export default parseStringArgs;

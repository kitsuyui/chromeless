/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { type ExecOptions, exec } from 'node:child_process';

// 30 s keeps hung child processes from blocking install indefinitely.
// Callers that need a longer window can pass { timeout: <ms> } explicitly.
const DEFAULT_TIMEOUT_MS = 30_000;

const execAsync = (cmd: string, opts: ExecOptions = {}): Promise<string> =>
  new Promise((resolve, reject) => {
    exec(cmd, { timeout: DEFAULT_TIMEOUT_MS, ...opts }, (e, stdout, stderr) => {
      if (e instanceof Error) {
        reject(e);
        return;
      }
      if (stderr) {
        process.stderr.write(stderr);
      }
      resolve(typeof stdout === 'string' ? stdout : stdout.toString());
    });
  });

export default execAsync;

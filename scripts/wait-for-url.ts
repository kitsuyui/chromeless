#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const url = process.argv[2];
const timeoutMs = Number(process.env.WAIT_FOR_URL_TIMEOUT_MS || 30000);
const intervalMs = Number(process.env.WAIT_FOR_URL_INTERVAL_MS || 250);
const startedAt = Date.now();

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const waitForUrlAsync = async () => {
  if (!url) throw new Error('Usage: wait-for-url.ts <url>');

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_e) {
      // Keep polling until the dev server starts accepting connections.
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for ${url}`);
};

waitForUrlAsync().catch((e) => {
  console.error(e.message); // eslint-disable-line no-console
  process.exit(1);
});

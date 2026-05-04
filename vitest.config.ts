/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'clover'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}', 'main-src/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', 'src/types/**'],
    },
    include: ['src/**/*.test.{ts,tsx}', 'main-src/**/*.test.ts'],
  },
});

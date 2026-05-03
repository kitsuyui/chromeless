/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'build',
    assetsDir: 'static',
    emptyOutDir: true,
    target: 'es2022',
  },
  optimizeDeps: {
    include: ['lodash', 'react-redux', 'semver', 'use-sync-external-store/with-selector'],
  },
});

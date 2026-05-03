/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { defineConfig, transformWithOxc } from 'vite';

const jsAsJsxPlugin = {
  name: 'js-as-jsx',
  async transform(code, id) {
    if (!id.includes('/src/') || !id.endsWith('.js')) return null;
    return transformWithOxc(code, id, {
      lang: 'jsx',
    });
  },
};

export default defineConfig({
  base: './',
  plugins: [jsAsJsxPlugin],
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
    rolldownOptions: {
      moduleTypes: {
        '.js': 'jsx',
      },
    },
    include: ['lodash', 'react-redux', 'semver', 'use-sync-external-store/with-selector'],
  },
});

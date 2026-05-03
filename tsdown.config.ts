/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const path = require('path');
const { defineConfig } = require('tsdown');

const entry = {
  electron: path.join(__dirname, 'main-src', 'electron.ts'),
  'install-app-forked-lite-v2': path.join(__dirname, 'main-src', 'libs', 'app-management', 'install-app-async', 'install-app-forked-lite-v2.ts'),
  'install-app-forked-webkit': path.join(__dirname, 'main-src', 'libs', 'app-management', 'install-app-async', 'install-app-forked-webkit.ts'),
  'prepare-webkit-wrapper-forked': path.join(__dirname, 'main-src', 'libs', 'app-management', 'prepare-webkit-wrapper-async', 'prepare-webkit-wrapper-forked.ts'),
  'uninstall-app-forked': path.join(__dirname, 'main-src', 'libs', 'app-management', 'uninstall-app-async', 'uninstall-app-forked.ts'),
  'preload-main': path.join(__dirname, 'main-src', 'libs', 'windows', 'preload-main.ts'),
  'preload-menubar': path.join(__dirname, 'main-src', 'libs', 'windows', 'preload-menubar.ts'),
};

module.exports = defineConfig({
  entry,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  outExtensions: () => ({
    js: '.js',
  }),
  outDir: 'build',
  clean: ['build/*.js', 'build/*.js.map', 'build/images'],
  sourcemap: true,
  deps: {
    neverBundle: ['electron'],
  },
  copy: [
    {
      from: path.join(__dirname, 'main-src', 'images'),
      to: path.join(__dirname, 'build', 'images'),
    },
  ],
  checks: {
    legacyCjs: false,
  },
});

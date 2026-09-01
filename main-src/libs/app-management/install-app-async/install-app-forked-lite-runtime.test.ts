/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import {
  buildInstallRuntime,
  isStandardInstallationPath,
  resolveRequireAdmin,
} from './install-app-forked-lite-runtime';

describe('install app forked lite runtime', () => {
  it('treats the bundled app directories as standard installation targets', () => {
    expect(isStandardInstallationPath('~/Applications/Chromeless Apps')).toBe(true);
    expect(isStandardInstallationPath('/Applications/Chromeless Apps')).toBe(true);
    expect(isStandardInstallationPath('/Applications/Custom Apps')).toBe(false);
  });

  it('forces standard installation targets to skip admin escalation', () => {
    expect(resolveRequireAdmin('~/Applications/Chromeless Apps', 'true')).toBe('false');
    expect(resolveRequireAdmin('/Applications/Custom Apps', 'true')).toBe('true');
  });

  it('builds Firefox runtime settings for site-specific apps', () => {
    expect(
      buildInstallRuntime({
        engine: 'firefox',
        homePath: '/Users/example',
        id: 'mail',
        installationPath: '~/Applications/Chromeless Apps',
        name: 'Mail',
        requireAdmin: 'true',
        url: 'https://mail.example',
      }),
    ).toEqual({
      allAppsPath: '/Users/example/Applications/Chromeless Apps',
      appFolderName: 'mail.app',
      browserId: 'firefox',
      finalPath: '/Users/example/Applications/Chromeless Apps/mail.app',
      firefoxProfileId: 'chromeless-mail',
      iconFileName: 'firefox.icns',
      requireAdmin: 'false',
      useTabs: false,
    });
  });

  it('builds Chromium runtime settings for browser instances and tabbed engines', () => {
    expect(
      buildInstallRuntime({
        engine: 'chrome/tabs',
        homePath: '/Users/example',
        id: 'docs',
        installationPath: '/Applications/Custom Apps',
        name: 'Docs',
        requireAdmin: 'true',
        url: null,
      }),
    ).toEqual({
      allAppsPath: '/Applications/Custom Apps',
      appFolderName: 'docs.app',
      browserId: 'chrome',
      finalPath: '/Applications/Custom Apps/docs.app',
      firefoxProfileId: 'chromeless-docs',
      iconFileName: 'app.icns',
      requireAdmin: 'true',
      useTabs: true,
    });
  });
});

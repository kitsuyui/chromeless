/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { describe, expect, it } from 'vitest';

import { getExecFileContent, obj2Strings, strings2Obj } from './install-app-forked-lite-helpers';

describe('install app forked lite helpers', () => {
  it('parses InfoPlist.strings entries with escaped quotes', () => {
    const parsed = strings2Obj('CFBundleDisplayName = "Mail \\"Lite\\"";\n');

    expect(parsed).toEqual({
      CFBundleDisplayName: 'Mail "Lite"',
    });
  });

  it('serializes InfoPlist.strings entries with comments and escapes', () => {
    const serialized = obj2Strings({
      CFBundleDisplayName: {
        comment: 'localized display name',
        value: 'Mail "Lite"',
      },
      CFBundleName: 'Mail',
    });

    expect(serialized).toBe(
      '/*localized display name*/\nCFBundleDisplayName = "Mail \\"Lite\\"";\nCFBundleName = "Mail";\n',
    );
    expect(strings2Obj(serialized, true)).toEqual({
      CFBundleDisplayName: {
        comment: 'localized display name',
        value: 'Mail "Lite"',
      },
      CFBundleName: {
        comment: '',
        value: 'Mail',
      },
    });
  });

  it('builds the Firefox exec script for site-specific mode', () => {
    const script = getExecFileContent({
      appFolderName: 'Mail.app',
      browserId: 'firefox',
      engineExecFile: 'firefox',
      engineUserDataDir: 'Firefox',
      firefoxProfileId: 'chromeless-mail',
      id: 'mail',
      url: 'https://mail.example',
      useTabs: false,
    });

    expect(script).toContain(
      "open -n \"$PWD\"/'Mail.app' --args --ssb='https://mail.example' -P 'chromeless-mail'",
    );
    expect(script).toContain(
      'cp "$PWD"/icon.icns "$PWD"/\'Mail.app\'/Contents/Resources/firefox.icns',
    );
  });

  it('builds the Chromium exec script for tabbed mode', () => {
    const script = getExecFileContent({
      appFolderName: 'Mail.app',
      browserId: 'chrome',
      engineExecFile: 'Google Chrome',
      engineUserDataDir: 'Google/Chrome',
      firefoxProfileId: 'ignored',
      id: 'mail',
      url: 'https://mail.example',
      useTabs: true,
    });

    expect(script).toContain("Tabs='https://mail.example'");
    expect(script).toContain(
      "pgrepResult=$(pgrep -f \"$PWD\"/'Mail.app'/Contents/MacOS/'Google Chrome')",
    );
    expect(script).toContain(
      `--user-data-dir="$HOME"/Library/Application\\ Support/Chromeless/ChromiumProfiles/'mail'`,
    );
  });

  it('builds the Chromium exec script for app mode', () => {
    const script = getExecFileContent({
      appFolderName: 'Mail.app',
      browserId: 'chrome',
      engineExecFile: 'Google Chrome',
      engineUserDataDir: 'Google/Chrome',
      firefoxProfileId: 'ignored',
      id: 'mail',
      url: 'https://mail.example',
      useTabs: false,
    });

    expect(script).toContain("--app='https://mail.example'");
    expect(script).toContain('[ $numProc -ge 2 -a $# -eq 0 ]');
    expect(script).not.toContain('Tabs=');
  });
});

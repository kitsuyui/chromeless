/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { quoteShellArg } from '../../shell-quote';

const unescapeString = (str: string) => str.replace(/\\"/gim, '"');

const escapeString = (str: string) => str.replace(/"/gim, '\\"');

export type StringsFileValue =
  | string
  | {
      comment: string;
      value: string;
    };

export const strings2Obj = (
  data: string,
  wantComments = false,
): Record<string, StringsFileValue> => {
  let normalizedData = data;
  if (normalizedData.indexOf('\n') === -1) {
    normalizedData += '\n';
  }
  const re = /(?:\/\*(.+)\*\/\n)?(.+)\s*=\s*"(.+)";\n/gim;
  const res: Record<string, StringsFileValue> = {};
  let m = re.exec(normalizedData);
  while (m !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex += 1;
    }
    if (m[2].substring(0, 1) === '"') {
      m[2] = m[2].trim().slice(1, -1);
    }
    m[2] = m[2].trim();
    if (wantComments) {
      res[m[2]] = {
        value: unescapeString(m[3]),
        comment: m[1] || '',
      };
    } else {
      res[m[2]] = unescapeString(m[3]);
    }
    m = re.exec(normalizedData);
  }
  return res;
};

/* eslint-disable prefer-template */
export const obj2Strings = (obj: Record<string, StringsFileValue>) => {
  let data = '';
  Object.keys(obj).forEach((i) => {
    if (typeof obj[i] === 'object') {
      if (obj[i].comment && obj[i].comment.length > 0) {
        data += '/*' + obj[i].comment + '*/\n';
      }
      data += i + ' = "' + escapeString(obj[i].value) + '";\n';
    } else if (typeof obj[i] === 'string') {
      data += i + ' = "' + escapeString(obj[i]) + '";\n';
    }
  });
  return data;
};
/* eslint-enable prefer-template */

type ExecFileContentInput = {
  appFolderName: string;
  browserId: string;
  engineExecFile: string;
  engineUserDataDir: string;
  firefoxProfileId: string;
  id: string;
  url: string | null;
  useTabs: boolean;
};

const getAppBundleShellPath = (appFolderName: string, basePathExpression: string) =>
  `${basePathExpression}/${quoteShellArg(appFolderName)}`;

const getChromiumProfileShellPath = (profileId: string) =>
  `"$HOME"/Library/Application\\ Support/Chromeless/ChromiumProfiles/${quoteShellArg(profileId)}`;

const getNativeMessagingHostsShellPath = (engineUserDataDir: string) =>
  `~/Library/Application\\ Support/${quoteShellArg(engineUserDataDir)}/NativeMessagingHosts`;

const getEngineExecShellPath = (appFolderName: string, engineExecFile: string) =>
  `${getAppBundleShellPath(appFolderName, '"$PWD"')}/Contents/MacOS/${quoteShellArg(engineExecFile)}`;

const getFirefoxUrlParam = (url: string | null, useTabs: boolean) => {
  if (!url) return '';
  return useTabs ? quoteShellArg(url) : `--ssb=${quoteShellArg(url)}`;
};

const getFirefoxExecFileContent = ({
  appFolderName,
  firefoxProfileId,
  url,
  useTabs,
}: ExecFileContentInput) => `#!/bin/sh
DIR=$(dirname "$0");
cd "$DIR";
cd ..;
cd Resources;

cp "$PWD"/icon.icns ${getAppBundleShellPath(appFolderName, '"$PWD"')}/Contents/Resources/firefox.icns

open -n ${getAppBundleShellPath(appFolderName, '"$PWD"')} --args ${getFirefoxUrlParam(url, useTabs)} -P ${quoteShellArg(firefoxProfileId)}
`;

const getChromiumTabbedExecFileContent = ({
  appFolderName,
  engineExecFile,
  engineUserDataDir,
  id,
  url,
}: ExecFileContentInput) => `#!/bin/sh
DIR=$(dirname "$0");
cd "$DIR";
cd ..;
cd Resources;

cp -rf ${getNativeMessagingHostsShellPath(engineUserDataDir)} ${getChromiumProfileShellPath(id)}/NativeMessagingHosts

pgrepResult=$(pgrep -f ${getAppBundleShellPath(appFolderName, '"$DIR"')})
numProc=$(echo "$pgrepResult" | wc -l)
if [ $numProc -ge 2 ]
  then
  exit;
fi
pgrepResult=$(pgrep -f ${getEngineExecShellPath(appFolderName, engineExecFile)})
if [ -n "$pgrepResult" -a $# -eq 0 ]; then
  exit
fi

sed -i '' "s/\\"has_seen_welcome_page\\":false/\\"has_seen_welcome_page\\":true/g" "$HOME/Library/Application Support/Chromeless/ChromiumProfiles/${id}/Default/Preferences"
if (grep -q "\\"restore_on_startup\\":1" "$HOME/Library/Application Support/Chromeless/ChromiumProfiles/${id}/Default/Secure Preferences") && [ -e "$HOME/Library/Application Support/Chromeless/ChromiumProfiles/${id}/Default/Current Tabs" ]; then
  Tabs=""
else
  Tabs=${quoteShellArg(url || '')}
fi

open -n ${getAppBundleShellPath(appFolderName, '"$PWD"')} --args $Tabs --no-sandbox --test-type --user-data-dir=${getChromiumProfileShellPath(id)} --load-extension="$PWD"/chromeless-helper "$@"
`;

const getChromiumAppExecFileContent = ({
  appFolderName,
  engineExecFile,
  engineUserDataDir,
  id,
  url,
}: ExecFileContentInput) => `#!/bin/sh
DIR=$(dirname "$0");
cd "$DIR";
cd ..;
cd Resources;

cp -rf ${getNativeMessagingHostsShellPath(engineUserDataDir)} ${getChromiumProfileShellPath(id)}/NativeMessagingHosts

pgrepResult=$(pgrep -f ${getAppBundleShellPath(appFolderName, '"$DIR"')})
numProc=$(echo "$pgrepResult" | wc -l)
if [ $numProc -ge 2 -a $# -eq 0 ]
  then
  exit;
fi
pgrepResult=$(pgrep -f ${getEngineExecShellPath(appFolderName, engineExecFile)})
if [ -n "$pgrepResult" ]; then
  exit
fi

open -n ${getAppBundleShellPath(appFolderName, '"$PWD"')} --args --no-sandbox --test-type --app=${quoteShellArg(url)} --user-data-dir=${getChromiumProfileShellPath(id)} --load-extension="$PWD"/chromeless-helper "$@"
`;

export const getExecFileContent = (input: ExecFileContentInput) => {
  if (input.browserId === 'firefox') return getFirefoxExecFileContent(input);
  if (input.useTabs) return getChromiumTabbedExecFileContent(input);
  return getChromiumAppExecFileContent(input);
};

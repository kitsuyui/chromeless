/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import parseArgs from '../../parse-args';
import { quoteShellArg } from '../../shell-quote';

// set this event as soon as possible in the process
process.on('uncaughtException', (e) => {
  process.send({
    error: {
      name: e.name,
      message: e.message,
      stack: e.stack,
    },
  });
  process.exit(1);
});

const icongen = require('icon-gen');
const Jimp = process.env.NODE_ENV === 'production' ? require('jimp').default : require('jimp');
const fs = require('fs');
const os = require('os');
const path = require('path');
const fsExtra = require('fs-extra');
const sudo = require('sudo-prompt');

const execAsync = require('../../exec-async');
const downloadAsync = require('../../download-async');
const getEngineInfo = require('./get-engine-info');
const getEngineAppPath = require('./get-engine-app-path');
const packageJson = require('../../../../package.json');

const argv = parseArgs([
  'engine',
  'id',
  'name',
  'url',
  'icon',
  'opts',
  'helperPath',
  'homePath',
  'appDataPath',
  'installationPath',
  'requireAdmin',
  'username',
  'cacheRoot',
  'browserPath',
]);
const { engine, id, name, url, icon, helperPath, homePath, installationPath, username } = argv;
const opts = JSON.parse(argv.opts);

// ignore requireAdmin if installationPath is not custom
const isStandardInstallationPath =
  installationPath === '~/Applications/Chromeless Apps' ||
  installationPath === '/Applications/Chromeless Apps';
const requireAdmin = isStandardInstallationPath ? false : argv.requireAdmin;

const unescapeString = (str) => str.replace(/\\"/gim, '"');

const escapeString = (str) => str.replace(/"/gim, '\\"');

const isUrl = (value) => URL.canParse(value);

type StringsFileValue =
  | string
  | {
      comment: string;
      value: string;
    };

// https://github.com/iteufel/node-strings-file/blob/master/index.js
const strings2Obj = (data, wantComments = false): Record<string, StringsFileValue> => {
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

// https://github.com/iteufel/node-strings-file/blob/master/index.js
/* eslint-disable prefer-template */
const obj2Strings = (obj) => {
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

const sudoAsync = (prompt) =>
  new Promise((resolve, reject) => {
    const sudoOpts = {
      name: 'Chromeless',
    };
    process.env.USER = username;
    sudo.exec(prompt, sudoOpts, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      return resolve(stdout);
    });
  });

const getAppFolderName = () => `${name}.app`;

const tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'chromeless-'));
const appFolderPath = path.join(tmpPath, getAppFolderName());
// Mock Electron for backward compatibility
const contentsPath = path.join(appFolderPath, 'Contents');
const resourcesPath = path.join(contentsPath, 'Resources');
const appAsarUnpackedPath = path.join(resourcesPath, 'app.asar.unpacked');
const packageJsonPath = path.join(appAsarUnpackedPath, 'package.json');
const appJsonPath = path.join(appAsarUnpackedPath, 'build', 'app.json');
const publicIconIcnsPath = path.join(resourcesPath, 'icon.icns');
const publicIconPngPath = path.join(appAsarUnpackedPath, 'build', 'icon.png');

const buildResourcesPath = path.join(tmpPath, 'build-resources');
const iconIcnsPath = path.join(buildResourcesPath, 'e.icns');
const iconPngPath = path.join(buildResourcesPath, 'e.png');

const allAppsPath = installationPath.replace('~', homePath);
const finalPath = path.join(allAppsPath, `${name}.app`);

const helperDestPath = path.join(resourcesPath, 'chromeless-helper');

const browserId = engine.split('/')[0];
const useTabs = !url || engine.endsWith('/tabs'); // if no url is defined (multisite) then always use tabs option
const firefoxProfileId = `chromeless-${id}`;

const engineInfo = getEngineInfo(engine);

const getAppBundleShellPath = (basePathExpression) =>
  `${basePathExpression}/${quoteShellArg(getAppFolderName())}`;

const getChromiumProfileShellPath = (profileId) =>
  `"$HOME"/Library/Application\\ Support/Chromeless/ChromiumProfiles/${quoteShellArg(profileId)}`;

const getNativeMessagingHostsShellPath = () =>
  `~/Library/Application\\ Support/${quoteShellArg(engineInfo.userDataDir)}/NativeMessagingHosts`;

const getEngineExecShellPath = () =>
  `${getAppBundleShellPath('"$PWD"')}/Contents/MacOS/${quoteShellArg(engineInfo.execFile)}`;

const getFirefoxUrlParam = () => {
  if (!url) return '';
  return useTabs ? quoteShellArg(url) : `--ssb=${quoteShellArg(url)}`;
};

const getFirefoxExecFileContent = () => `#!/bin/sh
DIR=$(dirname "$0");
cd "$DIR";
cd ..;
cd Resources;

cp "$PWD"/icon.icns ${getAppBundleShellPath('"$PWD"')}/Contents/Resources/firefox.icns

open -n ${getAppBundleShellPath('"$PWD"')} --args ${getFirefoxUrlParam()} -P ${quoteShellArg(firefoxProfileId)}
`;

const getChromiumTabbedExecFileContent = () => `#!/bin/sh
DIR=$(dirname "$0");
cd "$DIR";
cd ..;
cd Resources;

cp -rf ${getNativeMessagingHostsShellPath()} ${getChromiumProfileShellPath(id)}/NativeMessagingHosts

pgrepResult=$(pgrep -f ${getAppBundleShellPath('"$DIR"')})
numProc=$(echo "$pgrepResult" | wc -l)
if [ $numProc -ge 2 ]
  then
  exit;
fi
pgrepResult=$(pgrep -f ${getEngineExecShellPath()})
if [ -n "$pgrepResult" -a $# -eq 0 ]; then
  exit
fi

sed -i '' "s/\\"has_seen_welcome_page\\":false/\\"has_seen_welcome_page\\":true/g" "$HOME/Library/Application Support/Chromeless/ChromiumProfiles/adobe-color/Default/Preferences"
if (grep -q "\\"restore_on_startup\\":1" "$HOME/Library/Application Support/Chromeless/ChromiumProfiles/adobe-color/Default/Secure Preferences") && [ -e "$HOME/Library/Application Support/Chromeless/ChromiumProfiles/adobe-color/Default/Current Tabs" ]; then
  Tabs=""
else
  Tabs=${quoteShellArg(url || '')}
fi

open -n ${getAppBundleShellPath('"$PWD"')} --args $Tabs --no-sandbox --test-type --user-data-dir=${getChromiumProfileShellPath(id)} --load-extension="$PWD"/chromeless-helper "$@"
`;

const getChromiumAppExecFileContent = () => `#!/bin/sh
DIR=$(dirname "$0");
cd "$DIR";
cd ..;
cd Resources;

cp -rf ${getNativeMessagingHostsShellPath()} ${getChromiumProfileShellPath(id)}/NativeMessagingHosts

pgrepResult=$(pgrep -f ${getAppBundleShellPath('"$DIR"')})
numProc=$(echo "$pgrepResult" | wc -l)
if [ $numProc -ge 2 -a $# -eq 0 ]
  then
  exit;
fi
pgrepResult=$(pgrep -f ${getEngineExecShellPath()})
if [ -n "$pgrepResult" ]; then
  exit
fi

open -n ${getAppBundleShellPath('"$PWD"')} --args --no-sandbox --test-type --app=${quoteShellArg(url)} --user-data-dir=${getChromiumProfileShellPath(id)} --load-extension="$PWD"/chromeless-helper "$@"
`;

const getExecFileContent = () => {
  if (browserId === 'firefox') return getFirefoxExecFileContent();
  if (useTabs) return getChromiumTabbedExecFileContent();
  return getChromiumAppExecFileContent();
};

Promise.resolve()
  .then(() => {
    if (!engineInfo) {
      return Promise.reject(new Error('Engine is not supported.'));
    }
    return null;
  })
  .then(() => {
    process.send({
      progress: {
        percent: 5, // estimated
        desc: 'Installing...',
      },
    });

    if (isUrl(icon)) {
      return downloadAsync(icon, iconPngPath);
    }

    return fsExtra.copy(icon, iconPngPath);
  })
  .then(() => Jimp.read(iconPngPath))
  .then((img) => {
    const sizes = [16, 32, 64, 128, 256, 512, 1024];

    const p = sizes.map((size) =>
      img
        .clone()
        .resize(size, size)
        .quality(100)
        .writeAsync(path.join(buildResourcesPath, `${size}.png`)),
    );

    return Promise.all(p).then(() =>
      icongen(buildResourcesPath, buildResourcesPath, {
        report: true,
        icns: {
          name: 'e',
          sizes,
        },
      }),
    );
  })
  .then(() => {
    process.send({
      progress: {
        percent: 40, // estimated
        desc: 'Installing...',
      },
    });

    return Promise.resolve()
      .then(() => fsExtra.ensureDir(appAsarUnpackedPath))
      .then(() => fsExtra.copy(iconPngPath, publicIconPngPath))
      .then(() => fsExtra.copy(iconIcnsPath, publicIconIcnsPath))
      .then(() => fsExtra.copy(helperPath, helperDestPath))
      .then(() => {
        const execFilePath = path.join(contentsPath, 'MacOS', 'chromeless_root_app');
        return fsExtra
          .outputFile(execFilePath, getExecFileContent())
          .then(() => fsExtra.chmod(execFilePath, '755'));
      })
      .then(() => {
        const infoPlistPath = path.join(contentsPath, 'Info.plist');
        const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
<key>CFBundleExecutable</key>
<string>chromeless_root_app</string>
<key>CFBundleIconFile</key>
<string>icon.icns</string>
<key>CFBundleIdentifier</key>
<string>com.chromeless.${engine}.${id}</string>
<key>LSUIElement</key>
<true/>
</dict>
</plist>
`;
        return fsExtra.outputFile(infoPlistPath, infoPlistContent);
      })
      .then(() => {
        // init profile
        // hard code instead of relying on Electron app.getPath('userData')
        // as it is also hard coded in the exec bash script
        if (browserId !== 'firefox') {
          const profilePath = path.join(
            homePath,
            'Library',
            'Application Support',
            'Chromeless',
            'ChromiumProfiles',
            id,
          );

          // move data from v1
          const legacyProfilePath = path.join(homePath, '.chromeless', 'chromium-data', id);
          if (fsExtra.existsSync(legacyProfilePath)) {
            fsExtra.moveSync(legacyProfilePath, profilePath, { overwrite: true });
          }

          // (redundant as ensureFileSync would ensureDir too
          fsExtra.ensureDirSync(profilePath);

          // add empty "First Run" file so default browser prompt doesn't show up
          fsExtra.ensureFileSync(path.join(profilePath, 'First Run'));

          // this file is needed
          // if not, Chromium will crash on first launch
          // details: https://github.com/webcatalog/chromeless/issues/4#issuecomment-805901787
          fsExtra.writeFileSync(
            path.join(profilePath, 'Local State'),
            '{"profile":{"info_cache":{}}}',
          );
        }
      })
      .then(() => {
        const browserPath = getEngineAppPath(engine, homePath);

        // for Firefox
        // duplicate the whole app
        if (browserId === 'firefox') {
          const clonedBrowserPath = path.join(resourcesPath, `${name}.app`);
          return (
            fsExtra
              .copy(browserPath, clonedBrowserPath)
              // create Firefox profile for the app
              .then(() => {
                // https://developer.mozilla.org/en-US/docs/Mozilla/Command_Line_Options
                const execPath = path.join(browserPath, 'Contents', 'MacOS', 'firefox');
                return execAsync(
                  `${quoteShellArg(execPath)} -CreateProfile ${quoteShellArg(firefoxProfileId)}`,
                );
              })
              // enable flag for ssb (site-specific-browser) (Firefox experimental feature)
              .then(() => {
                const profilesPath = path.join(
                  homePath,
                  'Library',
                  'Application Support',
                  'Firefox',
                  'Profiles',
                );
                const profileFullId = fsExtra
                  .readdirSync(profilesPath)
                  .find((itemName) => itemName.endsWith(firefoxProfileId));
                const profilePath = path.join(profilesPath, profileFullId);
                // https://developer.mozilla.org/en-US/docs/Mozilla/Preferences/A_brief_guide_to_Mozilla_preferences
                // http://kb.mozillazine.org/User.js_file
                const userJsPath = path.join(profilePath, 'user.js');
                return fsExtra.writeFile(userJsPath, 'user_pref("browser.ssb.enabled", true);');
              })
          );
        }

        // init cloned Chromium app
        const clonedBrowserPath = path.join(resourcesPath, `${name}.app`);
        const clonedBrowserContentsPath = path.join(clonedBrowserPath, 'Contents');
        const browserContentsPath = path.join(browserPath, 'Contents');

        const p = [];

        // resources dir
        // overwrite app name
        const iconFileName = browserId === 'firefox' ? 'firefox.icns' : 'app.icns';
        fsExtra.readdirSync(path.join(browserContentsPath, 'Resources')).forEach((itemName) => {
          if (itemName.endsWith('.lproj')) {
            const stringsContent = fsExtra.readFileSync(
              path.join(browserContentsPath, 'Resources', itemName, 'InfoPlist.strings'),
              'utf8',
            );
            const strings = strings2Obj(stringsContent);

            // overwrite values
            strings.CFBundleName = name;
            strings.CFBundleDisplayName = name;
            strings.CFBundleGetInfoString =
              'The app is created with Chromeless. Copyright © Google LLC. All rights reserved.';

            const clonedStringsPath = path.join(
              clonedBrowserContentsPath,
              'Resources',
              itemName,
              'InfoPlist.strings',
            );
            fsExtra.ensureFileSync(clonedStringsPath);
            fsExtra.writeFileSync(
              clonedStringsPath,
              obj2Strings(strings),
              { encoding: 'utf16le' }, // Google use UTF-8, but Apple recommends using UTF-16
            );
          } else if (itemName !== iconFileName) {
            p.push(
              fsExtra.ensureSymlink(
                path.join(browserContentsPath, 'Resources', itemName),
                path.join(clonedBrowserContentsPath, 'Resources', itemName),
              ),
            );
          }
        });
        // overwrite icon
        p.push(
          fsExtra.copy(
            iconIcnsPath,
            path.join(clonedBrowserContentsPath, 'Resources', iconFileName),
          ),
        );

        // symlinks for other files & dirs
        fsExtra.readdirSync(browserContentsPath, { withFileTypes: true }).forEach((item) => {
          if (item.name !== 'Resources') {
            // symlink one more level deeper
            if (item.isDirectory()) {
              fsExtra
                .readdirSync(path.join(browserContentsPath, item.name))
                .forEach((subItemName) => {
                  p.push(
                    fsExtra.ensureSymlink(
                      path.join(browserContentsPath, item.name, subItemName),
                      path.join(clonedBrowserContentsPath, item.name, subItemName),
                    ),
                  );
                });
            } else {
              p.push(
                fsExtra.ensureSymlink(
                  path.join(browserContentsPath, item.name),
                  path.join(clonedBrowserContentsPath, item.name),
                ),
              );
            }
          }
        });

        return Promise.all(p);
      });
  })
  .then(() => {
    const packageJsonContent = JSON.stringify({
      version: packageJson.scriptVersion,
    });
    return fsExtra.writeFileSync(packageJsonPath, packageJsonContent);
  })
  .then(() => {
    const appJson = JSON.stringify({
      id,
      name,
      url,
      engine,
      opts,
    });
    return fsExtra.writeFileSync(appJsonPath, appJson);
  })
  .then(async () => {
    if (requireAdmin === 'true') {
      return sudoAsync(
        `mkdir -p ${quoteShellArg(allAppsPath)} && rm -rf ${quoteShellArg(finalPath)} && mv ${quoteShellArg(appFolderPath)} ${quoteShellArg(finalPath)}`,
      );
    }
    // in v20.5.2 and below, '/Applications/Chromeless Apps' owner is set to `root`
    // need to correct to user to install apps without sudo
    if (installationPath === '/Applications/Chromeless Apps') {
      fsExtra.ensureDirSync(installationPath);
      // https://unix.stackexchange.com/a/7732
      const installationPathOwner = await execAsync(
        "ls -ld '/Applications/Chromeless Apps' | awk '{print $3}'",
      );
      if (installationPathOwner.trim() === 'root') {
        // https://askubuntu.com/questions/6723/change-folder-permissions-and-ownership
        // https://stackoverflow.com/questions/23714097/sudo-chown-command-not-found
        await sudoAsync(
          `/usr/sbin/chown -R ${quoteShellArg(username)} '/Applications/Chromeless Apps'`,
        );
      }
    }
    return fsExtra.move(appFolderPath, finalPath, { overwrite: true });
  })
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    process.send({
      error: {
        name: e.name,
        message: e.message,
        stack: e.stack,
      },
    });
    process.exit(1);
  });

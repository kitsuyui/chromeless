/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import execAsync from '../../exec-async';
import parseArgs from '../../parse-args';
import { quoteShellArg } from '../../shell-quote';
import { getExecFileContent, obj2Strings, strings2Obj } from './install-app-forked-lite-helpers';
import { buildInstallRuntime } from './install-app-forked-lite-runtime';

// set this event as soon as possible in the process
process.on('uncaughtException', (e) => {
  process.send({
    error: {
      name: e.name,
      message: e.message,
      stack: e.stack,
    },
  });
  void removeTmpPath().then(() => {
    process.exit(1);
  });
});

const icongen = require('icon-gen');
const Jimp = process.env.NODE_ENV === 'production' ? require('jimp').default : require('jimp');
const fs = require('fs');
const os = require('os');
const path = require('path');
const fsExtra = require('fs-extra');
const sudo = require('@vscode/sudo-prompt');

const downloadAsync = require('../../network/download-async');
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
const runtime = buildInstallRuntime({
  engine,
  homePath,
  id,
  installationPath,
  name,
  requireAdmin: argv.requireAdmin,
  url,
});
const {
  allAppsPath,
  appFolderName,
  browserId,
  finalPath,
  firefoxProfileId,
  iconFileName,
  requireAdmin,
  useTabs,
} = runtime;

const isUrl = (value) => URL.canParse(value);

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

const getCleanupErrorMessage = (cleanupError) =>
  cleanupError instanceof Error ? cleanupError.stack || cleanupError.message : String(cleanupError);

let tmpPathCleaned = false;
const removeTmpPath = () => {
  if (tmpPathCleaned) {
    return Promise.resolve();
  }
  tmpPathCleaned = true;
  return fsExtra.remove(tmpPath).catch((cleanupError) => {
    process.stderr.write(
      `Failed to remove temporary install directory ${tmpPath}: ${getCleanupErrorMessage(cleanupError)}\n`,
    );
  });
};

const cleanupAndExit = (code) => {
  void removeTmpPath().then(() => {
    process.exit(code);
  });
};

process.on('SIGTERM', () => {
  cleanupAndExit(1);
});

process.on('SIGINT', () => {
  cleanupAndExit(1);
});

process.on('exit', () => {
  if (tmpPathCleaned) return;
  try {
    fs.rmSync(tmpPath, { force: true, recursive: true });
    tmpPathCleaned = true;
  } catch (cleanupError) {
    process.stderr.write(
      `Failed to synchronously remove temporary install directory ${tmpPath}: ${getCleanupErrorMessage(cleanupError)}\n`,
    );
  }
});

const helperDestPath = path.join(resourcesPath, 'chromeless-helper');

const engineInfo = getEngineInfo(engine);

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
          .outputFile(
            execFilePath,
            getExecFileContent({
              appFolderName,
              browserId,
              engineExecFile: engineInfo.execFile,
              engineUserDataDir: engineInfo.userDataDir,
              firefoxProfileId,
              id,
              url,
              useTabs,
            }),
          )
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
          // Write to a temp file then rename to avoid partial-write corruption
          // if the process is killed mid-write.
          const localStatePath = path.join(profilePath, 'Local State');
          const localStateTmpPath = `${localStatePath}.tmp`;
          fsExtra.writeFileSync(localStateTmpPath, '{"profile":{"info_cache":{}}}');
          fsExtra.moveSync(localStateTmpPath, localStatePath, { overwrite: true });
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
                if (profileFullId === undefined) {
                  throw new Error(
                    `Firefox profile directory not found for profile ID: ${firefoxProfileId}`,
                  );
                }
                const profilePath = path.join(profilesPath, profileFullId);
                // https://developer.mozilla.org/en-US/docs/Mozilla/Preferences/A_brief_guide_to_Mozilla_preferences
                // http://kb.mozillazine.org/User.js_file
                const userJsPath = path.join(profilePath, 'user.js');
                const userJsTmpPath = `${userJsPath}.tmp`;
                return fsExtra
                  .writeFile(userJsTmpPath, 'user_pref("browser.ssb.enabled", true);')
                  .then(() => fsExtra.move(userJsTmpPath, userJsPath, { overwrite: true }));
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
  .then(() => removeTmpPath())
  .then(() => {
    process.exit(0);
  })
  .catch((e) =>
    removeTmpPath().then(() => {
      process.send({
        error: {
          name: e.name,
          message: e.message,
          stack: e.stack,
        },
      });
      process.exit(1);
    }),
  );

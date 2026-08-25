/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import parseArgs from '../../parse-args';
import { quoteShellArg } from '../../shell-quote';
import { createTmpFileCleaner } from './uninstall-app-forked-bootstrap';

const path = require('path');
const fsExtra = require('fs-extra');
const sudo = require('@vscode/sudo-prompt');
const { exec } = require('child_process');
const os = require('os');

const tmpFileCleaner = createTmpFileCleaner({
  removeSync: (tmpPath) => fsExtra.removeSync(tmpPath),
  writeStderr: (message) => {
    process.stderr.write(message);
  },
});

// set this event as soon as possible in the process
process.on('uncaughtException', (e) => {
  process.send({
    error: {
      name: e.name,
      message: e.message,
      stack: e.stack,
    },
  });
  tmpFileCleaner.removeTmpFilePath();
  process.exit(1);
});

// Mirrors install-app-forked-lite.ts: without these handlers the process exits
// via Node's default signal behavior, skipping the tmp file cleanup below and
// giving the parent (uninstall-app-async/index.ts) no `err` to report, so it
// falls back to a generic "Forked script failed to run correctly." message.
process.on('SIGTERM', () => {
  tmpFileCleaner.removeTmpFilePath();
  process.exit(1);
});

process.on('SIGINT', () => {
  tmpFileCleaner.removeTmpFilePath();
  process.exit(1);
});

const getRelatedPathsModule = require('../get-related-paths');
const getRelatedPaths = getRelatedPathsModule.default || getRelatedPathsModule;

const argv = parseArgs([
  'appDataPath',
  'desktopPath',
  'engine',
  'homePath',
  'id',
  'installationPath',
  'name',
  'username',
  'chromelessUserDataPath',
  'requireAdmin',
]);
const {
  appDataPath,
  desktopPath,
  engine,
  homePath,
  id,
  installationPath,
  name,
  username,
  chromelessUserDataPath,
} = argv;

// ignore requireAdmin if installationPath is not custom
const isStandardInstallationPath =
  installationPath === '~/Applications/Chromeless Apps' ||
  installationPath === '/Applications/Chromeless Apps';
const requireAdmin = isStandardInstallationPath ? false : argv.requireAdmin;

const sudoAsync = (prompt) =>
  new Promise((resolve, reject) => {
    const opts = {
      name: 'Chromeless',
    };
    process.env.USER = username;
    sudo.exec(prompt, opts, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      return resolve(stdout);
    });
  });

// fsExtra.remove() is idempotent: it resolves without error when the path does not exist.
// Using exists()-then-remove() is a TOCTOU and uses the deprecated fsExtra.exists() API.
const checkExistsAndRemove = (dirPath) => fsExtra.remove(dirPath);

// rm -rf is idempotent on macOS (exit 0 when path does not exist).
const checkExistsAndRemoveWithSudo = (dirPath) => sudoAsync(`rm -rf ${quoteShellArg(dirPath)}`);

const execAsync = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (e, stdout, stderr) => {
      if (e instanceof Error) {
        reject(e);
        return;
      }
      if (stderr) {
        process.stderr.write(stderr);
      }
      resolve(stdout);
    });
  });

const dotAppPath = path.join(installationPath.replace('~', homePath), `${name}.app`);

const relatedPaths = getRelatedPaths({
  appObj: {
    id,
    name,
    engine,
  },
  installationPath,
  homePath,
  appDataPath,
  userDataPath: chromelessUserDataPath,
  desktopPath,
});

Promise.resolve()
  .then(() => {
    if (requireAdmin === 'true') {
      return checkExistsAndRemoveWithSudo(dotAppPath);
    }
    return checkExistsAndRemove(dotAppPath);
  })
  .then(async () => {
    // in v20.5.2 and below, '/Applications/Chromeless Apps' owner is set to `root`
    // need to correct to user to install apps without sudo
    if (installationPath === '/Applications/Chromeless Apps') {
      // https://unix.stackexchange.com/a/7732
      const installationPathOwner = await execAsync(
        "ls -ld '/Applications/Chromeless Apps' | awk '{print $3}'",
      );
      if (String(installationPathOwner).trim() === 'root') {
        // https://askubuntu.com/questions/6723/change-folder-permissions-and-ownership
        // https://stackoverflow.com/questions/23714097/sudo-chown-command-not-found
        await sudoAsync(
          `/usr/sbin/chown -R ${quoteShellArg(username)} '/Applications/Chromeless Apps'`,
        );
      }
    }
  })
  .then(() => {
    const p = relatedPaths
      .filter((pathDetails) => pathDetails.type !== 'app')
      .map((pathDetails) => fsExtra.remove(pathDetails.path));
    return Promise.all(p);
  })
  .then(() => {
    if (engine.startsWith('firefox')) {
      const profileId = `chromeless-${id}`;

      const firefoxUserDataPath = path.join(homePath, 'Library', 'Application Support', 'Firefox');
      const profilesIniPath = path.join(firefoxUserDataPath, 'profiles.ini');

      return fsExtra.pathExists(profilesIniPath).then((exists) => {
        // If user has never opened Firefox app
        // profiles.ini doesn't exist
        if (!exists) return;
        const profilesIniContent = fsExtra.readFileSync(profilesIniPath, 'utf-8');

        // remove entry from profiles.ini
        const modifiedProfilesIniContent = profilesIniContent
          .split(`${os.EOL}${os.EOL}`)
          .filter((x) => !x.includes(`Name=${profileId}`))
          .join(`${os.EOL}${os.EOL}`);

        // Write to a temp file then rename to avoid partial-write corruption
        // if the process is killed mid-write. tmpFileCleaner removes this
        // path if SIGTERM/SIGINT/uncaughtException hits before the rename.
        const tmpPath = `${profilesIniPath}.tmp`;
        tmpFileCleaner.setTmpFilePath(tmpPath);
        fsExtra.writeFileSync(tmpPath, modifiedProfilesIniContent);
        fsExtra.moveSync(tmpPath, profilesIniPath, { overwrite: true });
        tmpFileCleaner.clearTmpFilePath();
      });
    }
    return null;
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

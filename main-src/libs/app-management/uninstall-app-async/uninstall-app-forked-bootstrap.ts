/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
type TmpFileCleanerDependencies = {
  removeSync: (path: string) => void;
  writeStderr: (message: string) => void;
};

const getCleanupErrorMessage = (cleanupError: unknown) =>
  cleanupError instanceof Error ? cleanupError.stack || cleanupError.message : String(cleanupError);

// Tracks a single "write tmp file then rename" step so the tmp file can be
// removed if the process is interrupted (SIGTERM/SIGINT/exit) between the
// write and the rename, instead of being left behind as an orphaned file.
export const createTmpFileCleaner = ({ removeSync, writeStderr }: TmpFileCleanerDependencies) => {
  let tmpFilePath: string | null = null;

  return {
    clearTmpFilePath: () => {
      tmpFilePath = null;
    },
    removeTmpFilePath: () => {
      if (!tmpFilePath) {
        return;
      }
      const pathToRemove = tmpFilePath;
      tmpFilePath = null;

      try {
        removeSync(pathToRemove);
      } catch (cleanupError) {
        writeStderr(
          `Failed to remove temporary file ${pathToRemove}: ${getCleanupErrorMessage(cleanupError)}\n`,
        );
      }
    },
    setTmpFilePath: (nextTmpFilePath: string) => {
      tmpFilePath = nextTmpFilePath;
    },
  };
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
type TmpPathCleanerDependencies = {
  remove: (path: string) => Promise<void>;
  writeStderr: (message: string) => void;
};

export const parseInstallOpts = (raw: string) => JSON.parse(raw);

const getCleanupErrorMessage = (cleanupError: unknown) =>
  cleanupError instanceof Error ? cleanupError.stack || cleanupError.message : String(cleanupError);

export const createTmpPathCleaner = ({ remove, writeStderr }: TmpPathCleanerDependencies) => {
  let tmpPath: string | null = null;
  let tmpPathCleaned = false;

  return {
    isTmpPathCleaned: () => tmpPathCleaned,
    markTmpPathCleaned: () => {
      tmpPathCleaned = true;
    },
    removeTmpPath: async () => {
      if (tmpPathCleaned || !tmpPath) {
        return;
      }

      tmpPathCleaned = true;

      try {
        await remove(tmpPath);
      } catch (cleanupError) {
        writeStderr(
          `Failed to remove temporary install directory ${tmpPath}: ${getCleanupErrorMessage(cleanupError)}\n`,
        );
      }
    },
    setTmpPath: (nextTmpPath: string) => {
      tmpPath = nextTmpPath;
      tmpPathCleaned = false;
    },
  };
};

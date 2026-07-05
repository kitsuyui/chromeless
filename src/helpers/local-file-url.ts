/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import isUrl from './is-url';

const WINDOWS_DRIVE_PATH = /^([A-Za-z]):(\/.*)$/;

const encodeFilePathSegment = (segment: string) => {
  if (segment === '.') {
    return '%2E';
  }

  if (segment === '..') {
    return '%2E%2E';
  }

  return encodeURIComponent(segment);
};

const encodeFilePath = (filePath: string) =>
  filePath
    .split('/')
    .map((segment) => encodeFilePathSegment(segment))
    .join('/');

export const isWindowsDrivePath = (filePath: string) =>
  WINDOWS_DRIVE_PATH.test(filePath.replace(/\\/g, '/'));

export const toLocalFileUrl = (filePath: string) => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const windowsDrivePath = WINDOWS_DRIVE_PATH.exec(normalizedPath);

  if (windowsDrivePath) {
    const [, drive, pathWithoutDrive] = windowsDrivePath;
    return `file:///${drive}:${encodeFilePath(pathWithoutDrive)}`;
  }

  return `file://${encodeFilePath(normalizedPath)}`;
};

export const toFileUrlIfLocalPath = (pathOrUrl: string) =>
  isWindowsDrivePath(pathOrUrl) || !isUrl(pathOrUrl) ? toLocalFileUrl(pathOrUrl) : pathOrUrl;

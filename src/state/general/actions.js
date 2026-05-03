/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import semver from 'semver';

import {
  UPDATE_FETCHING_LATEST_TEMPLATE_VERSION,
  UPDATE_INSTALLATION_PROGRESS,
  UPDATE_IS_FULL_SCREEN,
  UPDATE_IS_MAXIMIZED,
  UPDATE_LATEST_WEBKIT_WRAPPER_VERSION,
  UPDATE_MOVING_ALL_APPS,
  UPDATE_SHOULD_USE_DARK_COLORS,
} from '../../constants/actions';

export const updateIsMaximized = (isMaximized) => ({
  type: UPDATE_IS_MAXIMIZED,
  isMaximized,
});

export const updateIsFullScreen = (isFullScreen) => ({
  type: UPDATE_IS_FULL_SCREEN,
  isFullScreen,
});

export const updateShouldUseDarkColors = (shouldUseDarkColors) => ({
  type: UPDATE_SHOULD_USE_DARK_COLORS,
  shouldUseDarkColors,
});

export const updateLatestWebkitWrapperVersion = (latestWebkitWrapperVersion) => ({
  type: UPDATE_LATEST_WEBKIT_WRAPPER_VERSION,
  latestWebkitWrapperVersion,
});

export const updateFetchingLatestTemplateVersion = (fetchingLatestTemplateVersion) => ({
  type: UPDATE_FETCHING_LATEST_TEMPLATE_VERSION,
  fetchingLatestTemplateVersion,
});

export const updateMovingAllApps = (movingAllApps) => ({
  type: UPDATE_MOVING_ALL_APPS,
  movingAllApps,
});

export const updateInstallationProgress = (progress) => ({
  type: UPDATE_INSTALLATION_PROGRESS,
  progress,
});

const webkitWrapperReleasesUrl = 'https://api.github.com/repos/webcatalog/webkit-wrapper/releases';

const getReleaseVersion = (release) => semver.clean(release.tag_name || release.name || '');

const getLatestWebkitWrapperVersionAsync = (allowPrerelease) =>
  window
    .fetch(webkitWrapperReleasesUrl)
    .then((res) => res.json())
    .then((releases) => {
      const version = releases
        .filter((release) => !release.draft && (allowPrerelease || !release.prerelease))
        .map(getReleaseVersion)
        .filter(Boolean)
        .sort(semver.rcompare)[0];
      if (!version) throw new Error('Unable to find a WebKit Wrapper release.');
      return version;
    });

export const fetchLatestTemplateVersionAsync = () => (dispatch, getState) => {
  const { allowPrerelease } = getState().preferences;
  dispatch(updateFetchingLatestTemplateVersion(true));
  return Promise.resolve()
    .then(() => new Promise((resolve) => setTimeout(resolve, 1000)))
    .then(() => {
      const pp = [];

      // check for latest WebKit Wrapper version
      if (window.process.platform === 'darwin') {
        pp.push(
          getLatestWebkitWrapperVersionAsync(allowPrerelease).then((latestVersion) => {
            dispatch(updateLatestWebkitWrapperVersion(latestVersion));
          }),
        );
      }

      return Promise.all(pp);
    })
    .catch((err) => {
      console.log(err); // eslint-disable-line no-console
    })
    .then(() => {
      dispatch(updateFetchingLatestTemplateVersion(false));
    });
};

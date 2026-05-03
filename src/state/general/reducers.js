/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { combineReducers } from 'redux';

import {
  UPDATE_FETCHING_LATEST_TEMPLATE_VERSION,
  UPDATE_LATEST_WEBKIT_WRAPPER_VERSION,
} from '../../constants/actions';

// WebKit Wrapper version
const latestWebkitWrapperVersion = (state = '0.0.0', action) => {
  switch (action.type) {
    case UPDATE_LATEST_WEBKIT_WRAPPER_VERSION: return action.latestWebkitWrapperVersion;
    default: return state;
  }
};

const fetchingLatestTemplateVersion = (state = false, action) => {
  switch (action.type) {
    case UPDATE_FETCHING_LATEST_TEMPLATE_VERSION: return action.fetchingLatestTemplateVersion;
    default: return state;
  }
};

export default combineReducers({
  fetchingLatestTemplateVersion,
  latestWebkitWrapperVersion,
});

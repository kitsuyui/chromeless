/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import {
  DIALOG_EDIT_APP_CLOSE,
  DIALOG_EDIT_APP_DOWNLOADING_ICON_UPDATE,
  DIALOG_EDIT_APP_FORM_UPDATE,
  DIALOG_EDIT_APP_OPEN,
} from '../../../constants/actions';
import getStaticGlobal from '../../../helpers/get-static-global';
import validate from '../../../helpers/validate';

import { updateApp } from '../../app-management/actions';
import { buildEditAppSubmission, getEditAppValidationRules } from './save-submission';

export const close = () => ({
  type: DIALOG_EDIT_APP_CLOSE,
});

export const open = (form) => ({
  type: DIALOG_EDIT_APP_OPEN,
  form,
});

// to be replaced with invoke (electron 7+)
// https://electronjs.org/docs/api/ipc-renderer#ipcrendererinvokechannel-args
export const getWebsiteIconUrlAsync = (url) =>
  new Promise((resolve, reject) => {
    try {
      const id = crypto.randomUUID();
      window.ipcRenderer.once(id, (e, uurl) => {
        resolve(uurl);
      });
      window.ipcRenderer.send('request-get-website-icon-url', id, url);
    } catch (err) {
      reject(err);
    }
  });

let requestCount = 0;
export const getIconFromInternet = () => (dispatch, getState) => {
  const {
    form: { url, urlDisabled, urlError },
  } = getState().dialogEditApp;
  if (!url || urlDisabled || urlError) return;

  dispatch({
    type: DIALOG_EDIT_APP_DOWNLOADING_ICON_UPDATE,
    downloadingIcon: true,
  });
  requestCount += 1;

  getWebsiteIconUrlAsync(url)
    .then((iconUrl) => {
      const { form } = getState().dialogEditApp;
      if (form.url === url) {
        const changes = { internetIcon: iconUrl || form.internetIcon };
        dispatch({
          type: DIALOG_EDIT_APP_FORM_UPDATE,
          changes,
        });
      }

      if (!iconUrl) {
        return window.remote.dialog.showMessageBox(window.remote.getCurrentWindow(), {
          message: 'Unable to find a suitable icon from the Internet.',
          buttons: ['OK'],
          cancelId: 0,
          defaultId: 0,
        });
      }

      return null;
    })
    .catch(console.error) // eslint-disable-line no-console
    .then(() => {
      requestCount -= 1;
      dispatch({
        type: DIALOG_EDIT_APP_DOWNLOADING_ICON_UPDATE,
        downloadingIcon: requestCount > 0,
      });
    });
};

export const updateForm = (changes) => (dispatch, getState) => {
  const { urlDisabled } = getState().dialogEditApp.form;

  dispatch({
    type: DIALOG_EDIT_APP_FORM_UPDATE,
    changes: validate(changes, getEditAppValidationRules(urlDisabled)),
  });
};

export const updateFormOpts = (optsChanges) => (dispatch, getState) => {
  const { opts } = getState().dialogEditApp.form;

  dispatch({
    type: DIALOG_EDIT_APP_FORM_UPDATE,
    changes: {
      opts: {
        ...opts,
        ...optsChanges,
      },
    },
  });
};

export const save = () => (dispatch, getState) => {
  const state = getState();

  const { form } = state.dialogEditApp;
  const submission = buildEditAppSubmission({
    defaultIcon: getStaticGlobal('defaultIcon') as string,
    form,
  });
  if (submission.status === 'invalid') {
    return dispatch(updateForm(submission.changes));
  }

  const { id, name, url, icon, opts } = submission.payload;
  dispatch(updateApp(id, name, url, icon, opts));

  dispatch(close());
  return null;
};

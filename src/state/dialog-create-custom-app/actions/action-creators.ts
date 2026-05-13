/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import {
  DIALOG_CREATE_CUSTOM_APP_CLOSE,
  DIALOG_CREATE_CUSTOM_APP_DOWNLOADING_ICON_UPDATE,
  DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
  DIALOG_CREATE_CUSTOM_APP_OPEN,
} from '../../../constants/actions';
import getStaticGlobal from '../../../helpers/get-static-global';
import validate from '../../../helpers/validate';
import { requestShowMessageBox } from '../../../senders';
import { isNameExisted } from '../../app-management/utils';
import { open as openDialogChooseEngine } from '../../dialog-choose-engine/actions';
import {
  buildCreateCustomAppSubmission,
  getCreateCustomAppValidationRules,
} from './create-submission';

export const close = () => ({
  type: DIALOG_CREATE_CUSTOM_APP_CLOSE,
});

// to be replaced with invoke (electron 7+)
// https://electronjs.org/docs/api/ipc-renderer#ipcrendererinvokechannel-args
// attempt to get icon from manifest, favicon, etc of the URL first
export const getWebsiteIconUrlAsync = (url, _name = null) =>
  new Promise((resolve, reject) => {
    try {
      const id = Date.now().toString();
      window.ipcRenderer.once(id, (e, uurl) => {
        resolve(uurl);
      });
      window.ipcRenderer.send('request-get-website-icon-url', id, url);
    } catch (err) {
      reject(err);
    }
  });

let requestCount = 0;

export const open = (form) => {
  requestCount = 0;
  return { type: DIALOG_CREATE_CUSTOM_APP_OPEN, form };
};

export const getIconFromInternet = () => (dispatch, getState) => {
  const {
    form: { name, url, urlDisabled, urlError },
  } = getState().dialogCreateCustomApp;
  if (!url || urlDisabled || urlError) return;

  dispatch({
    type: DIALOG_CREATE_CUSTOM_APP_DOWNLOADING_ICON_UPDATE,
    downloadingIcon: true,
  });
  requestCount += 1;

  getWebsiteIconUrlAsync(url, name)
    .then((iconUrl) => {
      const { form } = getState().dialogCreateCustomApp;
      if (form.url === url) {
        const changes = { internetIcon: iconUrl || form.internetIcon };
        dispatch({
          type: DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
          changes,
        });
      }

      if (!iconUrl) {
        return window.remote.dialog.showMessageBox(window.remote.getCurrentWindow(), {
          message: 'Unable to find a suitable icon from the URL.',
          buttons: ['OK'],
          cancelId: 0,
          defaultId: 0,
        });
      }

      return null;
    })
    .catch(console.log) // eslint-disable-line no-console
    .then(() => {
      requestCount -= 1;
      dispatch({
        type: DIALOG_CREATE_CUSTOM_APP_DOWNLOADING_ICON_UPDATE,
        downloadingIcon: requestCount > 0,
      });
    });
};

export const updateForm = (changes) => (dispatch, getState) => {
  const { urlDisabled } = getState().dialogCreateCustomApp.form;

  dispatch({
    type: DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
    changes: validate(changes, getCreateCustomAppValidationRules(urlDisabled)),
  });
};

export const create = () => (dispatch, getState) => {
  const state = getState();

  const { form } = state.dialogCreateCustomApp;

  const submission = buildCreateCustomAppSubmission({
    defaultIcon: getStaticGlobal('defaultIcon') as string,
    form,
    nameExists: isNameExisted(form.name, state),
    now: Date.now(),
  });

  if (submission.status === 'invalid') {
    return dispatch(updateForm(submission.changes));
  }

  if (submission.status === 'duplicate') {
    requestShowMessageBox(submission.message, 'error');
    return null;
  }

  const { id, name, url, icon, opts } = submission.payload;
  dispatch(openDialogChooseEngine(id, name, url, icon, opts));

  dispatch(close());
  return null;
};

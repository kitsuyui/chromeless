/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import hasErrors from '../../../helpers/has-errors';
import isUrl from '../../../helpers/is-url';
import validate from '../../../helpers/validate';

type EditAppForm = {
  icon?: string | null;
  id: string;
  internetIcon?: string | null;
  name: string;
  opts?: Record<string, unknown>;
  url: string;
  urlDisabled?: boolean;
};

type BuildEditAppSubmissionInput = {
  defaultIcon: string;
  form: EditAppForm;
};

export const getEditAppValidationRules = (urlDisabled: boolean | undefined) => ({
  name: {
    fieldName: 'Name',
    filePath: true,
    required: true,
  },
  url: !urlDisabled
    ? {
        fieldName: 'URL',
        lessStrictUrl: true,
        required: true,
      }
    : undefined,
});

export const buildEditAppSubmission = ({ defaultIcon, form }: BuildEditAppSubmissionInput) => {
  const validatedChanges = validate(form, getEditAppValidationRules(form.urlDisabled));
  if (hasErrors(validatedChanges)) {
    return {
      changes: validatedChanges,
      status: 'invalid' as const,
    };
  }

  const protocolledUrl = isUrl(form.url) ? form.url : `http://${form.url}`;

  return {
    payload: {
      icon: form.icon || form.internetIcon || defaultIcon,
      id: form.id,
      name: form.name,
      opts: { ...form.opts },
      url: form.urlDisabled ? null : protocolledUrl,
    },
    status: 'ready' as const,
  };
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import slugify from 'slugify';
import {
  MAX_CUSTOM_APP_NAME_BYTES,
  MAX_CUSTOM_APP_URL_LENGTH,
} from '../../../constants/custom-app-validation';
import hasErrors from '../../../helpers/has-errors';
import isUrl from '../../../helpers/is-url';
import validate from '../../../helpers/validate';

export {
  MAX_CUSTOM_APP_NAME_BYTES,
  MAX_CUSTOM_APP_URL_LENGTH,
} from '../../../constants/custom-app-validation';

type CreateCustomAppForm = {
  icon?: string | null;
  internetIcon?: string | null;
  name: string;
  url: string;
  urlDisabled?: boolean;
};

type BuildCreateCustomAppSubmissionInput = {
  defaultIcon: string;
  form: CreateCustomAppForm;
  nameExists: boolean;
  id: string;
};

export const getCreateCustomAppValidationRules = (urlDisabled: boolean | undefined) => ({
  name: {
    fieldName: 'Name',
    filePath: true,
    maxBytes: MAX_CUSTOM_APP_NAME_BYTES,
    required: true,
  },
  url: !urlDisabled
    ? {
        fieldName: 'URL',
        lessStrictUrl: true,
        maxLength: MAX_CUSTOM_APP_URL_LENGTH,
        required: true,
      }
    : undefined,
});

const buildSlugOpts = (name: string): Record<string, unknown> => {
  const slug = slugify(name, {
    lower: true,
  });
  return slug.length > 0 ? { slug } : {};
};

export const buildCreateCustomAppSubmission = ({
  defaultIcon,
  form,
  nameExists,
  id,
}: BuildCreateCustomAppSubmissionInput) => {
  const validatedChanges = validate(form, getCreateCustomAppValidationRules(form.urlDisabled));
  if (hasErrors(validatedChanges)) {
    return {
      changes: validatedChanges,
      status: 'invalid' as const,
    };
  }

  if (nameExists) {
    return {
      message: `An app named ${form.name} already exists.`,
      status: 'duplicate' as const,
    };
  }

  const protocolledUrl = isUrl(form.url) ? form.url : `http://${form.url}`;

  return {
    payload: {
      icon: form.icon || form.internetIcon || defaultIcon,
      id: `custom-${id}`,
      name: form.name,
      opts: buildSlugOpts(form.name),
      url: form.urlDisabled ? null : protocolledUrl,
    },
    status: 'ready' as const,
  };
};

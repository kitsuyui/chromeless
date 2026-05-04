/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import slugify from 'slugify';

import hasErrors from '../../../helpers/has-errors';
import isUrl from '../../../helpers/is-url';
import validate from '../../../helpers/validate';

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
  now: number;
};

export const getCreateCustomAppValidationRules = (urlDisabled: boolean | undefined) => ({
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
  now,
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
      id: `custom-${now.toString()}`,
      name: form.name,
      opts: buildSlugOpts(form.name),
      url: form.urlDisabled ? null : protocolledUrl,
    },
    status: 'ready' as const,
  };
};

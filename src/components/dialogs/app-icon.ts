/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import type { OpenDialogOptions } from 'electron';
import isUrl from '../../helpers/is-url';

const IMAGE_DIALOG_OPTIONS: OpenDialogOptions = {
  filters: [
    {
      name: 'Images',
      extensions: ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'bmp', 'dib'],
    },
  ],
  properties: ['openFile'],
};

type OpenDialogResult = {
  canceled: boolean;
  filePaths?: string[];
};

type SelectLocalImageInput = {
  onError?: (error: unknown) => void;
  onSelect: (path: string) => void;
  showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogResult>;
};

export const getAppIconPath = ({
  defaultIcon,
  icon,
  internetIcon,
}: {
  defaultIcon: string;
  icon?: string | null;
  internetIcon?: string | null;
}) => {
  if (icon) {
    if (isUrl(icon)) return icon;
    return `file://${icon}`;
  }

  return internetIcon || defaultIcon;
};

export const selectLocalImage = ({
  onError = console.error,
  onSelect,
  showOpenDialog,
}: SelectLocalImageInput) =>
  showOpenDialog(IMAGE_DIALOG_OPTIONS)
    .then(({ canceled, filePaths }) => {
      if (!canceled && filePaths && filePaths.length > 0) {
        onSelect(filePaths[0]);
      }
    })
    .catch(onError);

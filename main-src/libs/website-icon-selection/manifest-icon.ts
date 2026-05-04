/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

type ManifestIcon = {
  sizes?: string;
  src?: string;
};

const getDeclaredSize = (sizes: string | undefined): number => {
  if (!sizes) return 0;

  const [width] = sizes.split('x');
  const parsedSize = Number.parseInt(width, 10);
  return Number.isNaN(parsedSize) ? 0 : parsedSize;
};

export const selectLargestManifestIconSrc = (manifestJson: string): string | undefined => {
  let manifest: { icons?: ManifestIcon[] };
  try {
    manifest = JSON.parse(manifestJson);
  } catch {
    return undefined;
  }

  if (!Array.isArray(manifest.icons)) return undefined;

  let selectedIcon: ManifestIcon | undefined;
  let selectedSize = 0;
  for (const icon of manifest.icons) {
    if (!icon.src) continue;

    const size = getDeclaredSize(icon.sizes);
    if (size >= selectedSize) {
      selectedIcon = icon;
      selectedSize = size;
    }
  }

  return selectedIcon?.src;
};

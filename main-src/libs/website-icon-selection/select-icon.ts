/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export type IconCandidate = {
  href?: string;
  sizes?: string;
  type?: string;
};

const getDeclaredSize = (candidate: IconCandidate): number => {
  if (!candidate.sizes) return 0;

  const [width] = candidate.sizes.split('x');
  const parsedSize = Number.parseInt(width, 10);
  return Number.isNaN(parsedSize) ? 0 : parsedSize;
};

const isPngIconCandidate = (candidate: IconCandidate): boolean => {
  if (!candidate.href) return false;

  return (
    (candidate.type === 'image/png' && !candidate.href.endsWith('.ico')) ||
    candidate.href.endsWith('.png')
  );
};

export const selectLargestPngIconHref = (candidates: IconCandidate[]): string | undefined => {
  let selectedHref: string | undefined;
  let selectedSize = 0;

  for (const candidate of candidates) {
    if (!isPngIconCandidate(candidate)) continue;

    const size = getDeclaredSize(candidate);
    if (size >= selectedSize) {
      selectedHref = candidate.href;
      selectedSize = size;
    }
  }

  return selectedHref;
};

export const selectFirstAvailableIconHref = (
  candidateGroups: IconCandidate[][],
): string | undefined => {
  for (const candidates of candidateGroups) {
    const href = selectLargestPngIconHref(candidates);
    if (href) return href;
  }

  return undefined;
};

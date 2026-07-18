/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as cheerio from 'cheerio';

import { selectLargestManifestIconSrc } from '../website-icon-selection/manifest-icon';
import { selectFirstAvailableIconHref } from '../website-icon-selection/select-icon';
import customizedFetch from './customized-fetch';

const MAX_TEXT_RESPONSE_BYTES = 1024 * 1024;

const toIconCandidates = ($, rootElm) =>
  rootElm.toArray().map((elm) => {
    const $elm = $(elm);
    return {
      href: $elm.attr('href'),
      sizes: $elm.attr('sizes'),
      type: $elm.attr('type'),
    };
  });

const resolveUrl = (baseUrl, href) => new URL(href, baseUrl).toString();

const resolveSelectedIcon = (baseUrl, href) => (href ? resolveUrl(baseUrl, href) : undefined);

const concatChunks = (chunks: Uint8Array[], totalLength: number): Uint8Array => {
  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
};

const readTextResponseWithinLimit = async (
  res: Response,
  maxBytes = MAX_TEXT_RESPONSE_BYTES,
): Promise<string> => {
  const contentLengthHeader = res.headers.get('content-length');
  if (contentLengthHeader) {
    const declaredLength = Number.parseInt(contentLengthHeader, 10);
    if (!Number.isNaN(declaredLength) && declaredLength > maxBytes) {
      throw new Error(`Response body exceeds ${maxBytes} bytes.`);
    }
  }

  const reader = res.body?.getReader();
  if (!reader) {
    return res.text();
  }

  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalLength += value.byteLength;
    if (totalLength > maxBytes) {
      await reader.cancel(`Response body exceeds ${maxBytes} bytes.`);
      throw new Error(`Response body exceeds ${maxBytes} bytes.`);
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(concatChunks(chunks, totalLength));
};

const getWebsiteIconUrlAsync = (websiteURL) =>
  customizedFetch(websiteURL)
    .then((res) =>
      readTextResponseWithinLimit(res).then((html) => ({ html, redirectedUrl: res.url })),
    )
    .then(({ html, redirectedUrl }) => {
      const $ = cheerio.load(html);
      // rel=fluid-icon
      // https://webmasters.stackexchange.com/questions/23696/whats-the-fluid-icon-meta-tag-for
      const $fluidIcon = $('head > link[rel=fluid-icon]');
      if ($fluidIcon.length > 0) {
        return resolveSelectedIcon(redirectedUrl, $fluidIcon.attr('href'));
      }

      const lessPriorityCheck = () => {
        const href = selectFirstAvailableIconHref([
          toIconCandidates($, $('head > link[rel=icon]')),
          toIconCandidates($, $("head > link[rel='shortcut icon']")),
          toIconCandidates($, $('head > link[rel=apple-touch-icon]')),
          toIconCandidates($, $('head > link[rel=apple-touch-icon-precomposed]')),
        ]);

        return resolveSelectedIcon(redirectedUrl, href);
      };

      // manifest.json icon
      // https://developers.google.com/web/fundamentals/web-app-manifest
      const $manifest = $('head > link[rel=manifest]');
      if ($('head > link[rel=manifest]').length > 0) {
        const manifestUrl = resolveSelectedIcon(redirectedUrl, $manifest.attr('href'));
        if (!manifestUrl) return lessPriorityCheck();

        return (
          customizedFetch(manifestUrl)
            .then((res) =>
              readTextResponseWithinLimit(res).then((manifestJson) => ({
                manifestJson,
                manifestRedirectedUrl: res.url,
              })),
            )
            .then(({ manifestJson, manifestRedirectedUrl }) => {
              const iconSrc = selectLargestManifestIconSrc(manifestJson);
              return resolveSelectedIcon(manifestRedirectedUrl, iconSrc);
            })
            // youtube.com/manifest.json doesn't specify icons
            // error needs to be caught and the other checks need to be run
            .catch(() => lessPriorityCheck())
        );
      }

      return lessPriorityCheck();
    })
    .then((icon) => {
      if (icon) {
        // try to download the icon to ensure it works
        return customizedFetch(icon)
          .then((res) => {
            if (res.ok) return icon; // res.status >= 200 && res.status < 300
            return undefined;
          })
          .catch(() => undefined);
      }

      // try to get /apple-touch-icon.png
      // https://apple.stackexchange.com/questions/172204/how-apple-com-set-apple-touch-icon
      const appleTouchIconUrl = resolveUrl(websiteURL, '/apple-touch-icon.png');
      return customizedFetch(appleTouchIconUrl)
        .then((res) => {
          if (res.status === 200 && res.headers.get('Content-Type') === 'image/png')
            return appleTouchIconUrl;
          return undefined;
        })
        .catch(() => undefined);
    });

export default getWebsiteIconUrlAsync;

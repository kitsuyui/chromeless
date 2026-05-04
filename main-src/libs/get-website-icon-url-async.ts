/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
const cheerio = require('cheerio');
const url = require('url');

const customizedFetch = require('./customized-fetch');
const { selectFirstAvailableIconHref } = require('./website-icon-selection');

const toIconCandidates = ($, rootElm) =>
  rootElm.toArray().map((elm) => {
    const $elm = $(elm);
    return {
      href: $elm.attr('href'),
      sizes: $elm.attr('sizes'),
      type: $elm.attr('type'),
    };
  });

const resolveSelectedIcon = (baseUrl, href) => (href ? url.resolve(baseUrl, href) : undefined);

const getWebsiteIconUrlAsync = (websiteURL) =>
  customizedFetch(websiteURL)
    .then((res) => res.text().then((html) => ({ html, redirectedUrl: res.url })))
    .then(({ html, redirectedUrl }) => {
      const $ = cheerio.load(html);
      // rel=fluid-icon
      // https://webmasters.stackexchange.com/questions/23696/whats-the-fluid-icon-meta-tag-for
      const $fluidIcon = $('head > link[rel=fluid-icon]');
      if ($fluidIcon.length > 0) {
        return url.resolve(redirectedUrl, $fluidIcon.attr('href'));
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
        const manifestUrl = url.resolve(redirectedUrl, $manifest.attr('href'));
        return (
          customizedFetch(manifestUrl)
            .then((res) =>
              res.text().then((manifestJson) => ({
                manifestJson,
                manifestRedirectedUrl: res.url,
              })),
            )
            .then(({ manifestJson, manifestRedirectedUrl }) => {
              // return icon with largest size
              const { icons } = manifestJson;
              icons.sort(
                (x, y) =>
                  Number.parseInt(x.sizes.split('x'), 10) - Number.parseInt(y.sizes.split('x'), 10),
              );
              return url.resolve(manifestRedirectedUrl, icons[icons.length - 1].src);
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
      const appleTouchIconUrl = url.resolve(websiteURL, '/apple-touch-icon.png');
      return customizedFetch(appleTouchIconUrl)
        .then((res) => {
          if (res.status === 200 && res.headers.get('Content-Type') === 'image/png')
            return appleTouchIconUrl;
          return undefined;
        })
        .catch(() => undefined);
    });

module.exports = getWebsiteIconUrlAsync;

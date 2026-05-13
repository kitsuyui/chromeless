/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { orderBy } from 'lodash';

const DEFAULT_SORT_ORDER = 'asc';

const normalizeSortOrder = (order) => (order === 'desc' ? 'desc' : DEFAULT_SORT_ORDER);

export const getInstalledAppSort = (sortInstalledAppBy) => {
  const [key, order] = sortInstalledAppBy.split('/');
  return {
    key,
    order: normalizeSortOrder(order),
  };
};

export const getInstalledAppSortValue = (app, key) => {
  if (key === 'name') {
    return app.name;
  }
  return -(app.lastUpdated || 0);
};

export const orderInstalledAppIds = (ids, apps, sortInstalledAppBy) => {
  const { key, order } = getInstalledAppSort(sortInstalledAppBy);
  return orderBy(
    ids,
    (id) => {
      const app = apps[id];
      return getInstalledAppSortValue(app, key);
    },
    [order],
  );
};

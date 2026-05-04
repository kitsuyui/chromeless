/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import type { RootState } from '../../state';
import { isOutdatedApp } from '../../state/app-management/utils';

type AppRecord = {
  cancelable?: boolean;
  engine?: string | null;
  icon?: string;
  icon128?: string | null;
  name?: string;
  opts?: Record<string, unknown>;
  status?: string | null;
  url?: string | null;
  version?: string | null;
};

export type AppCardOwnProps = {
  category?: string;
  icon?: string;
  iconThumbnail?: string | null;
  id: string;
  name?: string;
  url?: string | null;
};

export const selectAppCardProps = (state: RootState, ownProps: AppCardOwnProps) => {
  const app = state.appManagement.apps[ownProps.id] as AppRecord | undefined;

  return {
    cancelable: Boolean(app ? app.cancelable : false),
    category: ownProps.category || (app && app.opts ? app.opts.category : undefined),
    engine: app ? app.engine : null,
    icon: ownProps.icon || app?.icon,
    iconThumbnail: ownProps.iconThumbnail || (app ? app.icon128 : null),
    isOutdated: isOutdatedApp(ownProps.id, state),
    name: ownProps.name || app?.name,
    opts: app && app.opts ? app.opts : undefined,
    status: app ? app.status : null,
    url: ownProps.url || (app ? app.url : null),
    version: app ? app.version : null,
  };
};

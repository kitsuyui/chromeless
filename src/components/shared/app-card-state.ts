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

const toAppFallbackProps = (app: AppRecord | undefined) => ({
  cancelable: Boolean(app?.cancelable),
  category: app?.opts?.category,
  engine: app?.engine ?? null,
  icon: app?.icon,
  iconThumbnail: app?.icon128 ?? null,
  name: app?.name,
  opts: app?.opts,
  status: app?.status ?? null,
  url: app?.url ?? null,
  version: app?.version ?? null,
});

export const selectAppCardProps = (state: RootState, ownProps: AppCardOwnProps) => {
  const app = state.appManagement.apps[ownProps.id] as AppRecord | undefined;
  const fallback = toAppFallbackProps(app);

  return {
    cancelable: fallback.cancelable,
    category: ownProps.category || fallback.category,
    engine: fallback.engine,
    icon: ownProps.icon || fallback.icon,
    iconThumbnail: ownProps.iconThumbnail || fallback.iconThumbnail,
    isOutdated: isOutdatedApp(ownProps.id, state),
    name: ownProps.name || fallback.name,
    opts: fallback.opts,
    status: fallback.status,
    url: ownProps.url || fallback.url,
    version: fallback.version,
  };
};

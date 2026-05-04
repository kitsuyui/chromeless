/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { INSTALLED, INSTALLING } from '../../constants/app-statuses';
import type { getRelatedPathsAsync } from '../../invokers';
import type {
  requestCancelInstallApp,
  requestCancelUpdateApp,
  requestOpenInBrowser,
  requestUninstallApp,
} from '../../senders';

type AppCardMenuInput = {
  cancelable: boolean;
  combinedOpts: Record<string, unknown>;
  engine: string | null;
  engineName: string;
  icon: string;
  id: string;
  isOutdated: boolean;
  name: string;
  onOpenDialogCreateCustomApp: (form: Record<string, unknown>) => void;
  onOpenDialogEditApp: (form: Record<string, unknown>) => void;
  onUpdateApp: (id: string) => void;
  showItemInFolder: (path: string) => void;
  status: string | null;
  url: string | null;
  version: string | null;
};

type AppCardMenuDependencies = {
  getRelatedPathsAsync: typeof getRelatedPathsAsync;
  requestCancelInstallApp: typeof requestCancelInstallApp;
  requestCancelUpdateApp: typeof requestCancelUpdateApp;
  requestOpenInBrowser: typeof requestOpenInBrowser;
  requestUninstallApp: typeof requestUninstallApp;
};

type MenuItem = {
  click?: () => void | Promise<void>;
  enabled?: boolean;
  label?: string;
  type?: 'separator';
  visible?: boolean;
};

export const createAppCardMenuTemplate = (
  input: AppCardMenuInput,
  dependencies: AppCardMenuDependencies,
) => {
  const {
    cancelable,
    combinedOpts,
    engine,
    engineName,
    icon,
    id,
    isOutdated,
    name,
    onOpenDialogCreateCustomApp,
    onOpenDialogEditApp,
    onUpdateApp,
    showItemInFolder,
    status,
    url,
    version,
  } = input;

  const template: MenuItem[] = [
    {
      label: version ? 'Cancel Update' : 'Cancel Installation',
      visible: status === INSTALLING && cancelable,
      click: () => {
        if (version) {
          dependencies.requestCancelUpdateApp(id);
          return;
        }
        dependencies.requestCancelInstallApp(id);
      },
    },
    {
      label: 'Edit',
      visible: status === INSTALLED,
      click: () =>
        onOpenDialogEditApp({
          engine,
          id,
          name,
          url,
          urlDisabled: Boolean(!url),
          icon,
          opts: combinedOpts,
        }),
    },
    {
      label: 'Uninstall',
      visible: status === INSTALLED && isOutdated,
      click: () => dependencies.requestUninstallApp(id, name, engine),
    },
    {
      label: 'Clone',
      click: () =>
        onOpenDialogCreateCustomApp({
          name: `${name} 2`,
          url,
          urlDisabled: Boolean(!url),
          icon,
        }),
    },
    {
      label: 'Reinstall (Repair)',
      visible: status === INSTALLED && !isOutdated,
      click: () => onUpdateApp(id),
    },
    {
      type: 'separator',
    },
    {
      label: 'Show App in Finder',
      visible: status === INSTALLED,
      click: async () => {
        const relatedPaths = await dependencies.getRelatedPathsAsync({ id, name, engine });
        showItemInFolder(relatedPaths[0].path);
      },
    },
    {
      label: 'Show Data Directory in Finder',
      visible: status === INSTALLED,
      click: async () => {
        const relatedPaths = await dependencies.getRelatedPathsAsync({ id, name, engine });
        showItemInFolder(relatedPaths[1].path);
      },
    },
    {
      type: 'separator',
    },
    {
      label: "What's New",
      click: () =>
        void dependencies.requestOpenInBrowser(
          'https://github.com/kitsuyui/chromeless/releases?utm_source=chromeless_app',
        ),
      visible: Boolean(engine && version),
    },
    {
      label: `Powered by ${engineName} (script v${version})`,
      enabled: false,
      visible: Boolean(engine && version),
    },
  ];

  // Electron keeps separators visible even when a hidden section surrounds them.
  return template.filter((item) => item.visible !== false);
};

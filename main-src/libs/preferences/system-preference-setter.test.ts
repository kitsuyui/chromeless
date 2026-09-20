/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSetSystemPreference } from './system-preference-setter';

const app = {
  setLoginItemSettings: vi.fn(),
};
const sendToAllWindows = vi.fn();
const setSystemPreference = createSetSystemPreference(app, sendToAllWindows);

describe('system preference setter', () => {
  beforeEach(() => {
    app.setLoginItemSettings.mockReset();
    sendToAllWindows.mockReset();
  });

  it.each([
    ['yes', { openAsHidden: false, openAtLogin: true }],
    ['yes-hidden', { openAsHidden: true, openAtLogin: true }],
    ['no', { openAsHidden: false, openAtLogin: false }],
  ])('updates open-at-login for the %s value', (value, settings) => {
    setSystemPreference('openAtLogin', value);

    expect(app.setLoginItemSettings).toHaveBeenCalledWith(settings);
    expect(sendToAllWindows).toHaveBeenCalledWith('set-system-preference', 'openAtLogin', value);
  });

  it.each([
    null,
    undefined,
    false,
    1,
    {},
  ])('ignores non-string values without side effects', (value) => {
    expect(() => setSystemPreference('openAtLogin', value)).not.toThrow();

    expect(app.setLoginItemSettings).not.toHaveBeenCalled();
    expect(sendToAllWindows).not.toHaveBeenCalled();
  });
});

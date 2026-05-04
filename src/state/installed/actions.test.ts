/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  INSTALLED_SET_IS_SEARCHING,
  INSTALLED_UPDATE_ACTIVE_QUERY,
  INSTALLED_UPDATE_QUERY,
  INSTALLED_UPDATE_SCROLL_OFFSET,
  INSTALLED_UPDATE_SORTED_APP_IDS,
} from '../../constants/actions';

const mocks = vi.hoisted(() => ({
  batch: vi.fn((callback: () => void) => callback()),
  filterApps: vi.fn(),
}));

vi.mock('react-redux', () => ({
  batch: mocks.batch,
}));

vi.mock('comlink', () => ({
  wrap: () => mocks.filterApps,
}));

import { updateActiveQuery, updateQuery, updateScrollOffset } from './actions';

class TestWorker {
  static instances: TestWorker[] = [];

  terminate = vi.fn();

  constructor(
    readonly url: URL,
    readonly options: WorkerOptions,
  ) {
    TestWorker.instances.push(this);
  }
}

const createState = (query = 'mail') => ({
  appManagement: {
    apps: {
      calendar: { name: 'Calendar' },
      mail: { name: 'Mail' },
    },
    sortedAppIds: ['calendar', 'mail'],
  },
  installed: {
    query,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  TestWorker.instances = [];
  vi.stubGlobal('Worker', TestWorker);
  mocks.filterApps.mockResolvedValue(['mail']);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('installed actions', () => {
  it('creates a scroll offset update action', () => {
    expect(updateScrollOffset(240)).toEqual({
      scrollOffset: 240,
      type: INSTALLED_UPDATE_SCROLL_OFFSET,
    });
  });

  it('updates the active query and filtered app ids', async () => {
    const dispatch = vi.fn();
    const state = createState();

    await updateActiveQuery('mail')(dispatch, () => state);

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      isSearching: true,
      type: INSTALLED_SET_IS_SEARCHING,
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      activeQuery: 'mail',
      type: INSTALLED_UPDATE_ACTIVE_QUERY,
    });
    expect(mocks.filterApps).toHaveBeenCalledWith(
      state.appManagement.apps,
      state.appManagement.sortedAppIds,
      'mail',
    );
    expect(TestWorker.instances).toHaveLength(1);
    expect(TestWorker.instances[0]?.options).toEqual({ type: 'module' });
    expect(TestWorker.instances[0]?.terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenNthCalledWith(3, {
      isSearching: false,
      type: INSTALLED_SET_IS_SEARCHING,
    });
    expect(dispatch).toHaveBeenNthCalledWith(4, {
      sortedAppIds: ['mail'],
      type: INSTALLED_UPDATE_SORTED_APP_IDS,
    });
  });

  it('skips worker filtering when the active query is empty', async () => {
    const dispatch = vi.fn();

    await updateActiveQuery('')(dispatch, () => createState(''));

    expect(mocks.filterApps).not.toHaveBeenCalled();
    expect(TestWorker.instances).toHaveLength(0);
    expect(dispatch).toHaveBeenNthCalledWith(4, {
      sortedAppIds: null,
      type: INSTALLED_UPDATE_SORTED_APP_IDS,
    });
  });

  it('does not publish filtered ids when the query changed before filtering finished', async () => {
    const dispatch = vi.fn();
    const getState = vi
      .fn()
      .mockReturnValueOnce(createState('mail'))
      .mockReturnValueOnce(createState('calendar'));

    await updateActiveQuery('mail')(dispatch, getState);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).not.toHaveBeenCalledWith({
      sortedAppIds: ['mail'],
      type: INSTALLED_UPDATE_SORTED_APP_IDS,
    });
  });

  it('debounces active query updates', () => {
    vi.useFakeTimers();
    const dispatch = vi.fn();

    updateQuery('m')(dispatch);
    updateQuery('ma')(dispatch);

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      query: 'm',
      type: INSTALLED_UPDATE_QUERY,
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      query: 'ma',
      type: INSTALLED_UPDATE_QUERY,
    });

    vi.advanceTimersByTime(499);
    expect(dispatch).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1);
    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch).toHaveBeenLastCalledWith(expect.any(Function));
  });
});

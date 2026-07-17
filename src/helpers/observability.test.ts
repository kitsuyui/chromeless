/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { describe, expect, it, vi } from 'vitest';

import {
  formatObservabilityEvent,
  isObservabilityEvent,
  serializeError,
  writeObservabilityEvent,
} from './observability';

describe('observability helpers', () => {
  it('serializes native errors', () => {
    const error = new Error('boom');
    error.name = 'InstallError';

    expect(serializeError(error)).toMatchObject({
      message: 'boom',
      name: 'InstallError',
    });
  });

  it('recognizes observability event payloads', () => {
    expect(
      isObservabilityEvent({
        message: 'failed to install app',
        operation: 'install-app',
        subsystem: 'app-management',
      }),
    ).toBe(true);
    expect(isObservabilityEvent({ message: 'missing fields' })).toBe(false);
  });

  it('formats context-rich summaries', () => {
    expect(
      formatObservabilityEvent({
        correlationKey: 'install:mail',
        details: { phase: 'fork-exit' },
        level: 'error',
        message: 'Install request failed.',
        operation: 'install-app',
        stage: 'complete',
        subsystem: 'ipc',
        target: { id: 'mail', name: 'Mail' },
      }),
    ).toEqual({
      metadata: {
        details: { phase: 'fork-exit' },
        targetId: 'mail',
        targetName: 'Mail',
      },
      summary:
        '[chromeless][ipc][install-app][complete][install:mail] Install request failed. target=Mail (mail)',
    });
  });

  it('writes error events with metadata to the matching console method', () => {
    const consoleLike = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };

    writeObservabilityEvent(
      {
        error: { message: 'boom', name: 'InstallError' },
        level: 'error',
        message: 'Install request failed.',
        operation: 'install-app',
        subsystem: 'ipc',
        target: { id: 'mail', name: 'Mail' },
      },
      consoleLike,
    );

    expect(consoleLike.error).toHaveBeenCalledWith(
      '[chromeless][ipc][install-app] Install request failed. target=Mail (mail)',
      {
        error: { message: 'boom', name: 'InstallError' },
        targetId: 'mail',
        targetName: 'Mail',
      },
    );
    expect(consoleLike.info).not.toHaveBeenCalled();
    expect(consoleLike.warn).not.toHaveBeenCalled();
  });
});

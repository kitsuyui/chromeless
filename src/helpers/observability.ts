/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export type ObservabilityLevel = 'error' | 'info' | 'warn';

export type SerializedError = {
  message: string;
  name: string;
  stack?: string;
};

export type ObservabilityEvent = {
  correlationKey?: string;
  details?: Record<string, unknown>;
  error?: SerializedError;
  level?: ObservabilityLevel;
  message: string;
  operation: string;
  stage?: string;
  subsystem: string;
  target?: {
    id?: string;
    name?: string;
  };
};

type ConsoleLike = Pick<Console, 'error' | 'info' | 'warn'>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const serializeError = (error: unknown): SerializedError | undefined => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      name: 'Error',
    };
  }

  if (isRecord(error) && typeof error.message === 'string') {
    return {
      message: error.message,
      name: typeof error.name === 'string' ? error.name : 'Error',
      stack: typeof error.stack === 'string' ? error.stack : undefined,
    };
  }

  return undefined;
};

export const isObservabilityEvent = (value: unknown): value is ObservabilityEvent => {
  if (!isRecord(value)) return false;
  return (
    typeof value.message === 'string' &&
    typeof value.operation === 'string' &&
    typeof value.subsystem === 'string'
  );
};

export const formatObservabilityEvent = (event: ObservabilityEvent) => {
  const targetLabel =
    event.target?.name != null && event.target?.id != null
      ? `${event.target.name} (${event.target.id})`
      : event.target?.name || event.target?.id;

  const prefix = [
    '[chromeless]',
    `[${event.subsystem}]`,
    `[${event.operation}]`,
    event.stage ? `[${event.stage}]` : null,
    event.correlationKey ? `[${event.correlationKey}]` : null,
  ]
    .filter(Boolean)
    .join('');

  const metadata: Record<string, unknown> = {};

  if (event.target?.id != null) metadata.targetId = event.target.id;
  if (event.target?.name != null) metadata.targetName = event.target.name;
  if (event.error != null) metadata.error = event.error;
  if (event.details != null) metadata.details = event.details;

  return {
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    summary: `${prefix} ${event.message}${targetLabel ? ` target=${targetLabel}` : ''}`,
  };
};

export const writeObservabilityEvent = (
  event: ObservabilityEvent,
  consoleLike: ConsoleLike = console,
) => {
  const { metadata, summary } = formatObservabilityEvent(event);
  const level = event.level ?? 'info';
  const writer =
    level === 'error' ? consoleLike.error : level === 'warn' ? consoleLike.warn : consoleLike.info;

  if (metadata != null) {
    writer(summary, metadata);
  } else {
    writer(summary);
  }

  return event;
};

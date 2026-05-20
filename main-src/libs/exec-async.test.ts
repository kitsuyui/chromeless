/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import execAsync from './exec-async';

describe('execAsync', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('resolves with stdout when the command succeeds', async () => {
    const result = await execAsync('echo hello');
    expect(result.trim()).toBe('hello');
  });

  it('resolves when the command writes to stderr but exits with code 0', async () => {
    const result = await execAsync("bash -c 'printf warn >&2; echo ok'");
    expect(result.trim()).toBe('ok');
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('warn'));
  });

  it('rejects when the command exits with a non-zero exit code', async () => {
    await expect(execAsync('false')).rejects.toBeInstanceOf(Error);
  });
});

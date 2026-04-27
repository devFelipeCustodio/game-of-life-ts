/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, vi, test, beforeEach, afterEach } from 'vitest';
import { debounce, sleep } from '../util';

describe('Util', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('resolves after the specified time', async () => {
    const promise = sleep(1000);

    let resolved = false;
    promise.then(() => (resolved = true));

    await Promise.resolve();
    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1000);
    await promise;

    expect(resolved).toBe(true);
  });

  test('calls function once after delay', () => {
    const fn = vi.fn();
    const debounced = debounce(100, fn);

    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('debounces multiple rapid calls into one', () => {
    const fn = vi.fn();
    const debounced = debounce(100, fn);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('uses latest arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(100, fn);

    debounced(1);
    debounced(2);
    debounced(3);

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith(3);
  });

  test('resets timer when called again before delay', () => {
    const fn = vi.fn();
    const debounced = debounce(100, fn);

    debounced();

    vi.advanceTimersByTime(50);

    debounced();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('preserves this context', () => {
    const obj = {
      value: 67,
      fn: vi.fn(function (this: any) {
        return this.value;
      }),
    };

    const debounced = debounce(100, obj.fn);

    debounced.call(obj);

    vi.advanceTimersByTime(100);

    expect(obj.fn.mock.results[0].value).toBe(67);
  });
});

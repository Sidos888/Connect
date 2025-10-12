/**
 * Network Utilities Unit Tests
 * 
 * Tests for retry logic, exponential backoff, and network helpers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { withRetry, NetworkError, isOnline, debounce, throttle } from '@/lib/utils/network';

describe('NetworkError', () => {
  it('should create error with custom properties', () => {
    const error = new NetworkError('Test error', 'ERR_CODE', 500, true);
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('ERR_CODE');
    expect(error.statusCode).toBe(500);
    expect(error.isRetryable).toBe(true);
    expect(error.name).toBe('NetworkError');
  });

  it('should default isRetryable to true', () => {
    const error = new NetworkError('Test error');
    expect(error.isRetryable).toBe(true);
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should succeed on first try', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(operation, {
      retries: 3,
      baseDelayMs: 1000
    });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue('success');
    
    const promise = withRetry(operation, {
      retries: 3,
      baseDelayMs: 100 // Shorter delay for tests
    });
    
    // Run all pending timers
    await vi.runAllTimersAsync();
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry on auth errors', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Invalid Refresh Token'));
    
    await expect(withRetry(operation, {
      retries: 3,
      baseDelayMs: 1000
    })).rejects.toThrow('Invalid Refresh Token');
    
    expect(operation).toHaveBeenCalledTimes(1); // No retries
  });

  it('should exhaust retries and throw last error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('network error'));
    
    const promise = withRetry(operation, {
      retries: 2,
      baseDelayMs: 100 // Shorter delay for tests
    });
    
    // Run all pending timers
    await vi.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('network error');
    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should call onRetry callback', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('error'))
      .mockResolvedValue('success');
    
    const onRetry = vi.fn();
    
    const promise = withRetry(operation, {
      retries: 2,
      baseDelayMs: 100, // Shorter delay for tests
      onRetry
    });
    
    await vi.runAllTimersAsync();
    await promise;
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('should use exponential backoff', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('error'))
      .mockRejectedValueOnce(new Error('error'))
      .mockResolvedValue('success');
    
    const delays: number[] = [];
    const onRetry = vi.fn((attempt) => {
      delays.push(attempt);
    });
    
    const promise = withRetry(operation, {
      retries: 3,
      baseDelayMs: 1000,
      onRetry
    });
    
    await vi.advanceTimersByTimeAsync(2000); // First retry (1s base * 2^0 + jitter)
    await vi.advanceTimersByTimeAsync(4000); // Second retry (1s base * 2^1 + jitter)
    
    await promise;
    
    expect(operation).toHaveBeenCalledTimes(3);
  });
});

describe('isOnline', () => {
  it('should return navigator.onLine value', () => {
    (global.navigator as any).onLine = true;
    expect(isOnline()).toBe(true);
    
    (global.navigator as any).onLine = false;
    expect(isOnline()).toBe(false);
  });

  it('should default to true if navigator undefined', () => {
    const originalNavigator = global.navigator;
    (global as any).navigator = undefined;
    
    expect(isOnline()).toBe(true);
    
    (global as any).navigator = originalNavigator;
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);
    
    debounced('test');
    expect(fn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledWith('test');
  });

  it('should cancel previous calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);
    
    debounced('call1');
    vi.advanceTimersByTime(500);
    
    debounced('call2');
    vi.advanceTimersByTime(500);
    
    debounced('call3');
    vi.advanceTimersByTime(1000);
    
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call3');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow first call immediately', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);
    
    throttled('test');
    expect(fn).toHaveBeenCalledWith('test');
  });

  it('should block calls within interval', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);
    
    throttled('call1');
    throttled('call2'); // Blocked
    throttled('call3'); // Blocked
    
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call1');
  });

  it('should allow call after interval', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);
    
    throttled('call1');
    vi.advanceTimersByTime(1000);
    throttled('call2');
    
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'call1');
    expect(fn).toHaveBeenNthCalledWith(2, 'call2');
  });
});


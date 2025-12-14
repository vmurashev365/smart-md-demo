/**
 * API Request Throttling Engine
 *
 * Core utilities for rate limiting and human-like request timing.
 * Reuses patterns from tests/shared/utils/human-like.ts
 *
 * @module throttle
 */

import { getCurrentProfile, ProfileConfig } from './profiles';

/**
 * Global state for throttling
 */
let lastRequestTime = 0;
let consecutiveErrors = 0;

/**
 * Generate a random delay within a range
 *
 * Pattern from human-like.ts adapted for API use.
 *
 * @param min - Minimum delay in milliseconds
 * @param max - Maximum delay in milliseconds
 * @returns Promise that resolves after random delay
 */
export async function randomDelay(min: number, max: number): Promise<void> {
  // Skip delays if explicitly disabled (useful for unit tests)
  if (process.env.DISABLE_API_DELAYS === 'true') {
    return Promise.resolve();
  }

  const delay = Math.floor(Math.random() * (max - min + 1)) + min;

  if (delay <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Apply random jitter to avoid predictable timing patterns
 *
 * Jitter adds or subtracts a random percentage from the base delay,
 * making request timing less predictable to detection systems.
 *
 * @param baseDelay - Base delay in milliseconds
 * @param jitterPercent - Maximum jitter percentage (0-50)
 * @returns Jittered delay value
 *
 * @example
 * // With 25% jitter, 1000ms becomes 750-1250ms
 * const delay = applyJitter(1000, 25);
 */
export function applyJitter(baseDelay: number, jitterPercent: number): number {
  if (jitterPercent <= 0 || baseDelay <= 0) {
    return baseDelay;
  }

  // Clamp jitter to reasonable range
  const clampedJitter = Math.min(jitterPercent, 50);

  // Calculate jitter range
  const jitterFactor = clampedJitter / 100;
  const jitterAmount = baseDelay * jitterFactor;

  // Random value between -jitterAmount and +jitterAmount
  const jitter = (Math.random() * 2 - 1) * jitterAmount;

  // Ensure result is never negative
  return Math.max(0, Math.round(baseDelay + jitter));
}

/**
 * Calculate delay with progressive exponential backoff
 *
 * After errors, delays increase exponentially to give the server
 * time to recover. Capped at 10x the base delay.
 *
 * Formula: baseDelay * (2 ^ errorCount), max 10x
 *
 * @param baseDelay - Base delay in milliseconds
 * @param errorCount - Number of consecutive errors
 * @returns Backoff delay value
 *
 * @example
 * calculateBackoff(1000, 0) // 1000ms
 * calculateBackoff(1000, 1) // 2000ms
 * calculateBackoff(1000, 2) // 4000ms
 * calculateBackoff(1000, 3) // 8000ms
 * calculateBackoff(1000, 4) // 10000ms (capped)
 */
export function calculateBackoff(baseDelay: number, errorCount: number): number {
  if (errorCount <= 0) {
    return baseDelay;
  }

  const multiplier = Math.pow(2, errorCount);
  const backoffDelay = baseDelay * multiplier;

  // Cap at 10x base delay
  const maxDelay = baseDelay * 10;

  return Math.min(backoffDelay, maxDelay);
}

/**
 * Wait for the next available request slot based on profile timing
 *
 * Tracks last request time globally and ensures minimum delay
 * between requests according to the current profile.
 *
 * @param profile - Profile config (defaults to current)
 * @returns Promise that resolves when slot is available
 */
export async function waitForNextSlot(profile?: ProfileConfig): Promise<void> {
  const config = profile || getCurrentProfile();
  const { requestDelay, jitterPercent, progressiveBackoff } = config;

  // Calculate base delay
  let delay = Math.floor(
    Math.random() * (requestDelay.max - requestDelay.min + 1) + requestDelay.min
  );

  // Apply jitter
  delay = applyJitter(delay, jitterPercent);

  // Apply backoff if enabled and we have errors
  if (progressiveBackoff && consecutiveErrors > 0) {
    delay = calculateBackoff(delay, consecutiveErrors);
    console.log(
      `⚠️ Backoff active: ${consecutiveErrors} errors, delay: ${delay}ms`
    );
  }

  // Calculate time since last request
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  const remainingDelay = Math.max(0, delay - elapsed);

  if (remainingDelay > 0) {
    await randomDelay(remainingDelay, remainingDelay);
  }

  lastRequestTime = Date.now();
}

/**
 * Record a successful request (resets error counter)
 */
export function recordSuccess(): void {
  consecutiveErrors = 0;
}

/**
 * Record a failed request (increments error counter)
 */
export function recordError(): void {
  consecutiveErrors++;
}

/**
 * Get current consecutive error count
 */
export function getErrorCount(): number {
  return consecutiveErrors;
}

/**
 * Reset throttle state (for test isolation)
 */
export function resetThrottleState(): void {
  lastRequestTime = 0;
  consecutiveErrors = 0;
}

/**
 * Semaphore for limiting concurrent requests
 *
 * Implements a counting semaphore pattern to ensure
 * no more than maxConcurrent requests run at once.
 *
 * @example
 * const semaphore = new RequestSemaphore(2);
 *
 * async function makeRequest() {
 *   await semaphore.acquire();
 *   try {
 *     return await fetch('/api/data');
 *   } finally {
 *     semaphore.release();
 *   }
 * }
 */
export class RequestSemaphore {
  private maxConcurrent: number;
  private currentCount: number;
  private waitQueue: Array<() => void>;

  /**
   * Create a new semaphore
   *
   * @param maxConcurrent - Maximum concurrent operations allowed
   */
  constructor(maxConcurrent: number) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
    this.currentCount = 0;
    this.waitQueue = [];
  }

  /**
   * Acquire a semaphore slot
   *
   * If all slots are in use, waits until one becomes available.
   *
   * @returns Promise that resolves when slot is acquired
   */
  async acquire(): Promise<void> {
    if (this.currentCount < this.maxConcurrent) {
      this.currentCount++;
      return Promise.resolve();
    }

    // Wait for a slot to become available
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release a semaphore slot
   *
   * Must be called after the operation completes (use try/finally).
   */
  release(): void {
    if (this.waitQueue.length > 0) {
      // Give slot to next waiter
      const nextResolver = this.waitQueue.shift();
      if (nextResolver) {
        nextResolver();
      }
    } else {
      // No waiters, just decrement count
      this.currentCount = Math.max(0, this.currentCount - 1);
    }
  }

  /**
   * Get number of currently active operations
   */
  getActiveCount(): number {
    return this.currentCount;
  }

  /**
   * Get number of operations waiting for a slot
   */
  getWaitingCount(): number {
    return this.waitQueue.length;
  }

  /**
   * Check if semaphore has available slots
   */
  hasAvailableSlot(): boolean {
    return this.currentCount < this.maxConcurrent;
  }
}

/**
 * Global semaphore instance (lazy initialized)
 */
let globalSemaphore: RequestSemaphore | null = null;

/**
 * Get the global request semaphore
 *
 * Creates a new semaphore based on current profile's maxParallel setting.
 *
 * @returns Global semaphore instance
 */
export function getGlobalSemaphore(): RequestSemaphore {
  if (!globalSemaphore) {
    const profile = getCurrentProfile();
    globalSemaphore = new RequestSemaphore(profile.maxParallel);
    console.log(`🔀 Semaphore initialized: max ${profile.maxParallel} parallel requests`);
  }
  return globalSemaphore;
}

/**
 * Reset global semaphore (for test isolation or profile change)
 */
export function resetGlobalSemaphore(): void {
  globalSemaphore = null;
}

export default {
  randomDelay,
  applyJitter,
  calculateBackoff,
  waitForNextSlot,
  recordSuccess,
  recordError,
  getErrorCount,
  resetThrottleState,
  RequestSemaphore,
  getGlobalSemaphore,
  resetGlobalSemaphore,
};

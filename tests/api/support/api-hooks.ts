/**
 * API Test Hooks
 *
 * Playwright test hooks for API testing with throttling support.
 * Provides session management and reporting.
 *
 * @module api-hooks
 */

import { test } from '@playwright/test';
import { getCurrentProfile, logProfileInfo } from '../utils/profiles';
import { SessionManager } from '../utils/session-manager';
import { RateLimitTracker } from '../utils/rate-limit-tracker';
import { resetThrottleState, resetGlobalSemaphore } from '../utils/throttle';

/**
 * Flag to track if profile was logged (only once per run)
 */
let profileLogged = false;

/**
 * Setup hooks for API tests
 *
 * Usage in test files:
 * ```typescript
 * import { setupApiHooks } from '../support/api-hooks';
 * setupApiHooks();
 *
 * test('my api test', async () => {
 *   // throttling is automatic
 * });
 * ```
 */
export function setupApiHooks(): void {
  const profile = getCurrentProfile();
  const session = SessionManager.getInstance();
  const tracker = RateLimitTracker.getInstance();

  /**
   * Before all tests in a file
   * - Log profile configuration (once per run)
   * - Initialize tracking
   */
  test.beforeAll(async () => {
    if (!profileLogged) {
      console.log('\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('              🎭 API THROTTLING INITIALIZED                 ');
      console.log('═══════════════════════════════════════════════════════════');

      logProfileInfo(profile);

      // Log environment info
      console.log('🔧 CONFIGURATION');
      console.log('───────────────────────────────────────────────────────────');
      console.log(`   Base URL:    ${process.env.API_BASE_URL || 'https://smart.md'}`);
      console.log(`   Timeout:     ${process.env.API_REQUEST_TIMEOUT || '30000'}ms`);
      console.log(`   Max Retries: ${process.env.API_MAX_RETRIES || '3'}`);
      console.log(`   Logging:     ${process.env.API_LOG_REQUESTS === 'true' ? 'enabled' : 'disabled'}`);
      console.log('');

      profileLogged = true;
    }
  });

  /**
   * Before each test
   * - Wait for session gap (human-like pause between tests)
   */
  test.beforeEach(async () => {
    await session.waitForSessionGap();
  });

  /**
   * After all tests in a file
   * - Print rate limit report
   * - Log session statistics
   */
  test.afterAll(async () => {
    // Print comprehensive report
    tracker.printReport();

    // Log session stats
    const sessionStats = session.getStats();
    console.log('🍪 SESSION SUMMARY');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`   Session ID:   ${sessionStats.sessionId}`);
    console.log(`   Cookies:      ${sessionStats.cookieCount}`);
    console.log(`   Suite Count:  ${sessionStats.suiteCount}`);
    console.log('');

    // Mark suite end for gap calculation
    session.markSuiteEnd();
  });
}

/**
 * Reset all API test state
 *
 * Call this between completely independent test suites
 * or when you need fresh state.
 */
export function resetApiState(): void {
  console.log('🔄 Resetting API test state...');

  // Reset session
  SessionManager.resetInstance();

  // Reset tracker
  RateLimitTracker.resetInstance();

  // Reset throttle state
  resetThrottleState();
  resetGlobalSemaphore();

  // Reset profile logged flag
  profileLogged = false;

  console.log('✅ API state reset complete');
}

/**
 * Get current API test statistics
 */
export function getApiStats() {
  return {
    session: SessionManager.getInstance().getStats(),
    rateLimit: RateLimitTracker.getInstance().getStats(),
    profile: getCurrentProfile(),
  };
}

/**
 * Check if API is currently being throttled
 */
export function isApiThrottled(): boolean {
  return RateLimitTracker.getInstance().isThrottled();
}

/**
 * Clear session cookies (for isolation)
 */
export function clearApiSession(): void {
  SessionManager.getInstance().clearSession();
}

export default {
  setupApiHooks,
  resetApiState,
  getApiStats,
  isApiThrottled,
  clearApiSession,
};

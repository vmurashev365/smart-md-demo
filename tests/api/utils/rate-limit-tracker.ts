/**
 * API Rate Limit Tracker
 *
 * Monitors API responses to detect rate limiting and track performance.
 * Provides statistics and reporting for test analysis.
 *
 * @module rate-limit-tracker
 */

/**
 * Individual response record
 */
interface ResponseRecord {
  endpoint: string;
  status: number;
  responseTime: number;
  timestamp: number;
}

/**
 * Aggregated statistics
 */
export interface RateLimitStats {
  /** Total number of requests made */
  totalRequests: number;
  /** Percentage of successful (2xx) responses */
  successRate: number;
  /** Average response time in milliseconds */
  avgResponseTime: number;
  /** Number of 429 (Too Many Requests) responses */
  throttledCount: number;
  /** Number of 5xx server error responses */
  errorCount: number;
  /** Number of 4xx client error responses (excluding 429) */
  clientErrorCount: number;
  /** Minimum response time */
  minResponseTime: number;
  /** Maximum response time */
  maxResponseTime: number;
  /** Requests per endpoint breakdown */
  endpointStats: Record<string, { count: number; avgTime: number }>;
}

/**
 * Throttle detection window (in ms)
 */
const THROTTLE_WINDOW = 60000; // 1 minute

/**
 * Rate Limit Tracker Singleton
 *
 * Tracks all API responses and provides analytics for
 * detecting rate limiting and performance issues.
 *
 * @example
 * const tracker = RateLimitTracker.getInstance();
 *
 * // Record each response
 * tracker.recordResponse('/api/search', 200, 150);
 *
 * // Check if being throttled
 * if (tracker.isThrottled()) {
 *   console.log('Rate limited! Backing off...');
 * }
 *
 * // Print report at end of test suite
 * tracker.printReport();
 */
export class RateLimitTracker {
  private static instance: RateLimitTracker | null = null;

  private responses: ResponseRecord[] = [];
  private startTime: number;

  /**
   * Private constructor (use getInstance())
   */
  private constructor() {
    this.startTime = Date.now();
    console.log('📊 Rate limit tracker initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RateLimitTracker {
    if (!RateLimitTracker.instance) {
      RateLimitTracker.instance = new RateLimitTracker();
    }
    return RateLimitTracker.instance;
  }

  /**
   * Reset singleton (for test isolation)
   */
  static resetInstance(): void {
    RateLimitTracker.instance = null;
  }

  /**
   * Record an API response
   *
   * @param endpoint - API endpoint path
   * @param status - HTTP status code
   * @param responseTime - Response time in milliseconds
   */
  recordResponse(endpoint: string, status: number, responseTime: number): void {
    const record: ResponseRecord = {
      endpoint: this.normalizeEndpoint(endpoint),
      status,
      responseTime,
      timestamp: Date.now(),
    };

    this.responses.push(record);

    // Log warnings for problematic responses
    if (status === 429) {
      console.log(`🚦 THROTTLED: ${endpoint} (429 Too Many Requests)`);
    } else if (status >= 500) {
      console.log(`❌ SERVER ERROR: ${endpoint} (${status})`);
    } else if (responseTime > 5000) {
      console.log(`🐢 SLOW: ${endpoint} (${responseTime}ms)`);
    }
  }

  /**
   * Normalize endpoint for consistent grouping
   */
  private normalizeEndpoint(endpoint: string): string {
    // Remove query parameters for grouping
    const [path] = endpoint.split('?');
    // Remove trailing slash
    return path.replace(/\/$/, '') || '/';
  }

  /**
   * Check if we're currently being rate limited
   *
   * Returns true if there have been 429 responses in the recent window.
   *
   * @param windowMs - Time window to check (default: 1 minute)
   * @returns true if throttled
   */
  isThrottled(windowMs: number = THROTTLE_WINDOW): boolean {
    const cutoff = Date.now() - windowMs;

    const recentThrottles = this.responses.filter(
      (r) => r.timestamp >= cutoff && r.status === 429
    );

    return recentThrottles.length > 0;
  }

  /**
   * Get count of recent 429 responses
   *
   * @param windowMs - Time window to check
   */
  getRecentThrottleCount(windowMs: number = THROTTLE_WINDOW): number {
    const cutoff = Date.now() - windowMs;

    return this.responses.filter(
      (r) => r.timestamp >= cutoff && r.status === 429
    ).length;
  }

  /**
   * Get comprehensive statistics
   *
   * @returns Aggregated stats object
   */
  getStats(): RateLimitStats {
    if (this.responses.length === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        avgResponseTime: 0,
        throttledCount: 0,
        errorCount: 0,
        clientErrorCount: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        endpointStats: {},
      };
    }

    // Count by status type
    let successCount = 0;
    let throttledCount = 0;
    let errorCount = 0;
    let clientErrorCount = 0;

    // Response time tracking
    let totalResponseTime = 0;
    let minResponseTime = Infinity;
    let maxResponseTime = 0;

    // Per-endpoint tracking
    const endpointData: Record<
      string,
      { count: number; totalTime: number }
    > = {};

    for (const record of this.responses) {
      // Status categorization
      if (record.status >= 200 && record.status < 300) {
        successCount++;
      } else if (record.status === 429) {
        throttledCount++;
      } else if (record.status >= 500) {
        errorCount++;
      } else if (record.status >= 400) {
        clientErrorCount++;
      }

      // Response time
      totalResponseTime += record.responseTime;
      minResponseTime = Math.min(minResponseTime, record.responseTime);
      maxResponseTime = Math.max(maxResponseTime, record.responseTime);

      // Per-endpoint
      if (!endpointData[record.endpoint]) {
        endpointData[record.endpoint] = { count: 0, totalTime: 0 };
      }
      endpointData[record.endpoint].count++;
      endpointData[record.endpoint].totalTime += record.responseTime;
    }

    // Calculate endpoint averages
    const endpointStats: Record<string, { count: number; avgTime: number }> = {};
    for (const [endpoint, data] of Object.entries(endpointData)) {
      endpointStats[endpoint] = {
        count: data.count,
        avgTime: Math.round(data.totalTime / data.count),
      };
    }

    return {
      totalRequests: this.responses.length,
      successRate: Math.round((successCount / this.responses.length) * 100),
      avgResponseTime: Math.round(totalResponseTime / this.responses.length),
      throttledCount,
      errorCount,
      clientErrorCount,
      minResponseTime: minResponseTime === Infinity ? 0 : minResponseTime,
      maxResponseTime,
      endpointStats,
    };
  }

  /**
   * Get responses filtered by status
   */
  getResponsesByStatus(status: number): ResponseRecord[] {
    return this.responses.filter((r) => r.status === status);
  }

  /**
   * Get responses filtered by endpoint
   */
  getResponsesByEndpoint(endpoint: string): ResponseRecord[] {
    const normalized = this.normalizeEndpoint(endpoint);
    return this.responses.filter((r) => r.endpoint === normalized);
  }

  /**
   * Clear all recorded responses
   */
  clear(): void {
    this.responses = [];
    this.startTime = Date.now();
    console.log('📊 Rate limit tracker cleared');
  }

  /**
   * Print formatted report to console
   *
   * Outputs a detailed summary with emojis for quick scanning.
   */
  printReport(): void {
    const stats = this.getStats();
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                   📊 API PERFORMANCE REPORT                ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Summary section
    console.log('📈 SUMMARY');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`   Total Requests:    ${stats.totalRequests}`);
    console.log(`   Duration:          ${duration}s`);
    console.log(
      `   Requests/sec:      ${(stats.totalRequests / parseFloat(duration)).toFixed(2)}`
    );
    console.log('');

    // Success rate with color indicator
    const successEmoji =
      stats.successRate >= 95 ? '✅' : stats.successRate >= 80 ? '⚠️' : '❌';
    console.log('🎯 SUCCESS RATE');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`   ${successEmoji} Success Rate:     ${stats.successRate}%`);
    console.log(
      `   ✅ Successful:      ${stats.totalRequests - stats.throttledCount - stats.errorCount - stats.clientErrorCount}`
    );
    console.log(`   🚦 Throttled (429): ${stats.throttledCount}`);
    console.log(`   ❌ Server Errors:   ${stats.errorCount}`);
    console.log(`   ⚠️  Client Errors:   ${stats.clientErrorCount}`);
    console.log('');

    // Response times
    const avgEmoji =
      stats.avgResponseTime < 500
        ? '🚀'
        : stats.avgResponseTime < 2000
          ? '🏃'
          : '🐢';
    console.log('⏱️  RESPONSE TIMES');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`   ${avgEmoji} Average:          ${stats.avgResponseTime}ms`);
    console.log(`   ⚡ Minimum:          ${stats.minResponseTime}ms`);
    console.log(`   🐌 Maximum:          ${stats.maxResponseTime}ms`);
    console.log('');

    // Per-endpoint breakdown
    if (Object.keys(stats.endpointStats).length > 0) {
      console.log('🔗 PER-ENDPOINT BREAKDOWN');
      console.log('───────────────────────────────────────────────────────────');

      // Sort by request count descending
      const sortedEndpoints = Object.entries(stats.endpointStats).sort(
        (a, b) => b[1].count - a[1].count
      );

      for (const [endpoint, data] of sortedEndpoints) {
        const timeEmoji = data.avgTime < 500 ? '🟢' : data.avgTime < 2000 ? '🟡' : '🔴';
        console.log(
          `   ${timeEmoji} ${endpoint.padEnd(35)} ${String(data.count).padStart(4)} reqs  ${String(data.avgTime).padStart(5)}ms avg`
        );
      }
      console.log('');
    }

    // Warnings
    if (stats.throttledCount > 0 || stats.errorCount > 0) {
      console.log('⚠️  WARNINGS');
      console.log('───────────────────────────────────────────────────────────');

      if (stats.throttledCount > 0) {
        console.log(
          `   🚦 Rate limiting detected! Consider using 'stealth' profile.`
        );
      }

      if (stats.errorCount > 0) {
        console.log(`   ❌ Server errors detected. Check API health.`);
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * Get raw response records (for custom analysis)
   */
  getRawResponses(): ResponseRecord[] {
    return [...this.responses];
  }

  /**
   * Get elapsed time since tracking started
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}

export default RateLimitTracker;

/**
 * Base API Client
 *
 * Abstract class providing throttled, human-like API requests.
 * All API clients should extend this class.
 *
 * @module base.client
 */

import { ProfileConfig, getCurrentProfile } from '../utils/profiles';
import {
  waitForNextSlot,
  applyJitter,
  calculateBackoff,
  randomDelay,
  recordSuccess,
  recordError,
  getErrorCount,
  getGlobalSemaphore,
  RequestSemaphore,
} from '../utils/throttle';
import { SessionManager } from '../utils/session-manager';
import { RateLimitTracker } from '../utils/rate-limit-tracker';

/**
 * Request configuration
 */
export interface RequestConfig {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** API endpoint path (will be appended to baseUrl) */
  endpoint: string;
  /** Request body (for POST/PUT/PATCH) */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Override default timeout */
  timeout?: number;
  /** Skip throttling for this request */
  skipThrottle?: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  /** Parsed response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response time in milliseconds */
  responseTime: number;
  /** Response headers */
  headers: Headers;
}

/**
 * Error thrown on API failures
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public responseTime: number,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Default request timeout (ms)
 */
const DEFAULT_TIMEOUT = parseInt(process.env.API_REQUEST_TIMEOUT || '30000', 10);

/**
 * Maximum retry attempts
 */
const MAX_RETRIES = parseInt(process.env.API_MAX_RETRIES || '3', 10);

/**
 * Base API Client Abstract Class
 *
 * Provides throttled, session-aware API requests with automatic
 * retry handling and rate limit tracking.
 *
 * @example
 * class SearchClient extends BaseApiClient {
 *   async search(query: string) {
 *     return this.get<SearchResult>(`/api/search?q=${encodeURIComponent(query)}`);
 *   }
 * }
 *
 * const client = new SearchClient();
 * const result = await client.search('iPhone');
 */
export abstract class BaseApiClient {
  /** Current profile configuration */
  protected profile: ProfileConfig;

  /** Base URL for all requests */
  protected baseUrl: string;

  /** Semaphore for concurrent request limiting */
  protected semaphore: RequestSemaphore;

  /** Session manager instance */
  protected session: SessionManager;

  /** Rate limit tracker instance */
  protected tracker: RateLimitTracker;

  /** Enable verbose logging */
  protected verbose: boolean;

  /**
   * Create a new API client
   *
   * @param baseUrl - Override default base URL
   */
  constructor(baseUrl?: string) {
    this.profile = getCurrentProfile();
    this.baseUrl = baseUrl || process.env.API_BASE_URL || 'https://smart.md';
    this.semaphore = getGlobalSemaphore();
    this.session = SessionManager.getInstance();
    this.tracker = RateLimitTracker.getInstance();
    this.verbose = process.env.API_LOG_REQUESTS === 'true';

    if (this.verbose) {
      console.log(`🔌 ${this.constructor.name} initialized`);
      console.log(`   Base URL: ${this.baseUrl}`);
      console.log(`   Profile: ${this.profile.name}`);
    }
  }

  /**
   * Main request method with full throttling logic
   *
   * Flow:
   * 1. Acquire semaphore slot
   * 2. Wait for rate limit slot
   * 3. Apply jitter delay
   * 4. Apply session cookies
   * 5. Execute fetch with timeout
   * 6. Track response in RateLimitTracker
   * 7. Handle errors with backoff
   * 8. Release semaphore
   *
   * @param config - Request configuration
   * @returns Promise with response data, status, and timing
   */
  protected async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const {
      method,
      endpoint,
      body,
      headers = {},
      timeout = DEFAULT_TIMEOUT,
      skipThrottle = false,
    } = config;

    const fullUrl = this.buildUrl(endpoint);
    const startTime = Date.now();
    let attempt = 0;

    // Acquire semaphore slot
    await this.semaphore.acquire();

    try {
      while (attempt < MAX_RETRIES) {
        attempt++;

        try {
          // Step 1-3: Throttling (unless skipped)
          if (!skipThrottle) {
            await this.applyThrottling(attempt);
          }

          // Step 4: Build request with cookies
          const requestInit = this.buildRequest(method, body, headers);

          // Log request
          if (this.verbose) {
            console.log(`🌐 ${method} ${endpoint} (attempt ${attempt})`);
          }

          // Step 5: Execute with timeout
          const response = await this.executeWithTimeout(
            fullUrl,
            requestInit,
            timeout
          );

          // Calculate response time
          const responseTime = Date.now() - startTime;

          // Step 6: Track response
          this.tracker.recordResponse(endpoint, response.status, responseTime);

          // Save cookies from response
          this.session.saveCookies(response);

          // Handle non-OK responses
          if (!response.ok) {
            const errorBody = await this.parseResponseBody(response);

            // Check for rate limiting
            if (response.status === 429) {
              console.log(`🚦 Rate limited on ${endpoint}, backing off...`);
              recordError();

              if (attempt < MAX_RETRIES) {
                await this.waitForRetry();
                continue;
              }
            }

            // Server errors - retry
            if (response.status >= 500 && attempt < MAX_RETRIES) {
              console.log(`❌ Server error ${response.status}, retrying...`);
              recordError();
              await this.waitForRetry();
              continue;
            }

            throw new ApiError(
              `API request failed: ${response.status} ${response.statusText}`,
              response.status,
              endpoint,
              responseTime,
              errorBody
            );
          }

          // Success!
          recordSuccess();

          // Parse response
          const data = await this.parseResponseBody<T>(response);

          if (this.verbose) {
            console.log(`✅ ${method} ${endpoint} - ${response.status} (${responseTime}ms)`);
          }

          return {
            data,
            status: response.status,
            responseTime,
            headers: response.headers,
          };
        } catch (error) {
          // Network errors - retry
          if (this.isNetworkError(error) && attempt < MAX_RETRIES) {
            console.log(`🔌 Network error, retrying... (${attempt}/${MAX_RETRIES})`);
            recordError();
            await this.waitForRetry();
            continue;
          }

          // Timeout - retry
          if (this.isTimeoutError(error) && attempt < MAX_RETRIES) {
            console.log(`⏱️ Timeout, retrying... (${attempt}/${MAX_RETRIES})`);
            recordError();
            await this.waitForRetry();
            continue;
          }

          throw error;
        }
      }

      // Should not reach here, but TypeScript needs it
      throw new Error(`Max retries (${MAX_RETRIES}) exceeded for ${endpoint}`);
    } finally {
      // Step 8: Always release semaphore
      this.semaphore.release();
    }
  }

  /**
   * Apply throttling delays
   */
  private async applyThrottling(attempt: number): Promise<void> {
    // Wait for rate limit slot
    await waitForNextSlot(this.profile);

    // Apply jitter on first attempt
    if (attempt === 1 && this.profile.jitterPercent > 0) {
      const jitterDelay = applyJitter(100, this.profile.jitterPercent);
      if (jitterDelay > 0) {
        await randomDelay(jitterDelay, jitterDelay);
      }
    }
  }

  /**
   * Build request URL
   */
  private buildUrl(endpoint: string): string {
    // Handle absolute URLs
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Ensure proper path joining
    const base = this.baseUrl.replace(/\/$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${base}${path}`;
  }

  /**
   * Build fetch request init object
   */
  private buildRequest(
    method: string,
    body: unknown,
    customHeaders: Record<string, string>
  ): RequestInit {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Language': 'ru,ro;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      ...customHeaders,
    };

    // Add content type for body
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    // Apply session cookies
    this.session.applyCookies(headers);

    const init: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    // Add body
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    return init;
  }

  /**
   * Execute fetch with timeout
   */
  private async executeWithTimeout(
    url: string,
    init: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse response body (JSON or text)
   */
  private async parseResponseBody<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    // Return text as-is for non-JSON responses
    const text = await response.text();
    return text as unknown as T;
  }

  /**
   * Wait before retry with backoff
   */
  private async waitForRetry(): Promise<void> {
    const { retryDelay, progressiveBackoff } = this.profile;
    const errorCount = getErrorCount();

    let delay =
      Math.floor(Math.random() * (retryDelay.max - retryDelay.min + 1)) +
      retryDelay.min;

    if (progressiveBackoff) {
      delay = calculateBackoff(delay, errorCount);
    }

    console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before retry...`);
    await randomDelay(delay, delay);
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError) {
      return error.message.includes('fetch') || error.message.includes('network');
    }
    return false;
  }

  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.name === 'AbortError' || error.message.includes('timeout')
      );
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HTTP Method Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Make a GET request
   *
   * @param endpoint - API endpoint
   * @param headers - Optional additional headers
   * @returns Response with parsed data
   */
  protected async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      endpoint,
      headers,
    });
  }

  /**
   * Make a POST request
   *
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param headers - Optional additional headers
   * @returns Response with parsed data
   */
  protected async post<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      endpoint,
      body,
      headers,
    });
  }

  /**
   * Make a PUT request
   *
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param headers - Optional additional headers
   * @returns Response with parsed data
   */
  protected async put<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      endpoint,
      body,
      headers,
    });
  }

  /**
   * Make a DELETE request
   *
   * @param endpoint - API endpoint
   * @param headers - Optional additional headers
   * @returns Response with parsed data
   */
  protected async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      endpoint,
      headers,
    });
  }

  /**
   * Make a PATCH request
   *
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param headers - Optional additional headers
   * @returns Response with parsed data
   */
  protected async patch<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      endpoint,
      body,
      headers,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Utility Methods
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current profile configuration
   */
  getProfile(): ProfileConfig {
    return this.profile;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get rate limit statistics
   */
  getStats() {
    return this.tracker.getStats();
  }

  /**
   * Check if currently being rate limited
   */
  isThrottled(): boolean {
    return this.tracker.isThrottled();
  }
}

export default BaseApiClient;

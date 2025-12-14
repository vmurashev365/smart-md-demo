/**
 * API Client - Refactored to use BaseApiClient throttling system
 *
 * This client extends BaseApiClient to leverage:
 * - Profile-based throttling (stealth, normal, fast, burst)
 * - Session/cookie management
 * - Rate limit tracking and reporting
 * - Exponential backoff on errors
 *
 * @module apiClient
 */

import { BaseApiClient, ApiResponse as BaseApiResponse } from '../clients/base.client';
import { getCurrentProfile } from '../utils/profiles';

/**
 * Legacy response interface (maintained for backward compatibility)
 */
export interface ApiResponse<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

/**
 * Legacy config interface (maintained for backward compatibility)
 */
export interface ApiClientConfig {
  baseURL: string;
  language?: 'ru' | 'ro';
  extraHeaders?: Record<string, string>;
  /** @deprecated Human-like behavior is now controlled by API_PROFILE */
  humanLike?: boolean;
  /** @deprecated Speed is now controlled by profile settings */
  humanSpeed?: number;
}

/**
 * Action types for backward compatibility
 * @deprecated Use profile-based throttling instead
 */
export type ActionType = 'click' | 'type' | 'scroll' | 'navigate' | 'wait';

/**
 * Human behavior config for backward compatibility
 * @deprecated Use getCurrentProfile() instead
 */
export interface HumanBehaviorConfig {
  enabled: boolean;
  speedMultiplier: number;
}

/**
 * Typed API client for Smart.md
 *
 * Extends BaseApiClient to use the new throttling system while
 * maintaining backward compatibility with existing tests.
 *
 * NOTE: This class overrides get/post/put/delete methods to provide
 * backward-compatible signatures with legacy ApiResponse format.
 *
 * @example
 * const client = new ApiClient({ language: 'ru' });
 * const response = await client.get<Product[]>('/api/products');
 */
export class ApiClient extends BaseApiClient {
  private language: 'ru' | 'ro';
  private extraHeaders: Record<string, string>;

  constructor(config: Partial<ApiClientConfig> = {}) {
    // Initialize BaseApiClient with base URL
    super(config.baseURL || process.env.API_BASE_URL || 'https://www.smart.md');

    this.language = config.language || 'ru';
    this.extraHeaders = config.extraHeaders || {};

    // Log deprecation warning if old config options are used
    if (config.humanLike !== undefined || config.humanSpeed !== undefined) {
      console.log(
        '⚠️ ApiClient: humanLike/humanSpeed options are deprecated. ' +
          'Use API_PROFILE environment variable instead.'
      );
      console.log(`   Current profile: ${getCurrentProfile().name}`);
    }
  }

  /**
   * Initialize client (no-op for backward compatibility)
   *
   * BaseApiClient doesn't require initialization, but this method
   * is kept for backward compatibility with existing code.
   *
   * @deprecated No longer needed - client is ready to use immediately
   */
  async init(): Promise<void> {
    // No-op: BaseApiClient doesn't need initialization
    // Kept for backward compatibility
  }

  /**
   * Dispose client (no-op for backward compatibility)
   *
   * @deprecated No longer needed
   */
  async dispose(): Promise<void> {
    // No-op: BaseApiClient uses fetch, no context to dispose
  }

  /**
   * GET request with legacy response format
   *
   * Overrides BaseApiClient.get() to provide backward-compatible signature.
   *
   * @param endpoint - API endpoint
   * @param options - Request options (params, actionType)
   * @returns Response in legacy format
   */
  // @ts-expect-error - Intentionally different signature for backward compatibility
  async get<T = unknown>(
    endpoint: string,
    options: { params?: Record<string, string>; actionType?: ActionType } = {}
  ): Promise<ApiResponse<T>> {
    // Build URL with query params
    let url = endpoint;
    if (options.params) {
      const searchParams = new URLSearchParams(options.params);
      url = `${endpoint}?${searchParams.toString()}`;
    }

    // Use BaseApiClient's get method
    const response = await super.get<T>(url, this.buildHeaders());

    // Convert to legacy format
    return this.toLegacyResponse(response);
  }

  /**
   * POST request with legacy response format
   *
   * Overrides BaseApiClient.post() to provide backward-compatible signature.
   *
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param _options - Request options (kept for backward compatibility)
   * @returns Response in legacy format
   */
  // @ts-expect-error - Intentionally different signature for backward compatibility
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    _options: { actionType?: ActionType } = {}
  ): Promise<ApiResponse<T>> {
    const response = await super.post<T>(endpoint, data, this.buildHeaders());
    return this.toLegacyResponse(response);
  }

  /**
   * PUT request with legacy response format
   *
   * Overrides BaseApiClient.put() to provide backward-compatible signature.
   *
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param _options - Request options (kept for backward compatibility)
   * @returns Response in legacy format
   */
  // @ts-expect-error - Intentionally different signature for backward compatibility
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    _options: { actionType?: ActionType } = {}
  ): Promise<ApiResponse<T>> {
    const response = await super.put<T>(endpoint, data, this.buildHeaders());
    return this.toLegacyResponse(response);
  }

  /**
   * DELETE request with legacy response format
   *
   * Overrides BaseApiClient.delete() to provide backward-compatible signature.
   *
   * @param endpoint - API endpoint
   * @param _options - Request options (kept for backward compatibility)
   * @returns Response in legacy format
   */
  // @ts-expect-error - Intentionally different signature for backward compatibility
  async delete<T = unknown>(
    endpoint: string,
    _options: { actionType?: ActionType } = {}
  ): Promise<ApiResponse<T>> {
    const response = await super.delete<T>(endpoint, this.buildHeaders());
    return this.toLegacyResponse(response);
  }

  /**
   * Change language for subsequent requests
   *
   * @param language - 'ru' or 'ro'
   */
  async setLanguage(language: 'ru' | 'ro'): Promise<void> {
    this.language = language;
  }

  /**
   * Get current language
   */
  getLanguage(): 'ru' | 'ro' {
    return this.language;
  }

  /**
   * Enable/disable human-like behavior
   *
   * @deprecated Use API_PROFILE environment variable instead
   */
  setHumanLike(_enabled: boolean, _speed?: number): void {
    console.log(
      '⚠️ setHumanLike() is deprecated. Use API_PROFILE environment variable instead.'
    );
    console.log(`   Available profiles: stealth, normal, fast, burst`);
  }

  /**
   * Check if human-like behavior is enabled
   *
   * @deprecated Check getCurrentProfile() instead
   */
  isHumanLikeEnabled(): boolean {
    const profile = getCurrentProfile();
    // Consider 'stealth' and 'normal' as human-like
    return profile.name === 'stealth' || profile.name === 'normal';
  }

  /**
   * Get human-like behavior configuration
   *
   * @deprecated Use getCurrentProfile() instead
   */
  getHumanLikeConfig(): HumanBehaviorConfig {
    const profile = getCurrentProfile();
    return {
      enabled: profile.name !== 'burst',
      speedMultiplier: profile.requestDelay.max / 1000, // Convert to approx multiplier
    };
  }

  /**
   * Build headers with language setting
   */
  private buildHeaders(): Record<string, string> {
    return {
      'Accept-Language':
        this.language === 'ro' ? 'ro-RO,ro;q=0.9' : 'ru-RU,ru;q=0.9,ro;q=0.8',
      ...this.extraHeaders,
    };
  }

  /**
   * Convert BaseApiClient response to legacy format
   */
  private toLegacyResponse<T>(response: BaseApiResponse<T>): ApiResponse<T> {
    // Convert Headers to plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      statusText: this.getStatusText(response.status),
      data: response.data,
      headers,
    };
  }

  /**
   * Get status text from status code
   */
  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return statusTexts[status] || 'Unknown';
  }
}

/**
 * Factory for creating client (backward compatibility)
 *
 * @deprecated Simply use `new ApiClient(config)` - init() is no longer needed
 */
export async function createApiClient(
  config?: Partial<ApiClientConfig>
): Promise<ApiClient> {
  const client = new ApiClient(config);
  // init() is now a no-op, but we call it for compatibility
  await client.init();
  return client;
}

// Re-export ApiError from base client for convenience
export { ApiError } from '../clients/base.client';
export type { BaseApiResponse };

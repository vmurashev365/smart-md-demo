/**
 * API Configuration
 *
 * Centralized configuration for API testing.
 * All values can be overridden via environment variables.
 *
 * @module api-config
 */

import { BASE_URL } from './urls';

/**
 * API Base URL
 *
 * @default https://smart.md
 */
export const API_BASE_URL = process.env.API_BASE_URL || BASE_URL || 'https://smart.md';

/**
 * API Throttling Profile
 *
 * Options: stealth, normal, fast, burst
 * @default normal
 */
export const API_PROFILE = process.env.API_PROFILE || 'normal';

/**
 * Request timeout in milliseconds
 *
 * @default 30000
 */
export const API_REQUEST_TIMEOUT = parseInt(
  process.env.API_REQUEST_TIMEOUT || '30000',
  10
);

/**
 * Maximum retry attempts for failed requests
 *
 * @default 3
 */
export const API_MAX_RETRIES = parseInt(
  process.env.API_MAX_RETRIES || '3',
  10
);

/**
 * Enable verbose request logging
 *
 * @default false
 */
export const API_LOG_REQUESTS = process.env.API_LOG_REQUESTS === 'true';

/**
 * Disable all API delays (for unit testing)
 *
 * @default false
 */
export const DISABLE_API_DELAYS = process.env.DISABLE_API_DELAYS === 'true';

/**
 * API Endpoints
 *
 * Common API paths for Smart.md
 */
export const API_ENDPOINTS = {
  /** Search products */
  search: '/api/search',

  /** Product catalog */
  products: '/api/products',

  /** Product details by ID */
  productById: (id: string | number) => `/api/products/${id}`,

  /** Shopping cart */
  cart: '/api/cart',

  /** Add to cart */
  cartAdd: '/api/cart/add',

  /** Remove from cart */
  cartRemove: (itemId: string | number) => `/api/cart/remove/${itemId}`,

  /** Credit calculator */
  credit: '/api/credit/calculate',

  /** Credit offers for product */
  creditOffers: (productId: string | number) => `/api/credit/offers/${productId}`,

  /** Categories */
  categories: '/api/categories',

  /** Category products */
  categoryProducts: (categoryId: string | number) => `/api/categories/${categoryId}/products`,

  /** User authentication */
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    profile: '/api/auth/profile',
  },

  /** Localization */
  localization: '/api/localization',
};

/**
 * Default request headers
 */
export const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Accept-Language': 'ru,ro;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
};

/**
 * Full API configuration object
 */
export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  profile: API_PROFILE,
  timeout: API_REQUEST_TIMEOUT,
  maxRetries: API_MAX_RETRIES,
  logRequests: API_LOG_REQUESTS,
  disableDelays: DISABLE_API_DELAYS,
  endpoints: API_ENDPOINTS,
  defaultHeaders: DEFAULT_HEADERS,
};

/**
 * Get full URL for an endpoint
 *
 * @param endpoint - API endpoint path
 * @returns Full URL
 */
export function getApiUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

/**
 * Log current API configuration
 */
export function logApiConfig(): void {
  console.log('\n🔧 API Configuration:');
  console.log(`   Base URL: ${API_BASE_URL}`);
  console.log(`   Profile: ${API_PROFILE}`);
  console.log(`   Timeout: ${API_REQUEST_TIMEOUT}ms`);
  console.log(`   Max Retries: ${API_MAX_RETRIES}`);
  console.log(`   Logging: ${API_LOG_REQUESTS ? 'enabled' : 'disabled'}`);
  console.log('');
}

export default API_CONFIG;

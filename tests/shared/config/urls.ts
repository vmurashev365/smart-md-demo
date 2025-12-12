/**
 * URL Configuration for Smart.md
 *
 * Centralized URL management for the test framework.
 * Supports both Romanian (default) and Russian (/ru/) versions.
 */

export const BASE_URL = process.env.BASE_URL || 'https://smart.md';

/**
 * URL paths for Smart.md pages
 */
export const URLS = {
  /**
   * Base URLs
   */
  base: {
    ro: BASE_URL,
    ru: `${BASE_URL}/ru`,
  },

  /**
   * Home page
   */
  home: {
    ro: '/',
    ru: '/ru/',
  },

  /**
   * Search
   */
  search: {
    base: '/search',
    query: (q: string): string => `/search?q=${encodeURIComponent(q)}`,
    queryRu: (q: string): string => `/ru/search?q=${encodeURIComponent(q)}`,
  },

  /**
   * Category pages
   */
  categories: {
    phones: {
      main: '/telefoane',
      smartphones: '/telefoane/smartphone-uri',
      accessories: '/telefoane/accesorii-telefoane',
    },
    laptops: {
      main: '/laptop-uri-tablete',
      laptops: '/laptop-uri-tablete/laptop-uri',
      tablets: '/laptop-uri-tablete/tablete',
    },
    tv: {
      main: '/tv-audio-foto',
      televisions: '/tv-audio-foto/televizoare',
      audio: '/tv-audio-foto/audio',
    },
    appliances: {
      main: '/electrocasnice',
      large: '/electrocasnice/electrocasnice-mari',
      small: '/electrocasnice/electrocasnice-mici',
    },
    gadgets: {
      main: '/gadgeturi',
      smartwatches: '/gadgeturi/smartwatch-uri',
      accessories: '/gadgeturi/accesorii',
    },
  },

  /**
   * Shopping cart
   */
  cart: {
    page: '/cart',
    checkout: '/checkout',
  },

  /**
   * User account
   */
  account: {
    login: '/login',
    register: '/register',
    profile: '/account',
    orders: '/account/orders',
    wishlist: '/account/wishlist',
  },

  /**
   * Static pages
   */
  static: {
    about: '/about',
    contact: '/contact',
    delivery: '/delivery',
    payment: '/payment',
    warranty: '/warranty',
    terms: '/terms',
    privacy: '/privacy',
  },

  /**
   * API endpoints (for potential API testing)
   */
  api: {
    search: '/api/search',
    products: '/api/products',
    cart: '/api/cart',
    credit: '/api/credit/calculate',
  },
};

/**
 * Helper function to get full URL
 * @param path - Relative path
 * @param lang - Language ('ro' | 'ru')
 * @returns Full URL
 */
export function getFullUrl(path: string, lang: 'ro' | 'ru' = 'ro'): string {
  const baseUrl = lang === 'ru' ? URLS.base.ru : URLS.base.ro;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If already contains /ru/ prefix, don't add it again
  if (lang === 'ru' && !normalizedPath.startsWith('/ru/')) {
    return `${BASE_URL}/ru${normalizedPath}`;
  }
  
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Helper function to extract path from full URL
 * @param url - Full URL
 * @returns Path without domain
 */
export function extractPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    // If not a valid URL, assume it's already a path
    return url;
  }
}

/**
 * Helper function to check if URL is Russian version
 * @param url - URL to check
 * @returns true if Russian version
 */
export function isRussianUrl(url: string): boolean {
  return url.includes('/ru/') || url.includes('/ru');
}

/**
 * Helper function to convert Romanian URL to Russian
 * @param url - Romanian URL
 * @returns Russian URL
 */
export function toRussianUrl(url: string): string {
  const path = extractPath(url);
  if (isRussianUrl(path)) {
    return url;
  }
  return getFullUrl(path, 'ru');
}

/**
 * Helper function to convert Russian URL to Romanian
 * @param url - Russian URL
 * @returns Romanian URL
 */
export function toRomanianUrl(url: string): string {
  return url.replace('/ru/', '/').replace('/ru', '/');
}

export default URLS;

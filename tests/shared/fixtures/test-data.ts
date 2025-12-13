/**
 * Test Data Fixtures
 *
 * Centralized test data for Smart.md E2E tests.
 * Updated with stable product identifiers and URL patterns.
 *
 * @updated December 2025
 */

/**
 * Primary test products with stable identification
 * Use urlPattern for matching, not exact text
 */
export const TEST_PRODUCTS = {
  /**
   * Primary product for demo scenarios
   * Chosen as stable, always in stock
   */
  primary: {
    searchTerm: 'iPhone 15',
    alternativeSearchTerms: ['iPhone', 'Apple iPhone', 'smartphone Apple'],
    urlPattern: /iphone.*15|iphone-15/i,
    minPriceForCredit: 15000,
    expectedBrand: 'Apple',
  },

  /**
   * Budget product for cart tests
   */
  budget: {
    searchTerm: 'cablu USB',
    alternativeSearchTerms: ['cablu', 'USB cable', 'кабель USB'],
    urlPattern: /cablu|usb|cable/i,
    maxExpectedPrice: 500,
  },

  /**
   * Expensive product for credit test
   */
  expensive: {
    searchTerm: 'MacBook Pro',
    alternativeSearchTerms: ['MacBook', 'Apple MacBook', 'laptop Apple'],
    urlPattern: /macbook/i,
    minPriceForCredit: 25000,
  },
};

/**
 * Categories with multiple URL patterns for stability
 */
export const TEST_CATEGORIES = {
  smartphones: {
    name: 'Smartphone',
    urlPatterns: ['/smartphone', '/telefoane', '/phones', '/telefon'],
    menuItems: ['Smartphone', 'Telefoane', 'Смартфоны', 'Phones'],
  },
  gadgets: {
    name: 'Gadgets',
    urlPatterns: ['/gadget', '/gadgeturi', '/accessories'],
    menuItems: ['Gadgeturi', 'Gadgets', 'Гаджеты', 'Accesorii'],
  },
  laptops: {
    name: 'Laptops',
    urlPatterns: ['/laptop', '/laptopuri', '/notebooks'],
    menuItems: ['Laptop-uri', 'Laptops', 'Ноутбуки'],
  },
};

/**
 * Brands for filtering with multiple match values
 */
export const TEST_BRANDS = {
  apple: {
    name: 'Apple',
    filterValues: ['Apple', 'apple', 'APPLE'],
  },
  samsung: {
    name: 'Samsung',
    filterValues: ['Samsung', 'samsung', 'SAMSUNG'],
  },
  xiaomi: {
    name: 'Xiaomi',
    filterValues: ['Xiaomi', 'xiaomi', 'XIAOMI', 'Redmi'],
  },
};

/**
 * Search queries for testing
 */
export const SEARCH_QUERIES = {
  // Popular products
  iphone: 'iPhone 15',
  samsung: 'Samsung Galaxy',
  macbook: 'MacBook Pro',
  xiaomi: 'Xiaomi Redmi',

  // Categories
  smartphone: 'smartphone',
  laptop: 'laptop',
  tv: 'televizor',
  tablet: 'tablet',

  // Romanian specific
  telefon: 'telefon',
  calculator: 'calculator',

  // Russian specific
  telefonRu: 'телефон',
  televizorRu: 'телевизор',

  // Edge cases
  empty: '',
  special: 'iPhone & Samsung',
  longQuery: 'Samsung Galaxy S24 Ultra 512GB Black',
  noResults: 'xyz123nonexistent',
};

/**
 * Product names for validation
 */
export const PRODUCT_NAMES = {
  apple: ['iPhone', 'MacBook', 'iPad', 'Apple Watch', 'AirPods'],
  samsung: ['Samsung', 'Galaxy'],
  xiaomi: ['Xiaomi', 'Redmi', 'POCO', 'Mi'],
  huawei: ['Huawei', 'Honor'],
};

/**
 * Category paths
 */
export const CATEGORY_PATHS = {
  smartphones: 'Telefoane > Smartphone-uri',
  laptops: 'Laptop-uri și Tablete > Laptop-uri',
  tablets: 'Laptop-uri și Tablete > Tablete',
  tvs: 'TV, Audio, Foto > Televizoare',
  gadgets: 'Gadgeturi',
  appliances: 'Electrocasnice',
};

/**
 * Credit providers in Moldova
 */
export const CREDIT_PROVIDERS = [
  'IuteCredit',
  'Microinvest',
  'EasyCredit',
  'Iute',
  'Moldindconbank',
  'MicroB',
  'Prime Capital',
];

/**
 * Credit terms (months)
 */
export const CREDIT_TERMS = [
  '3 luni',
  '6 luni',
  '9 luni',
  '12 luni',
  '18 luni',
  '24 luni',
  '36 luni',
];

/**
 * Sort options
 */
export const SORT_OPTIONS = {
  ro: {
    priceAsc: 'Prețul: mic spre mare',
    priceDesc: 'Prețul: mare spre mic',
    popular: 'Popularitate',
    newest: 'Noutăți',
    rating: 'Rating',
  },
  ru: {
    priceAsc: 'Цена: по возрастанию',
    priceDesc: 'Цена: по убыванию',
    popular: 'Популярность',
    newest: 'Новинки',
    rating: 'Рейтинг',
  },
};

/**
 * Brand names for filtering
 */
export const BRANDS = {
  phones: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'OnePlus', 'Google', 'Motorola'],
  laptops: ['Apple', 'ASUS', 'Lenovo', 'HP', 'Dell', 'Acer', 'MSI'],
  tvs: ['Samsung', 'LG', 'Sony', 'Philips', 'Xiaomi', 'TCL', 'Hisense'],
};

/**
 * UI text expectations
 * @deprecated Use UI_TEXT from language-utils.ts instead (Single Source of Truth)
 * This export is kept for backward compatibility only
 */
import { UI_TEXT as UNIFIED_UI_TEXT } from '../utils/language-utils';
export const UI_TEXT = UNIFIED_UI_TEXT;

/**
 * Test user credentials (if needed)
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  phone: '+373 69 123 456',
  name: 'Test User',
  address: {
    city: 'Chișinău',
    street: 'Strada Test, 123',
    postalCode: 'MD-2000',
  },
};

/**
 * Price thresholds
 */
export const PRICE_THRESHOLDS = {
  creditMinimum: 5000, // MDL - minimum for credit options
  expensiveProduct: 20000, // MDL - expensive product threshold
  maxPrice: 500000, // MDL - maximum realistic price
};

/**
 * Expected product counts
 */
export const EXPECTED_COUNTS = {
  minSearchResults: 3,
  minCategoryProducts: 10,
  minCreditProviders: 2,
};

/**
 * Cart test data
 */
export const CART_DATA = {
  maxQuantity: 10,
  defaultQuantity: 1,
};

export default {
  SEARCH_QUERIES,
  PRODUCT_NAMES,
  CATEGORY_PATHS,
  CREDIT_PROVIDERS,
  CREDIT_TERMS,
  SORT_OPTIONS,
  BRANDS,
  UI_TEXT, // Re-exported from language-utils.ts (Single Source of Truth)
  TEST_USER,
  PRICE_THRESHOLDS,
  EXPECTED_COUNTS,
  CART_DATA,
};

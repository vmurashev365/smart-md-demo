/**
 * Test Data Fixtures
 *
 * Centralized test data for Smart.md E2E tests.
 */

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
 */
export const UI_TEXT = {
  ro: {
    addToCart: 'Adaugă în coș',
    buyCredit: 'Cumpără în credit',
    emptyCart: 'Coșul este gol',
    search: 'Căutare',
    filters: 'Filtre',
    cart: 'Coș',
    home: 'Acasă',
    inStock: 'În stoc',
    outOfStock: 'Lipsă din stoc',
  },
  ru: {
    addToCart: 'Добавить в корзину',
    buyCredit: 'Купить в кредит',
    emptyCart: 'Корзина пуста',
    search: 'Поиск',
    filters: 'Фильтры',
    cart: 'Корзина',
    home: 'Главная',
    inStock: 'В наличии',
    outOfStock: 'Нет в наличии',
  },
};

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
  UI_TEXT,
  TEST_USER,
  PRICE_THRESHOLDS,
  EXPECTED_COUNTS,
  CART_DATA,
};

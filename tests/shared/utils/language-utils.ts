/**
 * Language Utilities for Smart.md Testing
 *
 * Functions for handling Romanian/Russian language switching
 * and content validation.
 */

/**
 * Supported languages
 */
export type Language = 'RO' | 'RU';

/**
 * Language configuration
 */
export const LANGUAGES = {
  RO: {
    code: 'ro',
    locale: 'ro-MD',
    name: 'Română',
    urlPrefix: '',
    flag: '🇲🇩',
  },
  RU: {
    code: 'ru',
    locale: 'ru-MD',
    name: 'Русский',
    urlPrefix: '/ru',
    flag: '🇷🇺',
  },
};

/**
 * Common UI text translations
 * Used for validating language switch
 */
export const UI_TRANSLATIONS = {
  addToCart: {
    RO: 'Adaugă în coș',
    RU: 'Добавить в корзину',
  },
  buyNow: {
    RO: 'Cumpără acum',
    RU: 'Купить сейчас',
  },
  buyOnCredit: {
    RO: 'Cumpără în credit',
    RU: 'Купить в кредит',
  },
  cart: {
    RO: 'Coș',
    RU: 'Корзина',
  },
  emptyCart: {
    RO: 'Coșul este gol',
    RU: 'Корзина пуста',
  },
  search: {
    RO: 'Căutare',
    RU: 'Поиск',
  },
  filters: {
    RO: 'Filtre',
    RU: 'Фильтры',
  },
  sortBy: {
    RO: 'Sortează după',
    RU: 'Сортировать по',
  },
  priceAsc: {
    RO: 'Prețul: mic spre mare',
    RU: 'Цена: по возрастанию',
  },
  priceDesc: {
    RO: 'Prețul: mare spre mic',
    RU: 'Цена: по убыванию',
  },
  brand: {
    RO: 'Brand',
    RU: 'Бренд',
  },
  price: {
    RO: 'Preț',
    RU: 'Цена',
  },
  months: {
    RO: 'luni',
    RU: 'месяцев',
  },
  monthlyPayment: {
    RO: 'Plata lunară',
    RU: 'Ежемесячный платеж',
  },
  inStock: {
    RO: 'În stoc',
    RU: 'В наличии',
  },
  outOfStock: {
    RO: 'Lipsă',
    RU: 'Нет в наличии',
  },
  home: {
    RO: 'Acasă',
    RU: 'Главная',
  },
  categories: {
    RO: 'Categorii',
    RU: 'Категории',
  },
  phones: {
    RO: 'Telefoane',
    RU: 'Телефоны',
  },
  smartphones: {
    RO: 'Smartphone-uri',
    RU: 'Смартфоны',
  },
  laptops: {
    RO: 'Laptop-uri',
    RU: 'Ноутбуки',
  },
  tvs: {
    RO: 'Televizoare',
    RU: 'Телевизоры',
  },
  gadgets: {
    RO: 'Gadgeturi',
    RU: 'Гаджеты',
  },
};

/**
 * Get text translation for a key
 *
 * @param key - Translation key
 * @param lang - Language
 * @returns Translated text
 */
export function getTranslation(key: keyof typeof UI_TRANSLATIONS, lang: Language): string {
  return UI_TRANSLATIONS[key][lang];
}

/**
 * Detect language from URL
 *
 * @param url - URL to check
 * @returns Detected language
 */
export function detectLanguageFromUrl(url: string): Language {
  return url.includes('/ru/') || url.endsWith('/ru') ? 'RU' : 'RO';
}

/**
 * Get URL prefix for language
 *
 * @param lang - Language
 * @returns URL prefix
 */
export function getLanguageUrlPrefix(lang: Language): string {
  return LANGUAGES[lang].urlPrefix;
}

/**
 * Convert URL to different language version
 *
 * @param url - Original URL
 * @param targetLang - Target language
 * @returns Converted URL
 */
export function convertUrlToLanguage(url: string, targetLang: Language): string {
  const currentLang = detectLanguageFromUrl(url);

  if (currentLang === targetLang) {
    return url;
  }

  if (targetLang === 'RU') {
    // Add /ru prefix
    if (url.includes('/ru')) {
      return url;
    }
    // Insert /ru after domain
    return url.replace(/(https?:\/\/[^\/]+)(\/.*)/, '$1/ru$2');
  } else {
    // Remove /ru prefix
    return url.replace('/ru/', '/').replace('/ru', '/');
  }
}

/**
 * Check if text contains Cyrillic characters (Russian)
 *
 * @param text - Text to check
 * @returns true if contains Cyrillic
 */
export function containsCyrillic(text: string): boolean {
  return /[а-яА-ЯёЁ]/.test(text);
}

/**
 * Check if text contains Romanian diacritics
 *
 * @param text - Text to check
 * @returns true if contains Romanian diacritics
 */
export function containsRomanianDiacritics(text: string): boolean {
  return /[ăîâșțĂÎÂȘȚ]/.test(text);
}

/**
 * Detect probable language of text
 *
 * @param text - Text to analyze
 * @returns Probable language
 */
export function detectTextLanguage(text: string): Language {
  if (containsCyrillic(text)) {
    return 'RU';
  }
  return 'RO';
}

/**
 * Validate that page content matches expected language
 *
 * @param texts - Array of texts to check
 * @param expectedLang - Expected language
 * @returns true if at least 80% of texts match expected language
 */
export function validatePageLanguage(texts: string[], expectedLang: Language): boolean {
  if (texts.length === 0) return true;

  const matchCount = texts.filter(text => {
    const detectedLang = detectTextLanguage(text);
    return detectedLang === expectedLang;
  }).length;

  const matchPercent = (matchCount / texts.length) * 100;
  return matchPercent >= 80;
}

/**
 * Get navigation menu items for language
 *
 * @param lang - Language
 * @returns Array of expected menu items
 */
export function getNavigationMenuItems(lang: Language): string[] {
  if (lang === 'RU') {
    return ['Телефоны', 'Ноутбуки', 'Телевизоры', 'Электроника', 'Гаджеты'];
  }
  return ['Telefoane', 'Laptop-uri', 'Televizoare', 'Electronice', 'Gadgeturi'];
}

/**
 * Normalize text for language-agnostic comparison
 * Removes diacritics and converts to lowercase
 *
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Check if two texts are equivalent (language-agnostic)
 *
 * @param text1 - First text
 * @param text2 - Second text
 * @returns true if texts are equivalent
 */
export function textsEquivalent(text1: string, text2: string): boolean {
  return normalizeText(text1) === normalizeText(text2);
}

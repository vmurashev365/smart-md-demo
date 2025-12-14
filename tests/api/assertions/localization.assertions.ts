/**
 * Localization Assertions - business invariants for localization (RU/RO)
 */

import { expect } from '@playwright/test';
import { SearchResult, SearchProduct } from '../actions/search.actions';
import { Product, Category } from '../actions/catalog.actions';

// === LANGUAGE PATTERNS ===

const CYRILLIC_PATTERN = /[\u0400-\u04FF]/;  // Cyrillic (Russian)
const LATIN_RO_PATTERN = /[ăâîșțĂÂÎȘȚ]/;    // Romanian-specific symbols

// === LANGUAGE DETECTION ===

/**
 * Определить язык текста
 */
export function detectTextLanguage(text: string): 'ru' | 'ro' | 'unknown' {
    if (CYRILLIC_PATTERN.test(text)) return 'ru';
    if (LATIN_RO_PATTERN.test(text)) return 'ro';
    return 'unknown';
}

/**
 * Проверить, что текст на русском
 */
export function expectTextInRussian(text: string, context?: string): void {
    const detected = detectTextLanguage(text);
    expect(
        detected,
        `${context || 'Текст'} должен быть на русском: "${text.substring(0, 50)}..."`
    ).toBe('ru');
}

/**
 * Проверить, что текст на румынском
 */
export function expectTextInRomanian(text: string, context?: string): void {
    // Romanian text may not contain specific characters,
    // so we check that it is NOT in Russian
    const detected = detectTextLanguage(text);
    expect(
        detected,
        `${context || 'Текст'} должен быть на румынском: "${text.substring(0, 50)}..."`
    ).not.toBe('ru');
}

// === PRODUCTS ===

/**
 * Проверить локализацию названия товара (русский)
 */
export function expectProductTitleInRussian(product: Product | SearchProduct): void {
    // Product names often contain Latin text (brands, models)
    // Check that at least part of the text is in Russian
    const title = product.title;
    const hasCyrillic = CYRILLIC_PATTERN.test(title);
    
    expect(
        hasCyrillic,
        `Название товара должно содержать русский текст: "${title}"`
    ).toBe(true);
}

/**
 * Проверить локализацию названия товара (румынский)
 */
export function expectProductTitleInRomanian(product: Product | SearchProduct): void {
    const title = product.title;
    const hasCyrillic = CYRILLIC_PATTERN.test(title);
    
    expect(
        hasCyrillic,
        `Название товара не должно содержать русский текст: "${title}"`
    ).toBe(false);
}

/**
 * Проверить, что описание товара на русском
 */
export function expectProductDescriptionInRussian(product: Product): void {
    if (product.description) {
        expectTextInRussian(product.description, 'Описание товара');
    }
}

/**
 * Проверить, что описание товара на румынском
 */
export function expectProductDescriptionInRomanian(product: Product): void {
    if (product.description) {
        expectTextInRomanian(product.description, 'Описание товара');
    }
}

// === CATEGORIES ===

/**
 * Проверить локализацию названия категории (русский)
 */
export function expectCategoryNameInRussian(category: Category): void {
    expectTextInRussian(category.name, 'Название категории');
}

/**
 * Проверить локализацию названия категории (румынский)
 */
export function expectCategoryNameInRomanian(category: Category): void {
    expectTextInRomanian(category.name, 'Название категории');
}

/**
 * Проверить локализацию всех категорий (русский)
 */
export function expectAllCategoriesInRussian(categories: Category[]): void {
    for (const category of categories) {
        expectCategoryNameInRussian(category);
    }
}

/**
 * Проверить локализацию всех категорий (румынский)
 */
export function expectAllCategoriesInRomanian(categories: Category[]): void {
    for (const category of categories) {
        expectCategoryNameInRomanian(category);
    }
}

// === SEARCH ===

/**
 * Проверить локализацию результатов поиска (русский)
 */
export function expectSearchResultsInRussian(result: SearchResult): void {
    // Check at least half of the products
    const productsToCheck = result.products.slice(0, Math.max(5, result.products.length / 2));
    let russianCount = 0;
    
    for (const product of productsToCheck) {
        if (CYRILLIC_PATTERN.test(product.title)) {
            russianCount++;
        }
    }
    
    expect(
        russianCount / productsToCheck.length,
        'Большинство результатов поиска должны быть на русском'
    ).toBeGreaterThan(0.5);
}

/**
 * Проверить локализацию результатов поиска (румынский)
 */
export function expectSearchResultsInRomanian(result: SearchResult): void {
    const productsToCheck = result.products.slice(0, Math.max(5, result.products.length / 2));
    let russianCount = 0;
    
    for (const product of productsToCheck) {
        if (CYRILLIC_PATTERN.test(product.title)) {
            russianCount++;
        }
    }
    
    expect(
        russianCount / productsToCheck.length,
        'Результаты поиска не должны быть на русском (ожидается румынский)'
    ).toBeLessThan(0.3);
}

// === CURRENCY AND FORMATTING ===

/**
 * Проверить формат валюты (MDL для Молдовы)
 */
export function expectCurrencyMDL(currency?: string): void {
    expect(
        currency?.toUpperCase(),
        'Валюта должна быть MDL'
    ).toBe('MDL');
}

/**
 * Проверить, что цена в разумных пределах для MDL
 */
export function expectPriceInMDLRange(price: number): void {
    // Reasonable range for products in MDL
    expect(price, 'Цена должна быть положительной').toBeGreaterThan(0);
    expect(price, 'Цена не должна превышать 1,000,000 MDL').toBeLessThan(1_000_000);
}

// === LOCALIZATION CONSISTENCY ===

/**
 * Проверить, что два API ответа на одном языке
 */
export function expectSameLanguage(
    text1: string,
    text2: string,
    context?: string
): void {
    const lang1 = detectTextLanguage(text1);
    const lang2 = detectTextLanguage(text2);
    
    expect(
        lang1,
        `${context || 'Тексты'} должны быть на одном языке`
    ).toBe(lang2);
}

/**
 * Проверить консистентность локализации товара
 */
export function expectProductLocalizationConsistent(
    product: Product,
    expectedLanguage: 'ru' | 'ro'
): void {
    if (expectedLanguage === 'ru') {
        expectProductTitleInRussian(product);
        if (product.description) {
            expectProductDescriptionInRussian(product);
        }
    } else {
        expectProductTitleInRomanian(product);
        if (product.description) {
            expectProductDescriptionInRomanian(product);
        }
    }
}

/**
 * Проверить, что смена языка действительно изменила контент
 */
export function expectLanguageChangeAffectedContent(
    contentRu: string,
    contentRo: string
): void {
    expect(
        contentRu,
        'Контент на разных языках должен отличаться'
    ).not.toBe(contentRo);
    
    expectTextInRussian(contentRu, 'Русская версия');
    expectTextInRomanian(contentRo, 'Румынская версия');
}

/**
 * Search Assertions - бизнес-инварианты поиска
 * 
 * Только assertions, без API вызовов.
 * Проверяют бизнес-правила, не HTTP детали.
 */

import { expect } from '@playwright/test';
import { SearchResult, SearchProduct, SearchSuggestion } from '../actions/search.actions';

// === SEARCH RESULTS ===

/**
 * Проверить, что поиск вернул релевантные результаты
 */
export function expectSearchResultsRelevant(result: SearchResult, query: string): void {
    const queryLower = query.toLowerCase();
    const relevantProducts = result.products.filter(p => 
        p.title.toLowerCase().includes(queryLower) ||
        p.brand?.toLowerCase().includes(queryLower) ||
        p.category?.toLowerCase().includes(queryLower)
    );

    expect(
        relevantProducts.length,
        `Поиск "${query}" должен вернуть релевантные товары`
    ).toBeGreaterThan(0);
}

/**
 * Проверить, что поиск вернул результаты
 */
export function expectSearchHasResults(result: SearchResult): void {
    expect(result.products.length, 'Поиск должен вернуть товары').toBeGreaterThan(0);
    expect(result.total, 'Общее количество должно быть > 0').toBeGreaterThan(0);
}

/**
 * Проверить, что поиск пустой (нет результатов)
 */
export function expectSearchEmpty(result: SearchResult): void {
    expect(result.products.length, 'Поиск должен быть пустым').toBe(0);
}

/**
 * Проверить структуру результатов поиска
 */
export function expectSearchResultStructureValid(result: SearchResult): void {
    expect(result).toHaveProperty('products');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.products)).toBe(true);
    expect(typeof result.total).toBe('number');
}

/**
 * Проверить, что все товары в результатах имеют обязательные поля
 */
export function expectAllProductsHaveRequiredFields(products: SearchProduct[]): void {
    for (const product of products) {
        expect(product.id, 'Товар должен иметь ID').toBeDefined();
        expect(product.title, 'Товар должен иметь название').toBeTruthy();
        expect(typeof product.price, 'Цена должна быть числом').toBe('number');
        expect(product.price, 'Цена должна быть положительной').toBeGreaterThan(0);
    }
}

/**
 * Проверить, что товары соответствуют ценовому диапазону
 */
export function expectProductsInPriceRange(
    products: SearchProduct[],
    minPrice: number,
    maxPrice: number
): void {
    for (const product of products) {
        expect(
            product.price,
            `Цена ${product.price} должна быть >= ${minPrice}`
        ).toBeGreaterThanOrEqual(minPrice);
        
        expect(
            product.price,
            `Цена ${product.price} должна быть <= ${maxPrice}`
        ).toBeLessThanOrEqual(maxPrice);
    }
}

/**
 * Проверить, что товары принадлежат бренду
 */
export function expectProductsFromBrand(products: SearchProduct[], brand: string): void {
    const brandLower = brand.toLowerCase();
    
    for (const product of products) {
        const productBrand = product.brand?.toLowerCase() || '';
        const titleHasBrand = product.title.toLowerCase().includes(brandLower);
        
        expect(
            productBrand.includes(brandLower) || titleHasBrand,
            `Товар "${product.title}" должен быть бренда ${brand}`
        ).toBe(true);
    }
}

// === SUGGESTIONS ===

/**
 * Проверить, что подсказки релевантны запросу
 */
export function expectSuggestionsRelevant(suggestions: SearchSuggestion[], query: string): void {
    const queryLower = query.toLowerCase();
    
    expect(suggestions.length, 'Должны быть подсказки').toBeGreaterThan(0);
    
    const relevantSuggestions = suggestions.filter(s =>
        s.text.toLowerCase().includes(queryLower)
    );
    
    expect(
        relevantSuggestions.length,
        `Хотя бы одна подсказка должна содержать "${query}"`
    ).toBeGreaterThan(0);
}

/**
 * Проверить структуру подсказок
 */
export function expectSuggestionsStructureValid(suggestions: SearchSuggestion[]): void {
    for (const suggestion of suggestions) {
        expect(suggestion.text, 'Подсказка должна иметь текст').toBeTruthy();
        expect(
            ['product', 'category', 'brand'].includes(suggestion.type),
            'Тип подсказки должен быть валидным'
        ).toBe(true);
    }
}

// === PAGINATION ===

/**
 * Проверить корректность пагинации
 */
export function expectPaginationCorrect(
    result: SearchResult,
    expectedPage: number,
    expectedPageSize: number
): void {
    expect(result.page, `Страница должна быть ${expectedPage}`).toBe(expectedPage);
    expect(
        result.products.length,
        `Количество товаров не должно превышать ${expectedPageSize}`
    ).toBeLessThanOrEqual(expectedPageSize);
}

/**
 * Проверить, что результаты разных страниц не пересекаются
 */
export function expectNoDuplicatesBetweenPages(
    page1Products: SearchProduct[],
    page2Products: SearchProduct[]
): void {
    const page1Ids = new Set(page1Products.map(p => p.id));
    const duplicates = page2Products.filter(p => page1Ids.has(p.id));
    
    expect(
        duplicates.length,
        'Товары на разных страницах не должны повторяться'
    ).toBe(0);
}

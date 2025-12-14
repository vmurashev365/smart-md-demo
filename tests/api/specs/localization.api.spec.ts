/**
 * Localization API Spec - регрессионные тесты локализации (RU/RO)
 */

import { test, expect } from '@playwright/test';
import { createApiClient, ApiClient } from '../client/apiClient';

// Actions
import { searchProducts } from '../actions/search.actions';
import { getCategories, getCategoryProducts, getProductById } from '../actions/catalog.actions';

// Assertions
import {
    expectTextInRussian,
    expectTextInRomanian,
    expectProductTitleInRussian,
    expectProductTitleInRomanian,
    expectCategoryNameInRussian,
    expectCategoryNameInRomanian,
    expectSearchResultsInRussian,
    expectSearchResultsInRomanian,
    expectCurrencyMDL,
    expectLanguageChangeAffectedContent
} from '../assertions/localization.assertions';

test.describe('Localization API', () => {
    let apiRu: ApiClient;
    let apiRo: ApiClient;

    test.beforeAll(async () => {
        // Create two clients with different languages
        apiRu = await createApiClient({ language: 'ru' });
        apiRo = await createApiClient({ language: 'ro' });
    });

    test.afterAll(async () => {
        await apiRu.dispose();
        await apiRo.dispose();
    });

    test.describe('Russian Localization', () => {
        test('should return categories in Russian', async () => {
            const categories = await getCategories(apiRu);
            
            expect(categories.length).toBeGreaterThan(0);
            
            // Check the first few categories
            for (const category of categories.slice(0, 5)) {
                expectCategoryNameInRussian(category);
            }
        });

        test('should return products in Russian', async () => {
            const catalog = await getCategoryProducts(apiRu, 'smartphone', { limit: 5 });
            
            for (const product of catalog.products) {
                expectProductTitleInRussian(product);
            }
        });

        test('should return search results in Russian', async () => {
            const result = await searchProducts(apiRu, 'телефон');
            
            expectSearchResultsInRussian(result);
        });

        test('should use MDL currency', async () => {
            const catalog = await getCategoryProducts(apiRu, 'smartphone', { limit: 1 });
            
            expectCurrencyMDL(catalog.products[0]?.currency);
        });
    });

    test.describe('Romanian Localization', () => {
        test('should return categories in Romanian', async () => {
            const categories = await getCategories(apiRo);
            
            expect(categories.length).toBeGreaterThan(0);
            
            for (const category of categories.slice(0, 5)) {
                expectCategoryNameInRomanian(category);
            }
        });

        test('should return products in Romanian', async () => {
            const catalog = await getCategoryProducts(apiRo, 'smartphone', { limit: 5 });
            
            for (const product of catalog.products) {
                expectProductTitleInRomanian(product);
            }
        });

        test('should return search results in Romanian', async () => {
            const result = await searchProducts(apiRo, 'telefon');
            
            expectSearchResultsInRomanian(result);
        });
    });

    test.describe('Language Consistency', () => {
        test('should return different content for different languages', async () => {
            const categoriesRu = await getCategories(apiRu);
            const categoriesRo = await getCategories(apiRo);
            
            // Find the same category by ID or slug
            if (categoriesRu.length > 0 && categoriesRo.length > 0) {
                const catRu = categoriesRu[0];
                const catRo = categoriesRo.find(c => c.id === catRu.id || c.slug === catRu.slug);
                
                if (catRo) {
                    expectLanguageChangeAffectedContent(catRu.name, catRo.name);
                }
            }
        });

        test('should return same product structure for both languages', async () => {
            const catalogRu = await getCategoryProducts(apiRu, 'smartphone', { limit: 1 });
            const catalogRo = await getCategoryProducts(apiRo, 'smartphone', { limit: 1 });
            
            const productRu = catalogRu.products[0];
            const productRo = catalogRo.products[0];
            
            if (productRu && productRo) {
                // Structure should be the same
                expect(Object.keys(productRu).sort()).toEqual(Object.keys(productRo).sort());
                
                // Prices should be the same
                expect(productRu.price).toBe(productRo.price);
            }
        });

        test('should maintain price consistency across languages', async () => {
            const catalogRu = await getCategoryProducts(apiRu, 'smartphone', { limit: 5 });
            
            for (const productRu of catalogRu.products) {
                const productRo = await getProductById(apiRo, productRu.id);
                
                if (productRo) {
                    expect(
                        productRu.price,
                        `Цена товара ${productRu.id} должна быть одинаковой на обоих языках`
                    ).toBe(productRo.price);
                }
            }
        });
    });

    test.describe('Search Localization', () => {
        test('should find products by Russian query', async () => {
            const result = await searchProducts(apiRu, 'смартфон');
            
            expect(result.products.length).toBeGreaterThan(0);
        });

        test('should find products by Romanian query', async () => {
            const result = await searchProducts(apiRo, 'smartphone');
            
            expect(result.products.length).toBeGreaterThan(0);
        });

        test('should find same products regardless of language', async () => {
            // Use brand that's the same in both languages
            const resultRu = await searchProducts(apiRu, 'Samsung');
            const resultRo = await searchProducts(apiRo, 'Samsung');
            
            // Result count should be approximately the same
            const diff = Math.abs(resultRu.total - resultRo.total);
            const tolerance = Math.max(resultRu.total, resultRo.total) * 0.1; // 10% tolerance
            
            expect(diff).toBeLessThanOrEqual(tolerance);
        });
    });

    test.describe('Language Switch', () => {
        test('should switch language dynamically', async () => {
            // Start with Russian
            const apiDynamic = await createApiClient({ language: 'ru' });
            
            const categoriesRu = await getCategories(apiDynamic);
            expectCategoryNameInRussian(categoriesRu[0]);
            
            // Switch to Romanian
            await apiDynamic.setLanguage('ro');
            
            const categoriesRo = await getCategories(apiDynamic);
            expectCategoryNameInRomanian(categoriesRo[0]);
            
            await apiDynamic.dispose();
        });
    });
});

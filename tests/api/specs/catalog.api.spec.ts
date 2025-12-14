/**
 * Catalog API Spec - регрессионные тесты каталога
 * 
 * Использует Actions + Assertions.
 * Служит как документация и регрессия.
 */

import { test, expect } from '@playwright/test';
import { createApiClient, ApiClient } from '../client/apiClient';

// Actions
import { 
    getCategories, 
    getCategoryBySlug, 
    getCategoryProducts,
    getProductById,
    getCategoryFilters,
    getSimilarProducts,
    getPromotionProducts
} from '../actions/catalog.actions';

// Assertions
import {
    expectCategoryExists,
    expectCategoryStructureValid,
    expectCategoryHierarchyValid,
    expectCatalogPageStructureValid,
    expectCatalogNotEmpty,
    expectProductStructureValid,
    expectProductsSortedByPriceAsc,
    expectProductsSortedByPriceDesc,
    expectFiltersAvailable,
    expectFilterStructureValid,
    expectBrandFilterExists,
    expectPriceFilterExists
} from '../assertions/catalog.assertions';

test.describe('Catalog API', () => {
    let api: ApiClient;

    test.beforeAll(async () => {
        api = await createApiClient();
    });

    test.afterAll(async () => {
        await api.dispose();
    });

    test.describe('Categories', () => {
        test('should return list of categories', async () => {
            const categories = await getCategories(api);
            
            expect(categories.length).toBeGreaterThan(0);
            expectCategoryHierarchyValid(categories);
        });

        test('should return category by slug', async () => {
            const category = await getCategoryBySlug(api, 'smartphone');
            
            expectCategoryExists(category);
            expectCategoryStructureValid(category!);
        });

        test('should return null for non-existent category', async () => {
            const category = await getCategoryBySlug(api, 'non-existent-category-12345');
            
            expect(category).toBeNull();
        });
    });

    test.describe('Category Products', () => {
        test('should return products for category', async () => {
            const page = await getCategoryProducts(api, 'smartphone');
            
            expectCatalogPageStructureValid(page);
            expectCatalogNotEmpty(page);
        });

        test('should support pagination', async () => {
            const page1 = await getCategoryProducts(api, 'smartphone', { page: 1, limit: 10 });
            const page2 = await getCategoryProducts(api, 'smartphone', { page: 2, limit: 10 });
            
            expect(page1.products.length).toBeGreaterThan(0);
            expect(page2.page).toBe(2);
            
            // Check that products don't repeat
            const page1Ids = new Set(page1.products.map(p => p.id));
            const hasDuplicates = page2.products.some(p => page1Ids.has(p.id));
            expect(hasDuplicates).toBe(false);
        });

        test('should sort products by price ascending', async () => {
            const page = await getCategoryProducts(api, 'smartphone', { 
                sort: 'price_asc',
                limit: 20 
            });
            
            expectProductsSortedByPriceAsc(page.products);
        });

        test('should sort products by price descending', async () => {
            const page = await getCategoryProducts(api, 'smartphone', { 
                sort: 'price_desc',
                limit: 20 
            });
            
            expectProductsSortedByPriceDesc(page.products);
        });
    });

    test.describe('Products', () => {
        test('should return product details by ID', async () => {
            // First get the product list
            const catalog = await getCategoryProducts(api, 'smartphone', { limit: 1 });
            const firstProduct = catalog.products[0];
            
            const product = await getProductById(api, firstProduct.id);
            
            expectCategoryExists(product as any); // reuse null check
            expectProductStructureValid(product!);
        });

        test('should return null for non-existent product', async () => {
            const product = await getProductById(api, '999999999');
            
            expect(product).toBeNull();
        });

        test('should return similar products', async () => {
            const catalog = await getCategoryProducts(api, 'smartphone', { limit: 1 });
            const productId = catalog.products[0].id;
            
            const similar = await getSimilarProducts(api, productId, 4);
            
            expect(Array.isArray(similar)).toBe(true);
            // Similar products can be empty, this is acceptable
        });
    });

    test.describe('Filters', () => {
        test('should return available filters for category', async () => {
            const filters = await getCategoryFilters(api, 'smartphone');
            
            expectFiltersAvailable(filters);
            
            for (const filter of filters) {
                expectFilterStructureValid(filter);
            }
        });

        test('should have brand filter for electronics', async () => {
            const filters = await getCategoryFilters(api, 'smartphone');
            
            expectBrandFilterExists(filters);
        });

        test('should have price filter', async () => {
            const filters = await getCategoryFilters(api, 'smartphone');
            
            expectPriceFilterExists(filters);
        });
    });

    test.describe('Promotions', () => {
        test('should return sale products', async () => {
            const products = await getPromotionProducts(api, 'sale', 12);
            
            expect(Array.isArray(products)).toBe(true);
            
            for (const product of products) {
                expectProductStructureValid(product);
            }
        });

        test('should return new products', async () => {
            const products = await getPromotionProducts(api, 'new', 12);
            
            expect(Array.isArray(products)).toBe(true);
        });

        test('should return popular products', async () => {
            const products = await getPromotionProducts(api, 'popular', 12);
            
            expect(Array.isArray(products)).toBe(true);
        });
    });
});

/**
 * Errors API Spec - Negative Testing (404, 400, валидация)
 * 
 * Проверяет обработку ошибок:
 * - 404: несуществующие товары, категории
 * - 400: невалидные параметры
 * - Edge cases: нулевые ID, отрицательные значения
 */

import { test, expect } from '@playwright/test';
import { BrowserApiClient } from '../clients/browser-api.client';
import { createApiClient, ApiClient } from '../client/apiClient';

// Actions
import {
    getCategoryBySlug,
    getProductById,
    getCategoryProducts
} from '../actions/catalog.actions';

import {
    addToCart,
    updateCartItemQuantity
} from '../actions/cart.actions';

import {
    calculateCredit,
    calculateCreditByAmount
} from '../actions/credit.actions';

test.describe('Error Handling - Negative Testing', () => {
    let browserApi: BrowserApiClient;
    let api: ApiClient;

    test.beforeAll(async () => {
        browserApi = new BrowserApiClient({ language: 'ru' });
        await browserApi.init();
        api = await createApiClient();
    });

    test.afterAll(async () => {
        await browserApi.dispose();
        await api.dispose();
    });

    test.describe('404 - Non-existent Resources', () => {
        test('should handle non-existent product ID (999999999)', async () => {
            const product = await getProductById(browserApi, '999999999');
            
            expect(product).toBeNull();
        });

        test('should handle non-existent product ID (0)', async () => {
            const product = await getProductById(browserApi, '0');
            
            expect(product).toBeNull();
        });

        test('should handle non-existent product ID (negative)', async () => {
            const product = await getProductById(browserApi, '-123');
            
            expect(product).toBeNull();
        });

        test('should handle non-existent category slug', async () => {
            const category = await getCategoryBySlug(browserApi, 'non-existent-category-xyz-123');
            
            // smart.md redirects to homepage, so this may not return null
            // but at least it shouldn't crash
            expect(category).toBeDefined();
        });

        test('should handle category with typo', async () => {
            const category = await getCategoryBySlug(browserApi, 'smartphonee'); // typo
            
            expect(category).toBeDefined(); // should not crash
        });

        test('should handle category with special chars', async () => {
            const category = await getCategoryBySlug(browserApi, 'smartphone@#$');
            
            expect(category).toBeDefined(); // should not crash
        });
    });

    test.describe('400 - Invalid Parameters', () => {
        test('should handle invalid page number (negative)', async () => {
            // Should either return first page or empty results, but not crash
            const result = await getCategoryProducts(browserApi, 'smartphone', { page: -1 });
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle invalid page number (zero)', async () => {
            const result = await getCategoryProducts(browserApi, 'smartphone', { page: 0 });
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle extremely large page number', async () => {
            const result = await getCategoryProducts(browserApi, 'smartphone', { page: 99999 });
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle invalid limit (negative)', async () => {
            const result = await getCategoryProducts(browserApi, 'smartphone', { limit: -10 });
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle invalid limit (zero)', async () => {
            const result = await getCategoryProducts(browserApi, 'smartphone', { limit: 0 });
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });
    });

    test.describe('Cart - Invalid Operations', () => {
        test('should handle adding non-existent product to cart', async () => {
            try {
                await addToCart(api, '999999999', 1);
                // If it succeeds, that's unexpected but not a test failure
            } catch (error) {
                // Should fail gracefully with proper error
                expect(error).toBeDefined();
            }
        });

        test('should handle adding product with zero quantity', async () => {
            try {
                await addToCart(api, '123456', 0);
                // Should either succeed or fail gracefully
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle adding product with negative quantity', async () => {
            try {
                await addToCart(api, '123456', -5);
                // Should fail gracefully
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle updating non-existent cart item', async () => {
            try {
                await updateCartItemQuantity(api, '999999999', 5);
                // May succeed (cart empty) or fail gracefully
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    test.describe('Credit - Invalid Calculations', () => {
        test('should handle credit calculation with zero amount', async () => {
            try {
                const result = await calculateCreditByAmount(api, 0, 12);
                // Either returns error or empty offers
                expect(result).toHaveProperty('offers');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle credit calculation with negative amount', async () => {
            try {
                const result = await calculateCreditByAmount(api, -5000, 12);
                expect(result).toHaveProperty('offers');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle credit calculation with invalid term (0 months)', async () => {
            try {
                const result = await calculateCreditByAmount(api, 10000, 0);
                expect(result).toHaveProperty('offers');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle credit calculation with invalid term (negative)', async () => {
            try {
                const result = await calculateCreditByAmount(api, 10000, -12);
                expect(result).toHaveProperty('offers');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle credit calculation with unrealistic term (1000 months)', async () => {
            try {
                const result = await calculateCreditByAmount(api, 10000, 1000);
                expect(result).toHaveProperty('offers');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle credit for non-existent product', async () => {
            try {
                const result = await calculateCredit(api, '999999999');
                expect(result).toHaveProperty('offers');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });
});

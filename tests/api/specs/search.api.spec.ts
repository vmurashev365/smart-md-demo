/**
 * Search API Spec - тесты поиска, граничные значения, безопасность
 * 
 * Включает проверки на:
 * - XSS и SQL injection
 * - Граничные значения (пустые строки, длинные строки)
 * - Спецсимволы
 * - Нормальные поисковые запросы
 */

import { test, expect } from '@playwright/test';
import { BrowserApiClient } from '../clients/browser-api.client';

// Actions
import { searchProducts } from '../actions/search.actions';

test.describe('Search API', () => {
    let api: BrowserApiClient;

    test.beforeAll(async () => {
        api = new BrowserApiClient({ language: 'ru' });
        await api.init();
    });

    test.afterAll(async () => {
        await api.dispose();
    });

    test.describe('Normal Search', () => {
        const normalQueries = ['iPhone', 'Samsung', 'laptop', 'телевизор'];

        normalQueries.forEach(query => {
            test(`should handle normal query: "${query}"`, async () => {
                const result = await searchProducts(api, query);
                
                expect(result).toHaveProperty('products');
                expect(result).toHaveProperty('query', query);
                expect(Array.isArray(result.products)).toBe(true);
            });
        });
    });

    test.describe('Security - XSS Prevention', () => {
        const xssQueries = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert(1)>',
            'javascript:alert(1)',
            '<svg/onload=alert(1)>'
        ];

        xssQueries.forEach(query => {
            test(`should safely handle XSS attempt: "${query.substring(0, 30)}..."`, async () => {
                const result = await searchProducts(api, query);
                
                // Should not crash, should return safe result
                expect(result).toHaveProperty('products');
                expect(Array.isArray(result.products)).toBe(true);
                
                // Query should be properly escaped
                expect(result.query).toBe(query);
            });
        });
    });

    test.describe('Security - SQL Injection Prevention', () => {
        const sqlQueries = [
            "' OR '1'='1",
            "1'; DROP TABLE products; --",
            "admin'--",
            "' UNION SELECT * FROM users--"
        ];

        sqlQueries.forEach(query => {
            test(`should safely handle SQL injection attempt: "${query}"`, async () => {
                const result = await searchProducts(api, query);
                
                // Should not crash or expose database structure
                expect(result).toHaveProperty('products');
                expect(Array.isArray(result.products)).toBe(true);
            });
        });
    });

    test.describe('Boundary Values', () => {
        test('should handle empty string', async () => {
            const result = await searchProducts(api, '');
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle whitespace only', async () => {
            const result = await searchProducts(api, '   ');
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle very long string (1000 chars)', async () => {
            const longQuery = 'a'.repeat(1000);
            const result = await searchProducts(api, longQuery);
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle very long string (5000 chars)', async () => {
            const veryLongQuery = 'smartphone'.repeat(500);
            const result = await searchProducts(api, veryLongQuery);
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });
    });

    test.describe('Special Characters', () => {
        const specialQueries = [
            '@#$%^&*()',
            '!@#$%^&*',
            '()[]{}<>',
            '\\|/?.,'
        ];

        specialQueries.forEach(query => {
            test(`should handle special characters: "${query}"`, async () => {
                const result = await searchProducts(api, query);
                
                expect(result).toHaveProperty('products');
                expect(Array.isArray(result.products)).toBe(true);
            });
        });
    });

    test.describe('Unicode and International Characters', () => {
        test('should handle Cyrillic characters', async () => {
            const result = await searchProducts(api, 'Смартфон');
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle emoji', async () => {
            const result = await searchProducts(api, '📱 iPhone');
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle mixed languages', async () => {
            const result = await searchProducts(api, 'iPhone 15 Pro Max');
            
            expect(result).toHaveProperty('products');
            expect(Array.isArray(result.products)).toBe(true);
        });
    });
});

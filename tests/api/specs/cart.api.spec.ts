/**
 * Cart API Spec - регрессионные тесты корзины
 */

import { test, expect } from '@playwright/test';
import { createApiClient, ApiClient } from '../client/apiClient';

// Actions
import {
    getCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode,
    validateCartAvailability,
    getCartRecommendations
} from '../actions/cart.actions';

import { getCategoryProducts } from '../actions/catalog.actions';

// Assertions
import {
    expectCartEmpty,
    expectCartNotEmpty,
    expectCartStructureValid,
    expectCartTotalCorrect,
    expectCartItemCountCorrect,
    expectProductInCart,
    expectProductNotInCart,
    expectProductQuantityInCart,
    expectCartItemStructureValid,
    expectAddToCartSuccess,
    expectPromoCodeValid,
    expectPromoCodeInvalid
} from '../assertions/cart.assertions';

test.describe('Cart API', () => {
    let api: ApiClient;
    let testProductId: string | number;

    test.beforeAll(async () => {
        api = await createApiClient();
        
        // Get a real product for tests
        const catalog = await getCategoryProducts(api, 'smartphone', { limit: 1 });
        if (catalog.products.length > 0) {
            testProductId = catalog.products[0].id;
        }
    });

    test.afterAll(async () => {
        await api.dispose();
    });

    test.beforeEach(async () => {
        // Clear cart before each test
        await clearCart(api);
    });

    test.describe('Cart Structure', () => {
        test('should return empty cart initially', async () => {
            const cart = await getCart(api);
            
            expectCartStructureValid(cart);
            expectCartEmpty(cart);
        });

        test('should have correct structure', async () => {
            const cart = await getCart(api);
            
            expect(cart).toHaveProperty('items');
            expect(cart).toHaveProperty('totalItems');
            expect(cart).toHaveProperty('totalPrice');
            expect(cart).toHaveProperty('currency');
        });
    });

    test.describe('Add to Cart', () => {
        test('should add product to cart', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const result = await addToCart(api, testProductId, 1);
            
            expectAddToCartSuccess(result);
            expectCartNotEmpty(result.cart);
            expectProductInCart(result.cart, testProductId);
        });

        test('should add multiple quantities', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const result = await addToCart(api, testProductId, 3);
            
            expectAddToCartSuccess(result);
            expectProductQuantityInCart(result.cart, testProductId, 3);
        });

        test('should increment quantity when adding same product', async () => {
            test.skip(!testProductId, 'No test product available');
            
            await addToCart(api, testProductId, 2);
            const result = await addToCart(api, testProductId, 1);
            
            // Expect 2 + 1 = 3
            expectProductQuantityInCart(result.cart, testProductId, 3);
        });

        test('should validate cart item structure', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const result = await addToCart(api, testProductId, 1);
            
            for (const item of result.cart.items) {
                expectCartItemStructureValid(item);
            }
        });
    });

    test.describe('Update Cart', () => {
        test('should update item quantity', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const addResult = await addToCart(api, testProductId, 1);
            const cartItemId = addResult.cart.items[0].id;
            
            const updatedCart = await updateCartItemQuantity(api, cartItemId, 5);
            
            expectProductQuantityInCart(updatedCart, testProductId, 5);
        });

        test('should calculate total correctly after update', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const addResult = await addToCart(api, testProductId, 1);
            const cartItemId = addResult.cart.items[0].id;
            
            const updatedCart = await updateCartItemQuantity(api, cartItemId, 3);
            
            expectCartTotalCorrect(updatedCart);
            expectCartItemCountCorrect(updatedCart);
        });
    });

    test.describe('Remove from Cart', () => {
        test('should remove item from cart', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const addResult = await addToCart(api, testProductId, 1);
            const cartItemId = addResult.cart.items[0].id;
            
            const updatedCart = await removeFromCart(api, cartItemId);
            
            expectCartEmpty(updatedCart);
            expectProductNotInCart(updatedCart, testProductId);
        });
    });

    test.describe('Clear Cart', () => {
        test('should clear all items from cart', async () => {
            test.skip(!testProductId, 'No test product available');
            
            await addToCart(api, testProductId, 2);
            const clearedCart = await clearCart(api);
            
            expectCartEmpty(clearedCart);
        });
    });

    test.describe('Promo Codes', () => {
        test('should reject invalid promo code', async () => {
            const result = await applyPromoCode(api, 'INVALID_CODE_12345');
            
            expectPromoCodeInvalid(result);
        });

        // Skip valid promo code test, as we need a real code
        test.skip('should apply valid promo code', async () => {
            test.skip(!testProductId, 'No test product available');
            
            await addToCart(api, testProductId, 1);
            const result = await applyPromoCode(api, 'VALID_CODE');
            
            expectPromoCodeValid(result);
        });

        test('should remove promo code', async () => {
            test.skip(!testProductId, 'No test product available');
            
            await addToCart(api, testProductId, 1);
            const cart = await removePromoCode(api);
            
            expect(cart.promoCode).toBeFalsy();
            expect(cart.discount).toBeFalsy();
        });
    });

    test.describe('Cart Validation', () => {
        test('should validate cart availability', async () => {
            test.skip(!testProductId, 'No test product available');
            
            await addToCart(api, testProductId, 1);
            const validation = await validateCartAvailability(api);
            
            expect(validation).toHaveProperty('valid');
            expect(validation).toHaveProperty('unavailableItems');
        });
    });

    test.describe('Cart Recommendations', () => {
        test('should return recommendations', async () => {
            test.skip(!testProductId, 'No test product available');
            
            await addToCart(api, testProductId, 1);
            const recommendations = await getCartRecommendations(api, 4);
            
            expect(Array.isArray(recommendations)).toBe(true);
        });
    });

    test.describe('Cart Math', () => {
        test('should calculate totals correctly', async () => {
            test.skip(!testProductId, 'No test product available');
            
            await addToCart(api, testProductId, 2);
            const cart = await getCart(api);
            
            expectCartTotalCorrect(cart);
            expectCartItemCountCorrect(cart);
        });
    });
});

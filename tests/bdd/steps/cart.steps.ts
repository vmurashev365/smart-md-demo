/**
 * Cart BDD Steps
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { ApiWorld } from '../world';

// Actions
import {
    getCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    applyPromoCode
} from '../../api/actions/cart.actions';

import { getCategoryProducts } from '../../api/actions/catalog.actions';

// Assertions
import {
    expectCartEmpty,
    expectCartNotEmpty,
    expectCartTotalCorrect,
    expectProductInCart,
    expectProductNotInCart,
    expectProductQuantityInCart,
    expectAddToCartSuccess,
    expectPromoCodeValid,
    expectPromoCodeInvalid
} from '../../api/assertions/cart.assertions';

// === GIVEN ===

Given('cart is empty', async function (this: ApiWorld) {
    await clearCart(this.api);
    this.cart = await getCart(this.api);
    expectCartEmpty(this.cart);
});

Given('cart contains product {int}', async function (this: ApiWorld, productId: number) {
    const result = await addToCart(this.api, String(productId), 1);
    this.cart = result.cart;
    this.lastAddedProductId = String(productId);
    expectCartNotEmpty(this.cart);
});

Given('cart contains {int} units of product', async function (this: ApiWorld, quantity: number) {
    const catalog = await getCategoryProducts(this.api, 'smartphone', { limit: 1 });
    if (catalog.products.length === 0) {
        throw new Error('No products for cart');
    }
    
    await clearCart(this.api);
    const result = await addToCart(this.api, catalog.products[0].id, quantity);
    this.cart = result.cart;
    this.lastAddedProductId = catalog.products[0].id;
});

Given('user selected product for purchase', async function (this: ApiWorld) {
    const catalog = await getCategoryProducts(this.api, 'smartphone', { limit: 1 });
    if (catalog.products.length === 0) {
        throw new Error('No products in catalog');
    }
    this.currentProduct = catalog.products[0];
});

// === WHEN ===

When('user adds product {int} to cart', async function (this: ApiWorld, productId: number) {
    const result = await addToCart(this.api, String(productId), 1);
    this.cart = result.cart;
    this.lastAddedProductId = String(productId);
});

When('user adds {int} units to cart', async function (this: ApiWorld, quantity: number) {
    if (!this.currentProduct) {
        throw new Error('First select a product');
    }
    
    const result = await addToCart(this.api, this.currentProduct.id, quantity);
    this.cart = result.cart;
    this.lastAddedProductId = this.currentProduct.id;
});

When('user removes product from cart', async function (this: ApiWorld) {
    if (!this.cart || this.cart.items.length === 0) {
        throw new Error('Cart is empty');
    }
    
    const itemToRemove = this.cart.items[0];
    this.cart = await removeFromCart(this.api, itemToRemove.id);
});

When('user changes product quantity to {int}', async function (this: ApiWorld, quantity: number) {
    if (!this.cart || this.cart.items.length === 0) {
        throw new Error('Cart is empty');
    }
    
    const itemToUpdate = this.cart.items[0];
    this.cart = await updateCartItemQuantity(this.api, itemToUpdate.id, quantity);
});

When('user clears cart', async function (this: ApiWorld) {
    this.cart = await clearCart(this.api);
});

When('user applies promo code {string}', async function (this: ApiWorld, code: string) {
    const result = await applyPromoCode(this.api, code);
    this.cart = await getCart(this.api);
    this.promoResult = result;
    
    if (!result.valid) {
        this.lastError = new Error(result.message || 'Promo code invalid');
    }
});

When('user refreshes page', async function (this: ApiWorld) {
    // Simulate page refresh by getting cart again
    this.cart = await getCart(this.api);
});

// === THEN ===

Then('product appears in cart', function (this: ApiWorld) {
    expectCartNotEmpty(this.cart!);
    expectProductInCart(this.cart!, this.lastAddedProductId!);
});

Then('cart counter shows {int}', function (this: ApiWorld, count: number) {
    if (this.cart!.totalItems !== count) {
        throw new Error(`Expected ${count} items, cart has ${this.cart!.totalItems}`);
    }
});

Then('cart contains {int} items', function (this: ApiWorld, count: number) {
    if (this.cart!.items.length !== count) {
        throw new Error(`Expected ${count} items, cart has ${this.cart!.items.length}`);
    }
});

Then('total equals sum of product prices', function (this: ApiWorld) {
    expectCartTotalCorrect(this.cart!);
});

Then('product quantity in cart equals {int}', function (this: ApiWorld, quantity: number) {
    expectProductQuantityInCart(this.cart!, this.lastAddedProductId!, quantity);
});

Then('total is recalculated', function (this: ApiWorld) {
    expectCartTotalCorrect(this.cart!);
});

Then('the cart is empty', function (this: ApiWorld) {
    expectCartEmpty(this.cart!);
});

Then('product not in cart', function (this: ApiWorld) {
    expectProductNotInCart(this.cart!, this.lastAddedProductId!);
});

Then('discount is applied to order', function (this: ApiWorld) {
    if (!this.cart!.discount || this.cart!.discount <= 0) {
        throw new Error('Discount not applied');
    }
});

Then('total amount decreased', function (this: ApiWorld) {
    if (!this.cart!.discount || this.cart!.discount <= 0) {
        throw new Error('Total not decreased');
    }
});

Then('promo code is rejected', function (this: ApiWorld) {
    if (!this.lastError && this.promoResult?.valid !== false) {
        throw new Error('Expected promo code rejection');
    }
});

Then('order amount unchanged', async function (this: ApiWorld) {
    // Promo was rejected, so no discount
    if (this.cart!.discount && this.cart!.discount > 0) {
        throw new Error('Order amount changed unexpectedly');
    }
});

Then('product remains in cart', function (this: ApiWorld) {
    expectCartNotEmpty(this.cart!);
    expectProductInCart(this.cart!, this.lastAddedProductId!);
});

Then('cart total is correct', function (this: ApiWorld) {
    expectCartTotalCorrect(this.cart!);
});

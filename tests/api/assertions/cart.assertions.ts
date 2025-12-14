/**
 * Cart Assertions - business invariants for cart
 */

import { expect } from '@playwright/test';
import { Cart, CartItem, AddToCartResult, PromoCodeResult } from '../actions/cart.actions';

// === CART ===

/**
 * Проверить, что корзина пуста
 */
export function expectCartEmpty(cart: Cart): void {
    expect(cart.items.length, 'Корзина должна быть пустой').toBe(0);
    expect(cart.totalItems, 'Количество товаров должно быть 0').toBe(0);
    expect(cart.totalPrice, 'Сумма должна быть 0').toBe(0);
}

/**
 * Проверить, что корзина не пуста
 */
export function expectCartNotEmpty(cart: Cart): void {
    expect(cart.items.length, 'Корзина не должна быть пустой').toBeGreaterThan(0);
    expect(cart.totalItems, 'Количество товаров должно быть > 0').toBeGreaterThan(0);
    expect(cart.totalPrice, 'Сумма должна быть > 0').toBeGreaterThan(0);
}

/**
 * Проверить структуру корзины
 */
export function expectCartStructureValid(cart: Cart): void {
    expect(cart).toHaveProperty('items');
    expect(cart).toHaveProperty('totalItems');
    expect(cart).toHaveProperty('totalPrice');
    expect(cart).toHaveProperty('currency');
    expect(Array.isArray(cart.items)).toBe(true);
    expect(typeof cart.totalPrice).toBe('number');
}

/**
 * Проверить, что общая сумма корзины корректна
 */
export function expectCartTotalCorrect(cart: Cart): void {
    const calculatedTotal = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const discount = cart.discount || 0;
    const expectedTotal = calculatedTotal - discount;
    
    expect(
        Math.abs(cart.totalPrice - expectedTotal),
        'Общая сумма должна равняться сумме товаров минус скидка'
    ).toBeLessThan(1); // tolerance for rounding
}

/**
 * Проверить, что количество товаров корректно
 */
export function expectCartItemCountCorrect(cart: Cart): void {
    const calculatedCount = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );
    
    expect(
        cart.totalItems,
        'Количество товаров должно соответствовать сумме количеств'
    ).toBe(calculatedCount);
}

// === ITEMS IN CART ===

/**
 * Проверить, что товар есть в корзине
 */
export function expectProductInCart(cart: Cart, productId: string | number): void {
    const item = cart.items.find(i => 
        i.productId === productId || i.id === productId
    );
    expect(item, `Товар ${productId} должен быть в корзине`).toBeDefined();
}

/**
 * Проверить, что товара нет в корзине
 */
export function expectProductNotInCart(cart: Cart, productId: string | number): void {
    const item = cart.items.find(i => 
        i.productId === productId || i.id === productId
    );
    expect(item, `Товар ${productId} не должен быть в корзине`).toBeUndefined();
}

/**
 * Проверить количество конкретного товара
 */
export function expectProductQuantityInCart(
    cart: Cart,
    productId: string | number,
    expectedQuantity: number
): void {
    const item = cart.items.find(i => 
        i.productId === productId || i.id === productId
    );
    expect(item, `Товар ${productId} должен быть в корзине`).toBeDefined();
    expect(
        item!.quantity,
        `Количество товара должно быть ${expectedQuantity}`
    ).toBe(expectedQuantity);
}

/**
 * Проверить структуру товара в корзине
 */
export function expectCartItemStructureValid(item: CartItem): void {
    expect(item.id, 'Товар должен иметь ID').toBeDefined();
    expect(item.productId, 'Товар должен иметь productId').toBeDefined();
    expect(item.title, 'Товар должен иметь название').toBeTruthy();
    expect(typeof item.price, 'Цена должна быть числом').toBe('number');
    expect(item.price, 'Цена должна быть > 0').toBeGreaterThan(0);
    expect(typeof item.quantity, 'Количество должно быть числом').toBe('number');
    expect(item.quantity, 'Количество должно быть > 0').toBeGreaterThan(0);
}

/**
 * Проверить, что все товары в корзине в наличии
 */
export function expectAllCartItemsAvailable(cart: Cart): void {
    for (const item of cart.items) {
        expect(
            item.available,
            `Товар "${item.title}" должен быть в наличии`
        ).toBe(true);
    }
}

/**
 * Проверить, что количество не превышает максимум
 */
export function expectQuantityWithinLimit(item: CartItem): void {
    if (item.maxQuantity !== undefined) {
        expect(
            item.quantity,
            `Количество не должно превышать ${item.maxQuantity}`
        ).toBeLessThanOrEqual(item.maxQuantity);
    }
}

// === ADDING TO CART ===

/**
 * Проверить успешное добавление в корзину
 */
export function expectAddToCartSuccess(result: AddToCartResult): void {
    expect(result.success, 'Добавление должно быть успешным').toBe(true);
    expect(result.cart, 'Должна вернуться обновлённая корзина').toBeDefined();
}

/**
 * Проверить неуспешное добавление в корзину
 */
export function expectAddToCartFailed(result: AddToCartResult): void {
    expect(result.success, 'Добавление должно быть неуспешным').toBe(false);
    expect(result.message, 'Должно быть сообщение об ошибке').toBeTruthy();
}

// === PROMO CODES ===

/**
 * Проверить, что промокод валиден
 */
export function expectPromoCodeValid(result: PromoCodeResult): void {
    expect(result.valid, 'Промокод должен быть валидным').toBe(true);
    expect(result.discount, 'Должна быть скидка').toBeGreaterThan(0);
}

/**
 * Проверить, что промокод невалиден
 */
export function expectPromoCodeInvalid(result: PromoCodeResult): void {
    expect(result.valid, 'Промокод должен быть невалидным').toBe(false);
    expect(result.message, 'Должно быть сообщение об ошибке').toBeTruthy();
}

/**
 * Проверить, что скидка применена к корзине
 */
export function expectDiscountApplied(cart: Cart, expectedDiscount: number): void {
    expect(cart.discount, 'Скидка должна быть применена').toBeDefined();
    expect(
        Math.abs(cart.discount! - expectedDiscount),
        'Размер скидки должен соответствовать ожидаемому'
    ).toBeLessThan(1);
}

/**
 * Проверить, что промокод сохранён в корзине
 */
export function expectPromoCodeInCart(cart: Cart, code: string): void {
    expect(
        cart.promoCode?.toLowerCase(),
        `Промокод ${code} должен быть в корзине`
    ).toBe(code.toLowerCase());
}

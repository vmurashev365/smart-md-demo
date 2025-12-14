/**
 * Cart Actions - business operations for shopping cart
 * 
 * Operations for working with the shopping cart.
 */

import { ApiClient } from '../client/apiClient';

// === TYPES ===

export interface CartItem {
    id: string | number;
    productId: string | number;
    title: string;
    price: number;
    quantity: number;
    totalPrice: number;
    image?: string;
    available: boolean;
    maxQuantity?: number;
}

export interface Cart {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    currency: string;
    discount?: number;
    promoCode?: string;
    deliveryEstimate?: string;
}

export interface AddToCartResult {
    success: boolean;
    cart: Cart;
    addedItem?: CartItem;
    message?: string;
}

export interface PromoCodeResult {
    valid: boolean;
    discount?: number;
    discountType?: 'percent' | 'fixed';
    message?: string;
    minOrderAmount?: number;
}

// === ACTIONS ===

/**
 * Получить текущее состояние корзины
 */
export async function getCart(api: ApiClient): Promise<Cart> {
    const response = await api.get<Cart>('/api/cart');
    return normalizeCart(response.data);
}

/**
 * Добавить товар в корзину
 */
export async function addToCart(
    api: ApiClient,
    productId: string | number,
    quantity: number = 1
): Promise<AddToCartResult> {
    const response = await api.post<AddToCartResult>('/api/cart/add', {
        product_id: productId,
        quantity
    });

    return {
        success: response.status >= 200 && response.status < 300,
        cart: normalizeCart(response.data.cart || response.data),
        addedItem: response.data.addedItem,
        message: response.data.message
    };
}

/**
 * Удалить товар из корзины
 */
export async function removeFromCart(
    api: ApiClient,
    cartItemId: string | number
): Promise<Cart> {
    const response = await api.delete<Cart>(`/api/cart/item/${cartItemId}`);
    return normalizeCart(response.data);
}

/**
 * Изменить количество товара в корзине
 */
export async function updateCartItemQuantity(
    api: ApiClient,
    cartItemId: string | number,
    quantity: number
): Promise<Cart> {
    const response = await api.put<Cart>(`/api/cart/item/${cartItemId}`, {
        quantity
    });
    return normalizeCart(response.data);
}

/**
 * Очистить корзину
 */
export async function clearCart(api: ApiClient): Promise<Cart> {
    const response = await api.delete<Cart>('/api/cart');
    return normalizeCart(response.data);
}

/**
 * Применить промокод
 */
export async function applyPromoCode(
    api: ApiClient,
    code: string
): Promise<PromoCodeResult> {
    const response = await api.post<PromoCodeResult>('/api/cart/promo', {
        code
    });

    return {
        valid: response.data.valid || response.status === 200,
        discount: response.data.discount,
        discountType: response.data.discountType,
        message: response.data.message,
        minOrderAmount: response.data.minOrderAmount
    };
}

/**
 * Удалить промокод
 */
export async function removePromoCode(api: ApiClient): Promise<Cart> {
    const response = await api.delete<Cart>('/api/cart/promo');
    return normalizeCart(response.data);
}

/**
 * Проверить наличие товаров в корзине
 */
export async function validateCartAvailability(api: ApiClient): Promise<{
    valid: boolean;
    unavailableItems: CartItem[];
}> {
    const response = await api.get<{
        valid: boolean;
        unavailableItems: CartItem[];
    }>('/api/cart/validate');

    return {
        valid: response.data.valid ?? true,
        unavailableItems: response.data.unavailableItems || []
    };
}

/**
 * Получить рекомендации к корзине
 */
export async function getCartRecommendations(
    api: ApiClient,
    limit: number = 4
): Promise<{ productId: string | number; title: string; price: number }[]> {
    const response = await api.get<{ recommendations: unknown[] }>(
        '/api/cart/recommendations',
        { params: { limit: String(limit) } }
    );
    return (response.data.recommendations || []) as { productId: string | number; title: string; price: number }[];
}

// === HELPERS ===

function normalizeCart(data: unknown): Cart {
    const result = data as Record<string, unknown>;
    
    const items = (result.items as CartItem[]) || [];
    const totalPrice = (result.totalPrice as number) || 
        (result.total as number) || 
        items.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);

    return {
        items,
        totalItems: (result.totalItems as number) || (result.itemCount as number) || items.length,
        totalPrice,
        currency: (result.currency as string) || 'MDL',
        discount: result.discount as number | undefined,
        promoCode: result.promoCode as string | undefined,
        deliveryEstimate: result.deliveryEstimate as string | undefined
    };
}

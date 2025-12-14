/**
 * Product Actions - business operations for products
 * 
 * Operations for working with individual products.
 */

import { ApiClient } from '../client/apiClient';
import { Product } from './catalog.actions';

// === TYPES ===

export interface ProductReview {
    id: string | number;
    author: string;
    rating: number;
    text: string;
    date: string;
    helpful?: number;
    verified?: boolean;
}

export interface ProductQuestion {
    id: string | number;
    question: string;
    answer?: string;
    author: string;
    date: string;
}

export interface ProductAvailability {
    available: boolean;
    quantity?: number;
    stores?: { name: string; available: boolean; quantity?: number }[];
    deliveryDate?: string;
}

export interface ProductPrice {
    current: number;
    old?: number;
    discount?: number;
    discountPercent?: number;
    currency: string;
    priceHistory?: { date: string; price: number }[];
}

// === ACTIONS ===

/**
 * Получить отзывы о товаре
 */
export async function getProductReviews(
    api: ApiClient,
    productId: string | number,
    options: { page?: number; limit?: number; sort?: 'date' | 'rating' } = {}
): Promise<{ reviews: ProductReview[]; total: number; averageRating: number }> {
    const params: Record<string, string> = {};
    if (options.page) params.page = String(options.page);
    if (options.limit) params.limit = String(options.limit);
    if (options.sort) params.sort = options.sort;

    const response = await api.get<{
        reviews: ProductReview[];
        total: number;
        averageRating: number;
    }>(`/api/product/${productId}/reviews`, { params });

    return {
        reviews: response.data.reviews || [],
        total: response.data.total || 0,
        averageRating: response.data.averageRating || 0
    };
}

/**
 * Получить вопросы о товаре
 */
export async function getProductQuestions(
    api: ApiClient,
    productId: string | number
): Promise<ProductQuestion[]> {
    const response = await api.get<{ questions: ProductQuestion[] }>(
        `/api/product/${productId}/questions`
    );
    return response.data.questions || [];
}

/**
 * Проверить наличие товара
 */
export async function checkProductAvailability(
    api: ApiClient,
    productId: string | number
): Promise<ProductAvailability> {
    const response = await api.get<ProductAvailability>(
        `/api/product/${productId}/availability`
    );

    return {
        available: response.data.available ?? false,
        quantity: response.data.quantity,
        stores: response.data.stores,
        deliveryDate: response.data.deliveryDate
    };
}

/**
 * Получить актуальную цену товара
 */
export async function getProductPrice(
    api: ApiClient,
    productId: string | number
): Promise<ProductPrice> {
    const response = await api.get<ProductPrice>(`/api/product/${productId}/price`);

    const data = response.data;
    return {
        current: data.current || (data as unknown as { price: number }).price || 0,
        old: data.old,
        discount: data.discount,
        discountPercent: data.discountPercent,
        currency: data.currency || 'MDL',
        priceHistory: data.priceHistory
    };
}

/**
 * Получить характеристики товара
 */
export async function getProductSpecifications(
    api: ApiClient,
    productId: string | number
): Promise<Record<string, string>> {
    const response = await api.get<{ specifications: Record<string, string> }>(
        `/api/product/${productId}/specifications`
    );
    return response.data.specifications || {};
}

/**
 * Получить аксессуары к товару
 */
export async function getProductAccessories(
    api: ApiClient,
    productId: string | number,
    limit: number = 4
): Promise<Product[]> {
    const response = await api.get<{ products: Product[] }>(
        `/api/product/${productId}/accessories`,
        { params: { limit: String(limit) } }
    );
    return response.data.products || [];
}

/**
 * Добавить товар в избранное
 */
export async function addToWishlist(
    api: ApiClient,
    productId: string | number
): Promise<{ success: boolean; wishlistCount: number }> {
    const response = await api.post<{ success: boolean; count: number }>(
        '/api/wishlist/add',
        { product_id: productId }
    );

    return {
        success: response.data.success ?? response.status === 200,
        wishlistCount: response.data.count || 0
    };
}

/**
 * Удалить товар из избранного
 */
export async function removeFromWishlist(
    api: ApiClient,
    productId: string | number
): Promise<{ success: boolean; wishlistCount: number }> {
    const response = await api.delete<{ success: boolean; count: number }>(
        `/api/wishlist/${productId}`
    );

    return {
        success: response.data.success ?? response.status === 200,
        wishlistCount: response.data.count || 0
    };
}

/**
 * Получить список избранного
 */
export async function getWishlist(api: ApiClient): Promise<Product[]> {
    const response = await api.get<{ products: Product[] }>('/api/wishlist');
    return response.data.products || [];
}

/**
 * Сравнить товары
 */
export async function compareProducts(
    api: ApiClient,
    productIds: (string | number)[]
): Promise<{
    products: Product[];
    specifications: { name: string; values: (string | null)[] }[];
}> {
    const response = await api.get<{
        products: Product[];
        specifications: { name: string; values: (string | null)[] }[];
    }>('/api/compare', {
        params: { ids: productIds.join(',') }
    });

    return {
        products: response.data.products || [],
        specifications: response.data.specifications || []
    };
}

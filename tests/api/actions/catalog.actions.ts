/**
 * Catalog Actions - business operations for catalog
 * 
 * Operations for working with categories, products, filters.
 */

import { ApiClient } from '../client/apiClient';

// === TYPES ===

export interface Category {
    id: string | number;
    name: string;
    slug: string;
    parentId?: string | number;
    children?: Category[];
    productCount?: number;
    image?: string;
}

export interface Product {
    id: string | number;
    title: string;
    price: number;
    oldPrice?: number;
    currency?: string;
    description?: string;
    specifications?: Record<string, string>;
    images?: string[];
    available: boolean;
    brand?: string;
    category?: string;
    sku?: string;
    rating?: number;
    reviewCount?: number;
}

export interface CatalogFilter {
    name: string;
    type: 'range' | 'checkbox' | 'radio';
    options?: { value: string; label: string; count?: number }[];
    min?: number;
    max?: number;
}

export interface CatalogPage {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    filters: CatalogFilter[];
    sortOptions?: string[];
    category?: Category;
}

// === ACTIONS ===

/**
 * Получить список всех категорий
 */
export async function getCategories(api: ApiClient): Promise<Category[]> {
    const response = await api.get<{ categories: Category[] } | Category[]>('/api/categories');
    
    if (Array.isArray(response.data)) {
        return response.data;
    }
    return response.data.categories || [];
}

/**
 * Получить категорию по slug
 */
export async function getCategoryBySlug(
    api: ApiClient,
    slug: string
): Promise<Category | null> {
    try {
        const response = await api.get<Category>(`/api/category/${slug}`);
        return response.data;
    } catch {
        return null;
    }
}

/**
 * Получить товары категории
 */
export async function getCategoryProducts(
    api: ApiClient,
    categorySlug: string,
    options: {
        page?: number;
        limit?: number;
        sort?: 'price_asc' | 'price_desc' | 'popular' | 'new';
        filters?: Record<string, string>;
    } = {}
): Promise<CatalogPage> {
    const params: Record<string, string> = {};
    
    if (options.page) params.page = String(options.page);
    if (options.limit) params.limit = String(options.limit);
    if (options.sort) params.sort = options.sort;
    if (options.filters) {
        Object.assign(params, options.filters);
    }

    const response = await api.get<CatalogPage>(`/api/category/${categorySlug}/products`, { params });
    return normalizeCatalogPage(response.data);
}

/**
 * Получить детали товара по ID
 */
export async function getProductById(
    api: ApiClient,
    productId: string | number
): Promise<Product | null> {
    try {
        const response = await api.get<Product>(`/api/product/${productId}`);
        return response.data;
    } catch {
        return null;
    }
}

/**
 * Получить детали товара по slug (URL)
 */
export async function getProductBySlug(
    api: ApiClient,
    slug: string
): Promise<Product | null> {
    try {
        const response = await api.get<Product>(`/api/product/slug/${slug}`);
        return response.data;
    } catch {
        return null;
    }
}

/**
 * Получить доступные фильтры для категории
 */
export async function getCategoryFilters(
    api: ApiClient,
    categorySlug: string
): Promise<CatalogFilter[]> {
    const response = await api.get<{ filters: CatalogFilter[] }>(`/api/category/${categorySlug}/filters`);
    return response.data.filters || [];
}

/**
 * Получить похожие товары
 */
export async function getSimilarProducts(
    api: ApiClient,
    productId: string | number,
    limit: number = 4
): Promise<Product[]> {
    const response = await api.get<{ products: Product[] }>(
        `/api/product/${productId}/similar`,
        { params: { limit: String(limit) } }
    );
    return response.data.products || [];
}

/**
 * Получить товары по акции/распродаже
 */
export async function getPromotionProducts(
    api: ApiClient,
    promotionType: 'sale' | 'new' | 'popular' | 'recommended',
    limit: number = 12
): Promise<Product[]> {
    const response = await api.get<{ products: Product[] }>(
        `/api/promotions/${promotionType}`,
        { params: { limit: String(limit) } }
    );
    return response.data.products || [];
}

// === HELPERS ===

function normalizeCatalogPage(data: unknown): CatalogPage {
    const result = data as Record<string, unknown>;
    
    return {
        products: (result.products as Product[]) || (result.items as Product[]) || [],
        total: (result.total as number) || 0,
        page: (result.page as number) || 1,
        pageSize: (result.pageSize as number) || (result.limit as number) || 20,
        filters: (result.filters as CatalogFilter[]) || [],
        sortOptions: result.sortOptions as string[] | undefined,
        category: result.category as Category | undefined
    };
}

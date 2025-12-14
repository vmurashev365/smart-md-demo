/**
 * Search Actions - business operations for search
 * 
 * Operations only, without assertions.
 * Used in API specs and BDD steps.
 */

import { ApiClient, ApiResponse } from '../client/apiClient';

// === TYPES ===

export interface SearchProduct {
    id: string | number;
    title: string;
    price: number;
    currency?: string;
    url?: string;
    image?: string;
    available?: boolean;
    brand?: string;
    category?: string;
}

export interface SearchResult {
    products: SearchProduct[];
    total: number;
    query: string;
    page?: number;
    pageSize?: number;
    filters?: Record<string, unknown>;
}

export interface SearchSuggestion {
    text: string;
    type: 'product' | 'category' | 'brand';
    url?: string;
}

// === ACTIONS ===

/**
 * Выполнить поиск товаров
 */
export async function searchProducts(
    api: ApiClient,
    query: string,
    options: { page?: number; limit?: number } = {}
): Promise<SearchResult> {
    const params: Record<string, string> = { q: query };
    if (options.page) params.page = String(options.page);
    if (options.limit) params.limit = String(options.limit);

    const response = await api.get<SearchResult>('/api/search', { params });
    
    // Normalize response (API may return different formats)
    return normalizeSearchResult(response.data, query);
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(
    api: ApiClient,
    query: string
): Promise<SearchSuggestion[]> {
    const response = await api.get<{ suggestions: SearchSuggestion[] } | SearchSuggestion[]>(
        '/api/search/suggest',
        { params: { q: query } }
    );

    // Normalize response
    if (Array.isArray(response.data)) {
        return response.data;
    }
    return response.data.suggestions || [];
}

/**
 * Search with filters
 */
export async function searchWithFilters(
    api: ApiClient,
    query: string,
    filters: {
        minPrice?: number;
        maxPrice?: number;
        brand?: string;
        category?: string;
        inStock?: boolean;
    }
): Promise<SearchResult> {
    const params: Record<string, string> = { q: query };
    
    if (filters.minPrice !== undefined) params.price_min = String(filters.minPrice);
    if (filters.maxPrice !== undefined) params.price_max = String(filters.maxPrice);
    if (filters.brand) params.brand = filters.brand;
    if (filters.category) params.category = filters.category;
    if (filters.inStock !== undefined) params.in_stock = filters.inStock ? '1' : '0';

    const response = await api.get<SearchResult>('/api/search', { params });
    return normalizeSearchResult(response.data, query);
}

/**
 * Поиск по категории
 */
export async function searchInCategory(
    api: ApiClient,
    categorySlug: string,
    options: { page?: number; sort?: string } = {}
): Promise<SearchResult> {
    const params: Record<string, string> = {};
    if (options.page) params.page = String(options.page);
    if (options.sort) params.sort = options.sort;

    const response = await api.get<SearchResult>(`/api/category/${categorySlug}`, { params });
    return normalizeSearchResult(response.data, categorySlug);
}

// === HELPERS ===

/**
 * Нормализация ответа поиска (API может возвращать разные форматы)
 */
function normalizeSearchResult(data: unknown, query: string): SearchResult {
    const result = data as Record<string, unknown>;
    
    // Extract products from different possible structures
    let products: SearchProduct[] = [];
    if (Array.isArray(result.products)) {
        products = result.products;
    } else if (Array.isArray(result.items)) {
        products = result.items as SearchProduct[];
    } else if (Array.isArray(result.data)) {
        products = result.data as SearchProduct[];
    } else if (Array.isArray(result)) {
        products = result as unknown as SearchProduct[];
    }

    return {
        products,
        total: (result.total as number) || (result.count as number) || products.length,
        query,
        page: result.page as number | undefined,
        pageSize: result.pageSize as number | undefined,
        filters: result.filters as Record<string, unknown> | undefined
    };
}

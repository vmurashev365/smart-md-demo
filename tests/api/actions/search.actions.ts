/**
 * Search Actions - business operations for search
 * 
 * Operations only, without assertions.
 * Used in API specs and BDD steps.
 */

import { BrowserApiClient } from '../clients/browser-api.client';
import { HtmlParser } from '../utils/html-parser';

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
 * 
 * Примечание: smart.md search возвращает категории, а не товары напрямую.
 * Поэтому мы берем первую категорию из результатов и загружаем товары оттуда.
 */
export async function searchProducts(
    api: BrowserApiClient,
    query: string,
    options: { page?: number; limit?: number } = {}
): Promise<SearchResult> {
    const params: Record<string, string> = { q: query };
    if (options.page) params.page = String(options.page);
    if (options.limit) params.limit = String(options.limit);

    // Get search results page (contains categories, not products)
    const searchResponse = await api.get<string>('/search', { params });
    const searchHtml = typeof searchResponse.data === 'string' ? searchResponse.data : JSON.stringify(searchResponse.data);
    
    // Parse search results to find category links
    const categoryLinks = HtmlParser.parseSearchCategories(searchHtml);
    
    if (categoryLinks.length === 0) {
        // No categories found, return empty
        return {
            products: [],
            total: 0,
            query,
            page: options.page,
            pageSize: 0
        };
    }
    
    // Get products from first category
    const firstCategoryUrl = categoryLinks[0].url;
    const categoryResponse = await api.get<string>(firstCategoryUrl);
    const categoryHtml = typeof categoryResponse.data === 'string' ? categoryResponse.data : JSON.stringify(categoryResponse.data);
    
    const products = HtmlParser.parseProducts(categoryHtml);
    return {
        products,
        total: products.length,
        query,
        page: options.page,
        pageSize: products.length
    };
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(
    api: BrowserApiClient,
    query: string
): Promise<SearchSuggestion[]> {
    // Note: Autocomplete typically requires AJAX endpoint
    // For now, return empty array as this requires finding the real endpoint
    return [];
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
    const params: Record<string, string> = { search: query };
    
    if (filters.minPrice !== undefined) params.price_min = String(filters.minPrice);
    if (filters.maxPrice !== undefined) params.price_max = String(filters.maxPrice);
    if (filters.brand) params.brand = filters.brand;
    if (filters.category) params.category = filters.category;
    if (filters.inStock !== undefined) params.in_stock = filters.inStock ? '1' : '0';

    const response = await api.get<string>('/search', { params });
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    const products = HtmlParser.parseProducts(html);
    return {
        products,
        total: products.length,
        query,
        filters
    };
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

    const response = await api.get<string>(`/${categorySlug}`, { params });
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    const products = HtmlParser.parseProducts(html);
    return {
        products,
        total: products.length,
        query: categorySlug,
        page: options.page
    };
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

/**
 * Catalog Actions - business operations for catalog
 * 
 * Operations for working with categories, products, filters.
 */

import { BrowserApiClient } from '../clients/browser-api.client';
import { HtmlParser } from '../utils/html-parser';

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
 * Note: smart.md has a complex dynamic menu structure. 
 * Returning hardcoded known categories for testing purposes.
 */
export async function getCategories(api: BrowserApiClient): Promise<Category[]> {
    // Instead of parsing homepage, load actual category pages to get localized names
    // This ensures we get correct language for category names
    const knownSlugs = ['smartphone', 'laptop', 'televizoare', 'frigidere'];
    const categories: Category[] = [];
    
    for (const slug of knownSlugs) {
        const category = await getCategoryBySlug(api, slug);
        if (category) {
            categories.push(category);
        }
    }
    
    return categories;
}

/**
 * Получить категорию по slug
 */
export async function getCategoryBySlug(
    api: BrowserApiClient,
    slug: string
): Promise<Category | null> {
    try {
        const response = await api.get<string>(`/${slug}`, {
            waitForSelector: '.custom_product_content[data-visely-article-product-id]'
        });
        const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        return HtmlParser.parseCategoryPage(html, slug);
    } catch {
        return null;
    }
}

/**
 * Получить товары категории
 */
export async function getCategoryProducts(
    api: BrowserApiClient,
    categorySlug: string,
    options: {
        page?: number;
        limit?: number;
        sort?: 'price_asc' | 'price_desc' | 'popular' | 'new';
        filters?: Record<string, string>;
    } = {}
): Promise<CatalogPage> {
    const params: Record<string, string> = {
        q: '', // Required by smart.md
        page: '1' // Always 1, real pagination via offset
    };
    
    // smart.md uses offset for pagination (40 items per page)
    // offset=0 (page 1), offset=40 (page 2), offset=80 (page 3), etc.
    const limit = options.limit || 40;
    const offset = ((options.page || 1) - 1) * limit;
    params.offset = String(offset);
    
    // smart.md uses sortBy with values like 'price-asc', 'price-desc'
    if (options.sort) {
        const sortMap: Record<string, string> = {
            'price_asc': 'price-asc',
            'price_desc': 'price-desc',
            'popular': 'popularity',
            'new': 'newest'
        };
        params.sortBy = sortMap[options.sort] || options.sort;
    }
    
    if (options.filters) {
        Object.assign(params, options.filters);
    }

    const response = await api.get<string>(`/${categorySlug}`, { 
        waitForSelector: '.custom_product_content[data-visely-article-product-id]',
        params
    });
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    const catalogPage = HtmlParser.parseCatalogPage(html, categorySlug, options.page || 1);
    
    // Debug: log if no products found
    if (catalogPage.products.length === 0) {
        console.warn(`⚠️  No products found for category: ${categorySlug}`);
        console.warn(`   HTML length: ${html.length} characters`);
        console.warn(`   Page title: ${html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'N/A'}`);
    }
    
    return catalogPage;
}

/**
 * Получить детали товара по ID
 */
export async function getProductById(
    api: BrowserApiClient,
    productId: string | number
): Promise<Product | null> {
    try {
        const response = await api.get<string>(`/product/${productId}`);
        const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        return HtmlParser.parseProductDetails(html);
    } catch {
        return null;
    }
}

/**
 * Получить детали товара по slug (URL)
 */
export async function getProductBySlug(
    api: BrowserApiClient,
    slug: string
): Promise<Product | null> {
    try {
        const response = await api.get<string>(`/${slug}`);
        const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        return HtmlParser.parseProductDetails(html);
    } catch {
        return null;
    }
}

/**
 * Получить доступные фильтры для категории
 */
export async function getCategoryFilters(
    api: BrowserApiClient,
    categorySlug: string
): Promise<CatalogFilter[]> {
    const response = await api.get<string>(`/${categorySlug}`);
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    return HtmlParser.parseFilters(html);
}

/**
 * Получить похожие товары
 */
export async function getSimilarProducts(
    api: BrowserApiClient,
    productId: string | number,
    limit: number = 4
): Promise<Product[]> {
    // Get product page and parse similar products section
    const response = await api.get<string>(`/product/${productId}`);
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    // Parse similar products from the product page
    const products = HtmlParser.parseProducts(html);
    return products.slice(0, limit);
}

/**
 * Получить товары по акции/распродаже
 */
export async function getPromotionProducts(
    api: BrowserApiClient,
    promotionType: 'sale' | 'new' | 'popular' | 'recommended',
    limit: number = 12
): Promise<Product[]> {
    // Map promotion types to possible URL paths
    const urlMap: Record<string, string> = {
        'sale': '/promotii',
        'new': '/new',
        'popular': '/popular',
        'recommended': '/'
    };
    
    const url = urlMap[promotionType] || '/';
    const response = await api.get<string>(url);
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const products = HtmlParser.parseProducts(html);
    return products.slice(0, limit);
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

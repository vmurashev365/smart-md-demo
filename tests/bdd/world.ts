/**
 * BDD World - shared state for Cucumber steps
 * 
 * Contains:
 * - API client (Mock or Real)
 * - Operation results
 * - Test context
 */

import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { ApiClient, createApiClient } from '../api/client/apiClient';
import { MockApiClient, resetMockState } from '../api/mocks/mock-api-client';
import { SearchResult } from '../api/actions/search.actions';
import { CreditCalculation } from '../api/actions/credit.actions';
import { Cart } from '../api/actions/cart.actions';
import { Product, Category, CatalogPage } from '../api/actions/catalog.actions';

// Mode: mock (default) or real
const USE_MOCK_API = process.env.USE_REAL_API !== 'true';

export interface ApiWorldParameters {
    baseURL?: string;
    language?: 'ru' | 'ro';
    useMock?: boolean;
}

/**
 * Cucumber World with API context
 */
export class ApiWorld extends World<ApiWorldParameters> {
    // API client
    api!: ApiClient;
    
    // Search results
    searchResult?: SearchResult;
    searchQuery?: string;
    
    // Credit calculator
    creditCalculation?: CreditCalculation;
    selectedTermMonths?: number;
    
    // Cart
    cart?: Cart;
    lastAddedProductId?: string | number;
    
    // Catalog
    categories?: Category[];
    currentCategory?: Category;
    catalogPage?: CatalogPage;
    
    // Products
    currentProduct?: Product;
    productList?: Product[];
    
    // Localization
    currentLanguage: 'ru' | 'ro' = 'ru';
    
    // Errors (for negative scenarios)
    lastError?: Error;
    
    constructor(options: IWorldOptions<ApiWorldParameters>) {
        super(options);
    }

    /**
     * Initialize API client (Mock or Real)
     */
    async initApi(): Promise<void> {
        const useMock = this.parameters.useMock ?? USE_MOCK_API;
        
        if (useMock) {
            // Use Mock API
            console.log('[BDD] Using Mock API Client');
            resetMockState();
            this.api = new MockApiClient({
                baseURL: this.parameters.baseURL || 'https://www.smart.md',
            });
        } else {
            // Use real API
            console.log('[BDD] Using Real API Client');
            this.api = await createApiClient({
                baseURL: this.parameters.baseURL || 'https://www.smart.md',
                language: this.parameters.language || 'ru'
            });
        }
        
        this.currentLanguage = this.parameters.language || 'ru';
    }

    /**
     * Close API client
     */
    async disposeApi(): Promise<void> {
        if (this.api) {
            await this.api.dispose();
        }
    }

    /**
     * Switch language
     */
    async setLanguage(language: 'ru' | 'ro'): Promise<void> {
        await this.api.setLanguage(language);
        this.currentLanguage = language;
    }

    /**
     * Сброс состояния между сценариями
     */
    reset(): void {
        this.searchResult = undefined;
        this.searchQuery = undefined;
        this.creditCalculation = undefined;
        this.selectedTermMonths = undefined;
        this.cart = undefined;
        this.lastAddedProductId = undefined;
        this.currentCategory = undefined;
        this.catalogPage = undefined;
        this.currentProduct = undefined;
        this.productList = undefined;
        this.lastError = undefined;
        
        // Reset Mock state
        if (USE_MOCK_API) {
            resetMockState();
        }
    }
}

setWorldConstructor(ApiWorld);

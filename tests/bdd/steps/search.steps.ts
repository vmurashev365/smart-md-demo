/**
 * Search BDD Steps
 * 
 * Steps use Actions + Assertions.
 * No HTTP or JSON in steps.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { ApiWorld } from '../world';

// Actions
import { 
    searchProducts, 
    getSearchSuggestions,
    searchWithFilters 
} from '../../api/actions/search.actions';

// Assertions
import {
    expectSearchHasResults,
    expectSearchEmpty,
    expectSearchResultsRelevant,
    expectAllProductsHaveRequiredFields,
    expectProductsInPriceRange,
    expectProductsFromBrand,
    expectSuggestionsRelevant
} from '../../api/assertions/search.assertions';

// === GIVEN ===

Given('user is in category {string}', async function (this: ApiWorld, category: string) {
    this.currentCategory = category;
});

// === WHEN ===

When('user searches for {string}', async function (this: ApiWorld, query: string) {
    this.searchQuery = query;
    
    // If there's a current category, apply filter
    if (this.currentCategory) {
        this.searchResult = await searchWithFilters(this.api, query, {
            category: this.currentCategory
        });
    } else {
        this.searchResult = await searchProducts(this.api, query);
    }
});

When('user types {string} in search box', async function (this: ApiWorld, query: string) {
    this.searchQuery = query;
    this.suggestions = await getSearchSuggestions(this.api, query);
});

When('applies price filter from {int} to {int} MDL', async function (
    this: ApiWorld,
    minPrice: number,
    maxPrice: number
) {
    this.searchResult = await searchWithFilters(this.api, this.searchQuery || '', {
        minPrice,
        maxPrice
    });
});

When('applies brand filter {string}', async function (this: ApiWorld, brand: string) {
    this.searchResult = await searchWithFilters(this.api, this.searchQuery || '', {
        brand
    });
});

// === THEN ===

Then('search results contain found products', function (this: ApiWorld) {
    expectSearchHasResults(this.searchResult!);
});

Then('results are relevant to query', function (this: ApiWorld) {
    expectSearchResultsRelevant(this.searchResult!, this.searchQuery!);
});

Then('results contain Samsung products', function (this: ApiWorld) {
    expectProductsFromBrand(this.searchResult!.products, 'Samsung');
});

Then('search results are empty', function (this: ApiWorld) {
    expectSearchEmpty(this.searchResult!);
});

Then('no products found message is displayed', function (this: ApiWorld) {
    // API returns empty array, UI would show message
    expectSearchEmpty(this.searchResult!);
});

Then('search suggestions appear', function (this: ApiWorld) {
    if (!this.suggestions || this.suggestions.length === 0) {
        throw new Error('No search suggestions returned');
    }
});

Then('suggestions contain relevant options', function (this: ApiWorld) {
    expectSuggestionsRelevant(this.suggestions!, this.searchQuery!);
});

Then('all products are in price range {int}-{int} MDL', function (
    this: ApiWorld,
    minPrice: number,
    maxPrice: number
) {
    expectProductsInPriceRange(this.searchResult!.products, minPrice, maxPrice);
});

Then('all products are from category {string}', function (this: ApiWorld, category: string) {
    // Category filter validation
    for (const product of this.searchResult!.products) {
        if (product.category && !product.category.toLowerCase().includes(category.toLowerCase())) {
            throw new Error(`Product ${product.id} is not from category ${category}`);
        }
    }
});

Then('all products have required fields', function (this: ApiWorld) {
    expectAllProductsHaveRequiredFields(this.searchResult!.products);
});

Then('more than {int} products found', function (this: ApiWorld, count: number) {
    expectSearchHasResults(this.searchResult!);
    if (this.searchResult!.total <= count) {
        throw new Error(`Expected more than ${count} products, found ${this.searchResult!.total}`);
    }
});

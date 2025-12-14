/**
 * Localization BDD Steps
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { ApiWorld } from '../world';

// Actions
import { searchProducts } from '../../api/actions/search.actions';
import { getCategories, getCategoryProducts } from '../../api/actions/catalog.actions';

// Assertions
import {
    expectProductTitleInRussian,
    expectProductTitleInRomanian,
    expectCategoryNameInRussian,
    expectCategoryNameInRomanian,
    expectSearchResultsInRussian,
    expectSearchResultsInRomanian,
    expectCurrencyMDL
} from '../../api/assertions/localization.assertions';

// === GIVEN ===

Given('the site is in Russian', async function (this: ApiWorld) {
    await this.setLanguage('ru');
});

Given('the site is in Romanian', async function (this: ApiWorld) {
    await this.setLanguage('ro');
});

// === WHEN ===

When('user switches language to Russian', async function (this: ApiWorld) {
    await this.setLanguage('ru');
});

When('user switches language to Romanian', async function (this: ApiWorld) {
    await this.setLanguage('ro');
});

When('user browses catalog', async function (this: ApiWorld) {
    this.categories = await getCategories(this.api);
    this.catalogPage = await getCategoryProducts(this.api, 'smartphones', { limit: 5 });
});

When('user performs search in current language', async function (this: ApiWorld) {
    const query = this.currentLanguage === 'ru' ? 'телефон' : 'telefon';
    this.searchResult = await searchProducts(this.api, query);
    this.searchQuery = query;
});

// === THEN ===

Then('categories are displayed in Russian', function (this: ApiWorld) {
    if (!this.categories || this.categories.length === 0) {
        throw new Error('Categories not loaded');
    }
    
    for (const category of this.categories.slice(0, 5)) {
        expectCategoryNameInRussian(category);
    }
});

Then('categories are displayed in Romanian', function (this: ApiWorld) {
    if (!this.categories || this.categories.length === 0) {
        throw new Error('Categories not loaded');
    }
    
    for (const category of this.categories.slice(0, 5)) {
        expectCategoryNameInRomanian(category);
    }
});

Then('products are displayed in Russian', function (this: ApiWorld) {
    if (!this.catalogPage || this.catalogPage.products.length === 0) {
        throw new Error('Products not loaded');
    }
    
    for (const product of this.catalogPage.products) {
        expectProductTitleInRussian(product);
    }
});

Then('products are displayed in Romanian', function (this: ApiWorld) {
    if (!this.catalogPage || this.catalogPage.products.length === 0) {
        throw new Error('Products not loaded');
    }
    
    for (const product of this.catalogPage.products) {
        expectProductTitleInRomanian(product);
    }
});

Then('search results are in Russian', function (this: ApiWorld) {
    expectSearchResultsInRussian(this.searchResult!);
});

Then('search results are in Romanian', function (this: ApiWorld) {
    expectSearchResultsInRomanian(this.searchResult!);
});

Then('prices are displayed in Moldovan Lei', function (this: ApiWorld) {
    if (!this.catalogPage || this.catalogPage.products.length === 0) {
        throw new Error('Products not loaded');
    }
    
    for (const product of this.catalogPage.products) {
        expectCurrencyMDL(product.currency);
    }
});

Then('content changed to selected language', async function (this: ApiWorld) {
    const categories = await getCategories(this.api);
    
    if (this.currentLanguage === 'ru') {
        expectCategoryNameInRussian(categories[0]);
    } else {
        expectCategoryNameInRomanian(categories[0]);
    }
});

Then('prices remain unchanged', async function (this: ApiWorld) {
    // Get current prices
    const currentCatalog = await getCategoryProducts(this.api, 'smartphone', { limit: 5 });
    
    // Compare with saved prices
    if (this.catalogPage) {
        for (let i = 0; i < Math.min(currentCatalog.products.length, this.catalogPage.products.length); i++) {
            const currentProduct = currentCatalog.products[i];
            const savedProduct = this.catalogPage.products.find(p => p.id === currentProduct.id);
            
            if (savedProduct && currentProduct.price !== savedProduct.price) {
                throw new Error(
                    `Product ${currentProduct.id} price changed: ${savedProduct.price} → ${currentProduct.price}`
                );
            }
        }
    }
});

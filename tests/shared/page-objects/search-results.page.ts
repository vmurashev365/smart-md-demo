/**
 * Search Results Page Object
 *
 * Page object for Smart.md search results page.
 * Handles product list, filtering, and pagination.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { SELECTORS } from '../config/selectors';
import { humanClick, randomDelay } from '../utils/human-like';
import { parsePrice } from '../utils/price-utils';
import { waitForProductListUpdate } from '../utils/wait-utils';
import { joinSelectors } from '../utils/locator-helper';

/**
 * Product card data interface
 */
export interface ProductCardData {
  title: string;
  price: number;
  url: string;
  index: number;
}

/**
 * Search Results Page class
 */
export class SearchResultsPage extends BasePage {
  // ==================== Locators ====================

  /**
   * Search results container
   */
  get resultsContainer(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.searchResults.container));
  }

  /**
   * Product grid
   */
  get productGrid(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.searchResults.productGrid));
  }

  /**
   * All product cards
   */
  get productCards(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.searchResults.productCard));
  }

  /**
   * Result count element
   */
  get resultCount(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.searchResults.resultCount));
  }

  /**
   * No results message
   */
  get noResultsMessage(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.searchResults.noResults));
  }

  /**
   * Pagination
   */
  get pagination(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.searchResults.pagination));
  }

  /**
   * Load more button
   */
  get loadMoreButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.searchResults.loadMore));
  }

  // ==================== Actions ====================

  /**
   * Wait for search results to load
   */
  async waitForResults(): Promise<void> {
    await this.waitForNetworkIdle();
    await this.waitForLoadersToDisappear();
    await randomDelay(300, 500);
  }

  /**
   * Get number of products displayed
   * @returns Product count
   */
  async getProductCount(): Promise<number> {
    await this.waitForResults();
    return await this.productCards.count();
  }

  /**
   * Check if search has results
   * @returns true if results exist
   */
  async hasResults(): Promise<boolean> {
    const count = await this.getProductCount();
    return count > 0;
  }

  /**
   * Check if no results message is displayed
   * @returns true if no results
   */
  async hasNoResults(): Promise<boolean> {
    return await this.noResultsMessage.isVisible();
  }

  /**
   * Get product card by index
   * @param index - Zero-based index
   * @returns Product card locator
   */
  getProductCard(index: number): Locator {
    return this.productCards.nth(index);
  }

  /**
   * Get first product card
   * @returns First product card locator
   */
  get firstProduct(): Locator {
    return this.getProductCard(0);
  }

  /**
   * Click on product by index
   * @param index - Zero-based index
   */
  async clickProduct(index: number): Promise<void> {
    const product = this.getProductCard(index);
    const productLink = product.locator(joinSelectors(SELECTORS.searchResults.productLink));

    // Try clicking the link inside the card first
    if (await productLink.isVisible()) {
      await humanClick(productLink);
    } else {
      // Click the card itself
      await humanClick(product);
    }

    await this.waitForPageLoad();
  }

  /**
   * Click on first product in results
   * For Smart.md, use getByRole('link') to find product links
   */
  async clickFirstProduct(): Promise<void> {
    // Try Smart.md pattern: getByRole('link') for product links
    const productLinks = this.page.getByRole('link').filter({ 
      has: this.page.locator('.custom_product_title, .product-title, h4') 
    });
    
    const firstLink = productLinks.first();
    if (await firstLink.isVisible({ timeout: 3000 })) {
      await humanClick(firstLink);
      await this.waitForPageLoad();
      return;
    }
    
    // Fallback: use old method
    await this.clickProduct(0);
  }

  /**
   * Get product title by index
   * @param index - Zero-based index
   * @returns Product title
   */
  async getProductTitle(index: number): Promise<string> {
    const product = this.getProductCard(index);
    const titleEl = product.locator(joinSelectors(SELECTORS.searchResults.productTitle));
    return (await titleEl.textContent()) || '';
  }

  /**
   * Get product price by index
   * @param index - Zero-based index
   * @returns Product price as number
   */
  async getProductPrice(index: number): Promise<number> {
    const product = this.getProductCard(index);
    const priceEl = product.locator(joinSelectors(SELECTORS.searchResults.productPrice));
    const priceText = (await priceEl.textContent()) || '0';
    return parsePrice(priceText);
  }

  /**
   * Get all product prices
   * @returns Array of prices
   */
  async getAllPrices(): Promise<number[]> {
    const count = await this.getProductCount();
    const prices: number[] = [];

    for (let i = 0; i < count; i++) {
      const price = await this.getProductPrice(i);
      prices.push(price);
    }

    return prices;
  }

  /**
   * Get all product data
   * @param limit - Maximum number of products
   * @returns Array of product data
   */
  async getAllProductData(limit: number = 10): Promise<ProductCardData[]> {
    const count = Math.min(await this.getProductCount(), limit);
    const products: ProductCardData[] = [];

    for (let i = 0; i < count; i++) {
      const product = this.getProductCard(i);
      const title = await this.getProductTitle(i);
      const price = await this.getProductPrice(i);
      const link = product.locator(joinSelectors(SELECTORS.searchResults.productLink));
      const url = (await link.getAttribute('href')) || '';

      products.push({ title, price, url, index: i });
    }

    return products;
  }

  /**
   * Check if all products match a brand
   * @param brand - Brand name to check
   * @returns true if all match
   */
  async allProductsMatchBrand(brand: string): Promise<boolean> {
    const count = await this.getProductCount();
    const brandLower = brand.toLowerCase();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const title = await this.getProductTitle(i);
      if (!title.toLowerCase().includes(brandLower)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Load more products if button exists
   */
  async loadMore(): Promise<void> {
    const loadMoreBtn = this.loadMoreButton;

    if (await loadMoreBtn.isVisible()) {
      await humanClick(loadMoreBtn);
      await waitForProductListUpdate(this.page);
    }
  }

  /**
   * Go to next page of results
   */
  async nextPage(): Promise<void> {
    const nextBtn = this.pagination.locator('a[rel="next"], .next, button:has-text("Next")');

    if (await nextBtn.isVisible()) {
      await humanClick(nextBtn);
      await this.waitForPageLoad();
      await this.waitForResults();
    }
  }

  /**
   * Check if prices are sorted ascending
   * @returns true if sorted ascending
   */
  async isPricesSortedAscending(): Promise<boolean> {
    const prices = await this.getAllPrices();

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] < prices[i - 1]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if prices are sorted descending
   * @returns true if sorted descending
   */
  async isPricesSortedDescending(): Promise<boolean> {
    const prices = await this.getAllPrices();

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Scroll to load more products (infinite scroll)
   * @returns Number of new products loaded
   */
  async scrollToLoadMore(): Promise<number> {
    const initialCount = await this.getProductCount();

    await this.scroll('down');
    await this.scroll('down');
    await randomDelay(500, 1000);

    // Wait for potential new products
    await this.waitForResults();
    
    const newCount = await this.getProductCount();
    return newCount - initialCount;
  }
}

export default SearchResultsPage;

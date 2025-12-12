/**
 * Catalog Page Object
 *
 * Page object for Smart.md catalog/category pages.
 * Handles product filtering, sorting, and browsing.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { SELECTORS } from '../config/selectors';
import { humanClick, humanSelectOption, randomDelay } from '../utils/human-like';
import { parsePrice } from '../utils/price-utils';
import { waitForProductListUpdate } from '../utils/wait-utils';
import { joinSelectors } from '../utils/locator-helper';

/**
 * Catalog Page class
 */
export class CatalogPage extends BasePage {
  // ==================== Locators ====================

  /**
   * Catalog container
   */
  get catalogContainer(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.container));
  }

  /**
   * All product cards
   */
  get productCards(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.productCard));
  }

  /**
   * Filter sidebar
   */
  get filterSidebar(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.filterSidebar));
  }

  /**
   * Brand filter section
   */
  get brandFilter(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.brandFilter));
  }

  /**
   * Price filter section
   */
  get priceFilter(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.priceFilter));
  }

  /**
   * Sort dropdown
   */
  get sortDropdown(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.sortDropdown));
  }

  /**
   * Active filters container
   */
  get activeFilters(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.activeFilters));
  }

  /**
   * Filter tags
   */
  get filterTags(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.filterTag));
  }

  /**
   * Clear all filters button
   */
  get clearFiltersButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.clearFilters));
  }

  /**
   * Product count element
   */
  get productCount(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.catalog.productCount));
  }

  // ==================== Actions ====================

  /**
   * Wait for catalog to load
   */
  async waitForCatalog(): Promise<void> {
    await this.waitForPageLoad();
    await this.waitForLoadersToDisappear();
    await randomDelay(300, 500);
  }

  /**
   * Get number of products displayed
   * @returns Product count
   */
  async getProductCount(): Promise<number> {
    await this.waitForCatalog();
    return await this.productCards.count();
  }

  /**
   * Get total product count from counter
   * @returns Total products number
   */
  async getTotalProductCount(): Promise<number> {
    const countText = (await this.productCount.textContent()) || '0';
    const match = countText.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
 * Apply brand filter with multiple fallback strategies
 * @param brand - Brand name
 */
async applyBrandFilter(brand: string): Promise<void> {
  // Strategy 1: Try data-testid
  let brandCheckbox = this.filterSidebar.locator(
    `[data-testid="brand-filter-${brand.toLowerCase()}"]`
  );

  if (!(await brandCheckbox.isVisible({ timeout: 2000 }).catch(() => false))) {
    // Strategy 2: Try value attribute
    brandCheckbox = this.filterSidebar.locator(
      `${SELECTORS.catalog.filterCheckbox}[value="${brand}"], ` +
        `${SELECTORS.catalog.filterCheckbox}[value="${brand.toLowerCase()}"]`
    );
  }

  if (!(await brandCheckbox.isVisible({ timeout: 2000 }).catch(() => false))) {
    // Strategy 3: Try label text with input
    brandCheckbox = this.filterSidebar.locator(
      `${SELECTORS.catalog.filterLabel}:has-text("${brand}") input, ` +
        `label:has-text("${brand}") input`
    );
  }

  // Scroll to filter section
  await this.brandFilter.scrollIntoViewIfNeeded().catch(() => {});
  await randomDelay(200, 400);

  // Click on checkbox or label
  if (await brandCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await humanClick(brandCheckbox);
  } else {
    // Strategy 4: Click on label text directly
    const brandLabel = this.filterSidebar.locator(
      `label:has-text("${brand}"), ` +
        `[class*="filter"] >> text="${brand}", ` +
        `.brand-item:has-text("${brand}")`
    );

    if (await brandLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await humanClick(brandLabel);
    } else {
      throw new Error(`Cannot find brand filter for: ${brand}`);
    }
  }

  // Wait for products to update
  await waitForProductListUpdate(this.page);
}

  /**
   * Remove brand filter
   * @param brand - Brand name
   */
  async removeBrandFilter(brand: string): Promise<void> {
    // Try to click the filter tag
    const filterTag = this.filterTags.filter({ hasText: brand });

    if (await filterTag.isVisible()) {
      const removeBtn = filterTag.locator('button, .close, .remove');
      if (await removeBtn.isVisible()) {
        await humanClick(removeBtn);
      } else {
        await humanClick(filterTag);
      }
      await waitForProductListUpdate(this.page);
    } else {
      // Uncheck the checkbox
      await this.applyBrandFilter(brand);
    }
  }

  /**
   * Apply sorting with multiple text variants
   * Handles both RO and RU text for sort options
   * @param sortOption - Sort option text (will try variations)
   */
  async applySorting(sortOption: string): Promise<void> {
    const dropdown = this.sortDropdown;

    // Define sort text variants for common options
    const sortVariants: Record<string, string[]> = {
      priceAsc: [
        'Prețul: mic spre mare',
        'Цена: по возрастанию',
        'Price: low to high',
        'preț crescător',
        'pret',
      ],
      priceDesc: [
        'Prețul: mare spre mic',
        'Цена: по убыванию',
        'Price: high to low',
        'preț descrescător',
      ],
      popularity: ['Popular', 'Популярные', 'Popularity'],
      newest: ['Nou', 'Новинки', 'Newest', 'New'],
    };

    // Build list of texts to try
    let textsToTry = [sortOption];

    // Add variants if sortOption matches a known key
    for (const [, variants] of Object.entries(sortVariants)) {
      if (variants.some((v) => v.toLowerCase().includes(sortOption.toLowerCase()))) {
        textsToTry = [...textsToTry, ...variants];
        break;
      }
    }

    // Check if it's a select element or custom dropdown
    const tagName = await dropdown.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'select') {
      await humanSelectOption(dropdown, sortOption);
    } else {
      // Custom dropdown - click to open
      await humanClick(dropdown);
      await randomDelay(200, 400);

      // Try each text variant
      let clicked = false;
      for (const text of textsToTry) {
        const option = this.page.locator(
          `${SELECTORS.catalog.sortOption}:has-text("${text}"), ` +
            `[role="option"]:has-text("${text}"), ` +
            `.dropdown-item:has-text("${text}"), ` +
            `li:has-text("${text}")`
        );

        if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
          await humanClick(option);
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        // Close dropdown if no option found
        await this.page.keyboard.press('Escape');
        throw new Error(`Sort option not found: ${sortOption}`);
      }
    }

    await waitForProductListUpdate(this.page);
  }

  /**
   * Clear all filters
   */
  async clearAllFilters(): Promise<void> {
    const clearBtn = this.clearFiltersButton;

    if (await clearBtn.isVisible()) {
      await humanClick(clearBtn);
      await waitForProductListUpdate(this.page);
    }
  }

  /**
   * Check if filter tag is displayed
   * @param filterName - Filter name
   * @returns true if displayed
   */
  async isFilterTagDisplayed(filterName: string): Promise<boolean> {
    const filterTag = this.filterTags.filter({ hasText: filterName });
    return await filterTag.isVisible();
  }

  /**
   * Check if any filter tags are displayed
   * @returns true if any filters active
   */
  async hasActiveFilters(): Promise<boolean> {
    const count = await this.filterTags.count();
    return count > 0;
  }

  /**
   * Get all active filter names
   * @returns Array of filter names
   */
  async getActiveFilterNames(): Promise<string[]> {
    const count = await this.filterTags.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.filterTags.nth(i).textContent();
      if (text) {
        names.push(text.trim());
      }
    }

    return names;
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
   * Get product title by index
   * @param index - Zero-based index
   * @returns Product title
   */
  async getProductTitle(index: number): Promise<string> {
    const card = this.getProductCard(index);
    const titleEl = card.locator(joinSelectors(SELECTORS.catalog.productTitle));
    return (await titleEl.textContent()) || '';
  }

  /**
   * Get product price by index
   * @param index - Zero-based index
   * @returns Product price
   */
  async getProductPrice(index: number): Promise<number> {
    const card = this.getProductCard(index);
    const priceEl = card.locator(joinSelectors(SELECTORS.catalog.productPrice));
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

    for (let i = 0; i < Math.min(count, 20); i++) {
      const price = await this.getProductPrice(i);
      prices.push(price);
    }

    return prices;
  }

  /**
   * Check if all visible products match brand
   * @param brand - Brand name
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
   * Check if products are sorted by price ascending
   * @returns true if sorted correctly
   */
  async isSortedByPriceAscending(): Promise<boolean> {
    const prices = await this.getAllPrices();

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] < prices[i - 1]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if products are sorted by price descending
   * @returns true if sorted correctly
   */
  async isSortedByPriceDescending(): Promise<boolean> {
    const prices = await this.getAllPrices();

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Click on product to view details
   * @param index - Product index
   */
  async clickProduct(index: number): Promise<void> {
    const card = this.getProductCard(index);
    await humanClick(card);
    await this.waitForPageLoad();
  }

  /**
   * Check if mobile grid layout is displayed
   * @returns true if mobile grid
   */
  async isMobileGrid(): Promise<boolean> {
    const mobileGrid = this.page.locator(joinSelectors(SELECTORS.mobile.productGrid));
    return await mobileGrid.isVisible();
  }

  /**
   * Check if product cards are touch-friendly
   * @returns true if touch-friendly (large enough)
   */
  async areProductsTouchFriendly(): Promise<boolean> {
    const firstCard = this.getProductCard(0);
    const box = await firstCard.boundingBox();

    if (!box) return false;

    // Touch-friendly minimum: 44x44 pixels (Apple HIG)
    return box.width >= 44 && box.height >= 44;
  }
}

export default CatalogPage;

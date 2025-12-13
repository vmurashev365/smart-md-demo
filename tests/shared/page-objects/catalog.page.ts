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

  /**
   * Pagination label showing current visible range (e.g. "1 - 40 din 629 produse")
   */
  get paginationRangeLabel(): Locator {
    return this.page.locator('#custom_pagination_content .custom_pagination_label label').first();
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
   * Get the upper bound of the visible product range from pagination.
   * Example: "1 - 40 din 629 produse" => 40
   */
  async getVisibleProductsUpperBound(): Promise<number> {
    await this.waitForCatalog();

    const label = this.paginationRangeLabel;
    await label.waitFor({ state: 'visible', timeout: 10_000 });

    const text = ((await label.textContent()) || '').replace(/\s+/g, ' ').trim();

    // Most robust: extract "lower - upper" regardless of language.
    const rangeMatch = text.match(/\b(\d+)\s*-\s*(\d+)\b/);
    if (rangeMatch) {
      return Number.parseInt(rangeMatch[2], 10);
    }

    // Language-aware fallback (RO/RU/EN-ish)
    const upperMatch = text.match(/-\s*(\d+)\s*(?:din|из|of)\b/i);
    if (upperMatch) {
      return Number.parseInt(upperMatch[1], 10);
    }

    throw new Error(`Cannot parse visible products upper bound from: "${text}"`);
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
  await this.waitForCatalog();

  // Strategy 1 (primary): Codegen/recorder shows a visible brand quicklink as role=link.
  // This is the most stable approach (matches recorded behavior from step_001->step_002).
  const quickLink = this.page.getByRole('link', { name: brand, exact: true });
  
  try {
    // Check if quicklink is visible with a reasonable timeout
    if (await quickLink.isVisible({ timeout: 3000 })) {
      await humanClick(quickLink);
      await waitForProductListUpdate(this.page);
      return;
    }
  } catch {
    // Quicklink not found, proceed to fallback
  }

  // Strategy 2 (fallback): Click checkbox inside #search_facet_metaf_vendor (Visely filter panel).
  const vendorFacet = this.page.locator('#search_facet_metaf_vendor').first();
  
  try {
    await vendorFacet.waitFor({ state: 'visible', timeout: 8000 });
    await vendorFacet.scrollIntoViewIfNeeded().catch(() => {});
    await randomDelay(200, 400);

    // Try clicking the label that contains the brand text
    const brandLabel = vendorFacet.locator('label', { hasText: brand }).first();
    if (await brandLabel.isVisible({ timeout: 3000 })) {
      await humanClick(brandLabel);
      await waitForProductListUpdate(this.page);
      return;
    }

    // Last resort: click checkbox by value attribute
    const checkbox = vendorFacet.locator(`input[type="checkbox"][value="${brand}"]`).first();
    if (await checkbox.isVisible({ timeout: 2000 })) {
      await humanClick(checkbox);
      await waitForProductListUpdate(this.page);
      return;
    }
  } catch (error) {
    throw new Error(`Cannot find brand filter for: ${brand}. Error: ${error}`);
  }

  throw new Error(`Cannot find brand filter for: ${brand}`);
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
   * Apply sorting option
   * Smart.md uses custom radio-button dropdown with Romanian text
   * @param sortOption - Sort option text (e.g., "Ieftine", "Scumpe", "Populare")
   */
  async applySorting(sortOption: string): Promise<void> {
    console.log(`[applySorting] Requested sort option: "${sortOption}"`);
    
    // Step 1: Open sort dropdown by clicking "Populare" button
    try {
      console.log('[applySorting] Looking for "Populare" button...');
      const sortButton = this.page.getByText('Populare').nth(1);
      console.log('[applySorting] Clicking to open dropdown...');
      await humanClick(sortButton);
      await randomDelay(500, 700);
      console.log('[applySorting] ✓ Dropdown opened');
    } catch (error) {
      console.log(`[applySorting] Failed to open dropdown: ${error}`);
      throw new Error(`Cannot open sort dropdown: ${error}`);
    }

    // Step 2: Click the radio button with the specified option
    console.log(`[applySorting] Looking for radio button: "${sortOption}"`);
    try {
      const radio = this.page.getByRole('radio', { name: sortOption });
      
      // Wait for radio to be visible
      await radio.waitFor({ state: 'visible', timeout: 5000 });
      console.log('[applySorting] Radio button found and visible');
      
      // Click the radio button
      await humanClick(radio);
      await randomDelay(300, 500);
      console.log('[applySorting] ✓ Radio button clicked');
    } catch (error) {
      console.log(`[applySorting] ✗ Failed to find/click radio button: ${error}`);
      throw new Error(`Sort option not found: "${sortOption}". Error: ${error}`);
    }

    console.log('[applySorting] Waiting for product list update...');
    await waitForProductListUpdate(this.page);
    console.log('[applySorting] ✓ Sorting complete');
  }

  /**
   * Clear all filters
   */
  async clearAllFilters(): Promise<void> {
    // Smart.md uses "Curata tot" text link in filter sidebar
    const clearBtn = this.page.getByText('Curata tot').first();

    if (await clearBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await humanClick(clearBtn);
      await waitForProductListUpdate(this.page);
    } else {
      console.log('[clearAllFilters] Clear button not visible, no filters to clear');
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
    // Use cards with data-visely-article-product-id to avoid skeleton loaders
    const cards = this.page.locator('.custom_product_content[data-visely-article-product-id]');
    const card = cards.nth(index);
    
    // Smart.md structure: div.custom_product_price > span.regular (current price) + span.old (strikethrough)
    // IMPORTANT: Take only span.regular to avoid getting both prices concatenated!
    const selectors = [
      '.custom_product_price span.regular',  // Primary: current price only
      '.custom_product_price span:first-child', // Fallback: first span
      '[itemprop="price"]',
      '.custom_product_price',
    ];
    
    for (const selector of selectors) {
      try {
        const priceEl = card.locator(selector).first();
        if (await priceEl.isVisible({ timeout: 1000 })) {
          const priceText = (await priceEl.textContent()) || '0';
          const price = parsePrice(priceText);
          if (price > 0) {
            return price;
          }
        }
      } catch {
        // Try next selector
      }
    }
    
    // Last resort: get all text content and extract price
    const cardText = await card.textContent();
    return parsePrice(cardText || '0');
  }

  /**
   * Get all product prices (up to 20 products)
   * @returns Array of prices
   */
  async getAllPrices(): Promise<number[]> {
    console.log('[getAllPrices] Getting product prices...');
    
    // Use cards with data-visely-article-product-id to avoid skeleton loaders
    const cards = this.page.locator('.custom_product_content[data-visely-article-product-id]');
    const count = await cards.count();
    console.log(`[getAllPrices] Found ${count} product cards`);
    
    const prices: number[] = [];
    const checkLimit = Math.min(count, 20);

    for (let i = 0; i < checkLimit; i++) {
      try {
        const price = await this.getProductPrice(i);
        
        if (price > 0) {
          prices.push(price);
          console.log(`[getAllPrices] Card ${i}: ${price} MDL`);
        } else {
          console.log(`[getAllPrices] Card ${i}: Invalid price`);
        }
      } catch (error) {
        console.log(`[getAllPrices] Error getting price for card ${i}`);
      }
    }

    console.log(`[getAllPrices] Collected ${prices.length} prices`);
    return prices;
  }

  /**
   * Check if all visible products match brand
   * Checks product titles (h4 elements) for brand or alias presence
   * @param brand - Brand name
   * @returns true if at least 90% of products match
   */
  async allProductsMatchBrand(brand: string): Promise<boolean> {
    await this.waitForCatalog();
    await randomDelay(2000, 2500); // Extra wait for lazy-loaded content
    
    // Get cards with data-visely-article-product-id (real product cards, not skeletons)
    const allCards = this.page.locator('.custom_product_content[data-visely-article-product-id]');
    const count = await allCards.count();
    
    if (count === 0) {
      console.log('[allProductsMatchBrand] No product cards found');
      return false;
    }

    console.log(`[allProductsMatchBrand] Found ${count} product cards with data-visely-article-product-id`);

    const brandLower = brand.toLowerCase();
    // Check up to 40 products (default page size)
    const checkLimit = Math.min(count, 40);

    // Brand aliases: Apple products show as "iPhone", not "Apple iPhone"
    const brandAliases: Record<string, string[]> = {
      apple: ['iphone', 'ipad', 'macbook', 'airpods'],
      samsung: ['galaxy', 'samsung'],
      xiaomi: ['redmi', 'poco', 'xiaomi'],
      google: ['pixel'],
    };

    const aliases = brandAliases[brandLower] || [brandLower];
    let matchedCount = 0;
    let checkedCount = 0;

    for (let i = 0; i < checkLimit; i++) {
      const card = allCards.nth(i);
      
      // Check if card is visible
      const isVisible = await card.isVisible().catch(() => false);
      if (!isVisible) {
        console.log(`[allProductsMatchBrand] Card ${i + 1} skipped (not visible)`);
        continue;
      }
      
      try {
        // Get product title (h4 element inside card)
        const titleLocator = card.locator('.custom_product_title h4, h4').first();
        const titleText = (await titleLocator.textContent({ timeout: 3000 }).catch(() => ''))?.toLowerCase().trim() || '';
        
        // Skip empty titles (skeleton loaders)
        if (titleText.length < 3) {
          console.log(`[allProductsMatchBrand] Card ${i + 1} skipped (title empty)`);
          continue;
        }
        
        checkedCount++;
        const hasMatch = aliases.some(alias => titleText.includes(alias));
        
        if (hasMatch) {
          matchedCount++;
          console.log(`[allProductsMatchBrand] Card ${i + 1} ✓ matched: "${titleText.slice(0, 50)}"`);
        } else {
          // Fallback: check href
          const link = card.locator('a').first();
          const href = (await link.getAttribute('href', { timeout: 1000 }).catch(() => '')) || '';
          
          if (aliases.some(alias => href.toLowerCase().includes(alias))) {
            matchedCount++;
            console.log(`[allProductsMatchBrand] Card ${i + 1} ✓ matched by href`);
          } else {
            console.log(`[allProductsMatchBrand] Card ${i + 1} ✗ doesn't match. Title: "${titleText}"`);
          }
        }
      } catch (error) {
        console.warn(`[allProductsMatchBrand] Could not check card ${i + 1}: ${error}`);
      }
    }

    if (checkedCount < 5) {
      console.log(`[allProductsMatchBrand] ERROR: Only ${checkedCount} cards checked!`);
      return false;
    }

    const matchRate = matchedCount / checkedCount;
    console.log(`[allProductsMatchBrand] ✓ Matched ${matchedCount}/${checkedCount} cards (${(matchRate * 100).toFixed(0)}%)`);
    
    // Require at least 90% match
    return matchRate >= 0.9;
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

/**
 * Filter Sidebar Component
 *
 * Component object for Smart.md catalog filter sidebar.
 * Handles brand, price, and other filters.
 */

import { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../../config/selectors';
import { humanClick, humanType, randomDelay } from '../../utils/human-like';
import { waitForProductListUpdate } from '../../utils/wait-utils';

/**
 * Filter Sidebar Component class
 */
export class FilterSidebarComponent {
  constructor(private page: Page) {}

  // ==================== Locators ====================

  /**
   * Sidebar container
   */
  get container(): Locator {
    return this.page.locator(SELECTORS.catalog.filterSidebar);
  }

  /**
   * Brand filter section
   */
  get brandFilter(): Locator {
    return this.page.locator(SELECTORS.catalog.brandFilter);
  }

  /**
   * Price filter section
   */
  get priceFilter(): Locator {
    return this.page.locator(SELECTORS.catalog.priceFilter);
  }

  /**
   * Color filter section
   */
  get colorFilter(): Locator {
    return this.page.locator(SELECTORS.catalog.colorFilter);
  }

  /**
   * Active filter tags
   */
  get activeFilters(): Locator {
    return this.page.locator(SELECTORS.catalog.activeFilters);
  }

  /**
   * Filter tags
   */
  get filterTags(): Locator {
    return this.page.locator(SELECTORS.catalog.filterTag);
  }

  /**
   * Clear filters button
   */
  get clearButton(): Locator {
    return this.page.locator(SELECTORS.catalog.clearFilters);
  }

  // ==================== Actions ====================

  /**
   * Check if sidebar is visible
   * @returns true if visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }

  /**
   * Apply brand filter
   * @param brand - Brand name
   */
  async filterByBrand(brand: string): Promise<void> {
    // Scroll to brand filter
    await this.brandFilter.scrollIntoViewIfNeeded();
    await randomDelay(200, 300);

    // Find and click brand checkbox
    const brandCheckbox = this.container.locator(
      `label:has-text("${brand}") input[type="checkbox"], ` +
        `input[type="checkbox"][value="${brand}"], ` +
        `[data-brand="${brand}"]`
    );

    if (await brandCheckbox.isVisible()) {
      await humanClick(brandCheckbox);
    } else {
      // Click on label
      const brandLabel = this.container.locator(`label:has-text("${brand}")`);
      await humanClick(brandLabel);
    }

    await waitForProductListUpdate(this.page);
  }

  /**
   * Apply price range filter
   * @param minPrice - Minimum price
   * @param maxPrice - Maximum price
   */
  async filterByPriceRange(minPrice: number, maxPrice: number): Promise<void> {
    // Scroll to price filter
    await this.priceFilter.scrollIntoViewIfNeeded();
    await randomDelay(200, 300);

    // Find min/max inputs
    const minInput = this.priceFilter.locator('input[name*="min"], input.price-min');
    const maxInput = this.priceFilter.locator('input[name*="max"], input.price-max');

    if (await minInput.isVisible()) {
      await minInput.clear();
      await humanType(minInput, minPrice.toString());
    }

    if (await maxInput.isVisible()) {
      await maxInput.clear();
      await humanType(maxInput, maxPrice.toString());
    }

    // Apply filter (press Enter or click apply)
    const applyBtn = this.priceFilter.locator('button, .apply');
    if (await applyBtn.isVisible()) {
      await humanClick(applyBtn);
    } else {
      await maxInput.press('Enter');
    }

    await waitForProductListUpdate(this.page);
  }

  /**
   * Clear all active filters
   */
  async clearAll(): Promise<void> {
    if (await this.clearButton.isVisible()) {
      await humanClick(this.clearButton);
      await waitForProductListUpdate(this.page);
    }
  }

  /**
   * Remove specific filter tag
   * @param filterName - Filter name to remove
   */
  async removeFilter(filterName: string): Promise<void> {
    const filterTag = this.filterTags.filter({ hasText: filterName });

    if (await filterTag.isVisible()) {
      const removeBtn = filterTag.locator('button, .close, .remove, svg');
      if (await removeBtn.isVisible()) {
        await humanClick(removeBtn);
      } else {
        await humanClick(filterTag);
      }
      await waitForProductListUpdate(this.page);
    }
  }

  /**
   * Get list of active filter names
   * @returns Array of filter names
   */
  async getActiveFilterNames(): Promise<string[]> {
    const count = await this.filterTags.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.filterTags.nth(i).textContent();
      if (text) {
        names.push(text.replace(/[×✕x]/g, '').trim());
      }
    }

    return names;
  }

  /**
   * Check if filter is active
   * @param filterName - Filter name
   * @returns true if active
   */
  async isFilterActive(filterName: string): Promise<boolean> {
    const activeFilters = await this.getActiveFilterNames();
    return activeFilters.some(f => f.toLowerCase().includes(filterName.toLowerCase()));
  }

  /**
   * Check if any filters are active
   * @returns true if any filter active
   */
  async hasActiveFilters(): Promise<boolean> {
    const count = await this.filterTags.count();
    return count > 0;
  }

  /**
   * Get available brands
   * @returns Array of brand names
   */
  async getAvailableBrands(): Promise<string[]> {
    const brands: string[] = [];
    const brandLabels = this.brandFilter.locator('label');
    const count = await brandLabels.count();

    for (let i = 0; i < count; i++) {
      const text = await brandLabels.nth(i).textContent();
      if (text) {
        brands.push(text.trim());
      }
    }

    return brands;
  }
}

export default FilterSidebarComponent;

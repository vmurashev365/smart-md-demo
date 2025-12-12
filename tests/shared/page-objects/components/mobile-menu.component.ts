/**
 * Mobile Menu Component
 *
 * Component object for Smart.md mobile navigation drawer.
 * Handles mobile category navigation and menu interactions.
 */

import { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../../config/selectors';
import { humanClick, randomDelay } from '../../utils/human-like';

/**
 * Mobile Menu Component class
 */
export class MobileMenuComponent {
  constructor(private page: Page) {}

  // ==================== Locators ====================

  /**
   * Menu drawer container
   */
  get drawer(): Locator {
    return this.page.locator(SELECTORS.mobile.menuDrawer);
  }

  /**
   * Close button
   */
  get closeButton(): Locator {
    return this.page.locator(SELECTORS.mobile.menuClose);
  }

  /**
   * Category links
   */
  get categoryLinks(): Locator {
    return this.page.locator(SELECTORS.mobile.categoryLink);
  }

  /**
   * Back button (for nested menus)
   */
  get backButton(): Locator {
    return this.page.locator(SELECTORS.mobile.backButton);
  }

  /**
   * Mobile search
   */
  get searchInput(): Locator {
    return this.page.locator(SELECTORS.mobile.mobileSearch);
  }

  /**
   * Mobile cart icon
   */
  get cartIcon(): Locator {
    return this.page.locator(SELECTORS.mobile.mobileCart);
  }

  /**
   * Bottom navigation
   */
  get bottomNav(): Locator {
    return this.page.locator(SELECTORS.mobile.bottomNav);
  }

  // ==================== Actions ====================

  /**
   * Check if drawer is open
   * @returns true if open
   */
  async isOpen(): Promise<boolean> {
    return await this.drawer.isVisible();
  }

  /**
   * Wait for drawer to open
   */
  async waitForOpen(): Promise<void> {
    await this.drawer.waitFor({ state: 'visible' });
    await randomDelay(300, 500);
  }

  /**
   * Wait for drawer to close
   */
  async waitForClose(): Promise<void> {
    await this.drawer.waitFor({ state: 'hidden' });
    await randomDelay(200, 400);
  }

  /**
   * Close the menu drawer
   */
  async close(): Promise<void> {
    if (await this.closeButton.isVisible()) {
      await humanClick(this.closeButton);
    } else {
      // Click outside to close
      await this.page.click('body', { position: { x: 10, y: 10 }, force: true });
    }
    await this.waitForClose();
  }

  /**
   * Get all main category names
   * @returns Array of category names
   */
  async getCategoryNames(): Promise<string[]> {
    const count = await this.categoryLinks.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.categoryLinks.nth(i).textContent();
      if (text) {
        names.push(text.trim());
      }
    }

    return names;
  }

  /**
   * Click on category
   * @param categoryName - Category name
   */
  async clickCategory(categoryName: string): Promise<void> {
    const categoryLink = this.categoryLinks.filter({ hasText: categoryName });
    await humanClick(categoryLink);
    await randomDelay(300, 500);
  }

  /**
   * Navigate to category and wait for page load
   * @param categoryName - Category name
   */
  async navigateToCategory(categoryName: string): Promise<void> {
    await this.clickCategory(categoryName);

    // Wait for either submenu or page navigation
    await Promise.race([
      this.page.waitForLoadState('networkidle'),
      this.drawer.waitFor({ state: 'hidden' }),
    ]);
  }

  /**
   * Go back in nested menu
   */
  async goBack(): Promise<void> {
    if (await this.backButton.isVisible()) {
      await humanClick(this.backButton);
      await randomDelay(200, 400);
    }
  }

  /**
   * Check if category exists in menu
   * @param categoryName - Category name
   * @returns true if exists
   */
  async hasCategory(categoryName: string): Promise<boolean> {
    const categories = await this.getCategoryNames();
    return categories.some(c => c.toLowerCase().includes(categoryName.toLowerCase()));
  }

  /**
   * Tap on mobile cart
   */
  async tapCart(): Promise<void> {
    await humanClick(this.cartIcon);
  }

  /**
   * Check if bottom navigation is visible
   * @returns true if visible
   */
  async hasBottomNav(): Promise<boolean> {
    return await this.bottomNav.isVisible();
  }

  /**
   * Get number of categories
   * @returns Category count
   */
  async getCategoryCount(): Promise<number> {
    return await this.categoryLinks.count();
  }
}

export default MobileMenuComponent;

/**
 * Header Component
 *
 * Component object for Smart.md site header.
 * Handles navigation, search, cart, and language switching.
 */

import { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../../config/selectors';
import { humanClick, humanType, randomDelay } from '../../utils/human-like';
import { firstWorkingLocator, joinSelectors } from '../../utils/locator-helper';

/**
 * Header Component class
 */
export class HeaderComponent {
  constructor(private page: Page) {}

  // ==================== Locators ====================

  /**
   * Header container
   */
  get container(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.container));
  }

  /**
   * Logo
   */
  get logo(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.logo));
  }

  /**
   * Search input
   */
  get searchInput(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.searchInput));
  }

  /**
   * Search button
   */
  get searchButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.searchButton));
  }

  /**
   * Cart icon
   */
  get cartIcon(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.cartIcon));
  }

  /**
   * Cart count badge
   */
  get cartCount(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.cartCount));
  }

  /**
   * Language switcher
   */
  get languageSwitcher(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.languageSwitcher));
  }

  /**
   * Hamburger menu button
   */
  get hamburgerMenu(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.hamburgerMenu));
  }

  /**
   * User menu
   */
  get userMenu(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.userMenu));
  }

  /**
   * Wishlist link
   */
  get wishlist(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.wishlist));
  }

  // ==================== Actions ====================

  /**
   * Click on logo to go home
   */
  async clickLogo(): Promise<void> {
    await humanClick(this.logo);
  }

  /**
   * Perform search
   * @param query - Search query
   */
  async search(query: string): Promise<void> {
    await humanClick(this.searchInput);
    await humanType(this.searchInput, query);
    await randomDelay(200, 400);

    if (await this.searchButton.isVisible()) {
      await humanClick(this.searchButton);
    } else {
      await this.searchInput.press('Enter');
    }
  }

  /**
   * Click cart icon
   */
  async clickCart(): Promise<void> {
    const cartIcon = await firstWorkingLocator(this.page, SELECTORS.header.cartIcon, {
      contextLabel: 'header.cartIcon',
    });
    await humanClick(cartIcon);
  }

  /**
   * Get cart item count
   * @returns Number of items
   */
  async getCartItemCount(): Promise<number> {
    if (!(await this.cartCount.isVisible())) {
      return 0;
    }

    const text = await this.cartCount.textContent();
    const count = parseInt(text || '0', 10);
    return isNaN(count) ? 0 : count;
  }

  /**
   * Switch language
   * @param lang - Target language ('RO' | 'RU')
   */
  async switchLanguage(lang: 'RO' | 'RU'): Promise<void> {
    // Try clicking language switcher first
    if (await this.languageSwitcher.isVisible()) {
      await humanClick(this.languageSwitcher);
      await randomDelay(200, 400);
    }

    // Click target language
    const langLink =
      lang === 'RU'
        ? this.page.locator(joinSelectors(SELECTORS.header.languageRU))
        : this.page.locator(joinSelectors(SELECTORS.header.languageRO));

    if (await langLink.isVisible()) {
      await humanClick(langLink);
    }
  }

  /**
   * Open hamburger menu (mobile)
   */
  async openMobileMenu(): Promise<void> {
    await humanClick(this.hamburgerMenu);
    await randomDelay(300, 500);
  }

  /**
   * Check if hamburger menu is visible (mobile mode)
   * @returns true if mobile mode
   */
  async isMobileMode(): Promise<boolean> {
    return await this.hamburgerMenu.isVisible();
  }

  /**
   * Check if header is visible
   * @returns true if visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }
}

export default HeaderComponent;

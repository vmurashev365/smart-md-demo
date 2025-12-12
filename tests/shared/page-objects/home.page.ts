/**
 * Home Page Object
 *
 * Page object for Smart.md homepage.
 * Handles search, navigation, language switching, and cart access.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { SELECTORS } from '../config/selectors';
import { URLS } from '../config/urls';
import { humanClick, humanType, randomDelay } from '../utils/human-like';
import { firstWorkingLocator } from '../utils/locator-helper';
import { waitForSearchResults } from '../utils/wait-utils';
import { Language } from '../utils/language-utils';

/**
 * Home Page class
 */
export class HomePage extends BasePage {
  // ==================== Locators ====================

  /**
   * Search input field
   */
  get searchInput(): Locator {
    return this.page.locator(SELECTORS.header.searchInput);
  }

  /**
   * Search button
   */
  get searchButton(): Locator {
    return this.page.locator(SELECTORS.header.searchButton);
  }

  /**
   * Search form
   */
  get searchForm(): Locator {
    return this.page.locator(SELECTORS.header.searchForm);
  }

  /**
   * Cart icon in header
   */
  get cartIcon(): Locator {
    return this.page.locator(SELECTORS.header.cartIcon);
  }

  /**
   * Cart item count badge
   */
  get cartCount(): Locator {
    return this.page.locator(SELECTORS.header.cartCount);
  }

  /**
   * Language switcher
   */
  get languageSwitcher(): Locator {
    return this.page.locator(SELECTORS.header.languageSwitcher);
  }

  /**
   * Romanian language link
   */
  get languageRO(): Locator {
    return this.page.locator(SELECTORS.header.languageRO);
  }

  /**
   * Russian language link
   */
  get languageRU(): Locator {
    return this.page.locator(SELECTORS.header.languageRU);
  }

  /**
   * Hamburger menu (mobile)
   */
  get hamburgerMenu(): Locator {
    return this.page.locator(SELECTORS.header.hamburgerMenu);
  }

  /**
   * Main navigation
   */
  get mainNavigation(): Locator {
    return this.page.locator(SELECTORS.navigation.mainNav);
  }

  /**
   * Category menu
   */
  get categoryMenu(): Locator {
    return this.page.locator(SELECTORS.navigation.categoryMenu);
  }

  /**
   * Logo link
   */
  get logo(): Locator {
    return this.page.locator(SELECTORS.header.logo);
  }

  // ==================== Actions ====================

  /**
   * Open homepage
   * @param lang - Language version
   */
  async open(lang: Language = 'RO'): Promise<void> {
    const path = lang === 'RU' ? URLS.home.ru : URLS.home.ro;
    await this.goto(path);
  }

  /**
   * Search for a product
   * @param query - Search query
   */
  async search(query: string): Promise<void> {
    // Wait for search input to be ready
    await this.searchInput.waitFor({ state: 'visible' });

    // Human-like interaction: click and type
    await humanClick(this.searchInput);
    await humanType(this.searchInput, query);
    await randomDelay(200, 500);

    // Submit search
    const searchButton = this.searchButton;
    if (await searchButton.isVisible()) {
      await humanClick(searchButton);
    } else {
      // Press Enter if no visible search button
      await this.searchInput.press('Enter');
    }

    // Wait for results to load
    await waitForSearchResults(this.page);
  }

  /**
   * Navigate to a category
   * @param category - Main category name
   * @param subcategory - Optional subcategory name
   */
  async navigateToCategory(category: string, subcategory?: string): Promise<void> {
    // Prefer URL navigation for known high-value category paths to avoid brittle text selectors.
    const cat = category.trim().toLowerCase();
    const sub = subcategory?.trim().toLowerCase();

    if (sub && cat === 'telefoane' && sub === 'smartphone-uri') {
      await this.goto(URLS.categories.phones.smartphones);
      await this.waitForPageLoad();
      return;
    }

    // Find category link
    const categoryLink = this.page.locator(SELECTORS.navigation.categoryLink, {
      hasText: category,
    });

    if (subcategory) {
      // Hover to open mega menu
      await this.hover(categoryLink);
      await randomDelay(300, 500);

      // Click subcategory
      const subcategoryLink = this.page.locator(SELECTORS.navigation.subcategoryLink, {
        hasText: subcategory,
      });
      await humanClick(subcategoryLink);
    } else {
      await humanClick(categoryLink);
    }

    await this.waitForPageLoad();
  }

  /**
   * Navigate using breadcrumb-style path
   * @param path - Path like "Telefoane > Smartphone-uri"
   */
  async navigateToPath(path: string): Promise<void> {
    const parts = path.split('>').map(p => p.trim());

    if (parts.length >= 2) {
      await this.navigateToCategory(parts[0], parts[1]);
    } else if (parts.length === 1) {
      await this.navigateToCategory(parts[0]);
    }
  }

  /**
   * Switch website language
   * @param lang - Target language
   */
  async switchLanguage(lang: Language): Promise<void> {
    const currentLang = this.currentLanguage;

    if (currentLang === lang) {
      return; // Already on correct language
    }

    // Try different approaches to switch language
    const langSwitcher = this.languageSwitcher;

    if (await langSwitcher.isVisible()) {
      // Click language switcher first if it's a dropdown
      await humanClick(langSwitcher);
      await randomDelay(200, 400);
    }

    // Click the target language
    const targetLangLink = lang === 'RU' ? this.languageRU : this.languageRO;

    if (await targetLangLink.isVisible()) {
      await humanClick(targetLangLink);
    } else {
      // Try direct URL navigation
      const currentPath = new URL(this.currentUrl).pathname;
      const newPath =
        lang === 'RU'
          ? currentPath.replace(/^\/ru/, '/ru') || `/ru${currentPath}`
          : currentPath.replace(/^\/ru/, '');

      await this.goto(newPath);
    }

    await this.waitForPageLoad();
  }

  /**
   * Get cart item count
   * @returns Number of items in cart
   */
  async getCartItemCount(): Promise<number> {
    const cartCountEl = this.cartCount;

    if (!(await cartCountEl.isVisible())) {
      return 0;
    }

    const text = await cartCountEl.textContent();
    const count = parseInt(text || '0', 10);
    return isNaN(count) ? 0 : count;
  }

  /**
   * Click on cart icon to go to cart page
   */
  async clickCart(): Promise<void> {
    const cartIcon = await firstWorkingLocator(this.page, SELECTORS.header.cartIcon, {
      contextLabel: 'header.cartIcon',
    });
    await humanClick(cartIcon);
    await this.waitForPageLoad();
  }

  /**
   * Open hamburger menu (mobile)
   */
  async openMobileMenu(): Promise<void> {
    const hamburger = this.hamburgerMenu;
    await humanClick(hamburger);
    await randomDelay(300, 500);

    // Wait for drawer to open
    const drawer = this.page.locator(SELECTORS.mobile.menuDrawer);
    await drawer.waitFor({ state: 'visible' });
  }

  /**
   * Close mobile menu
   */
  async closeMobileMenu(): Promise<void> {
    const closeBtn = this.page.locator(SELECTORS.mobile.menuClose);

    if (await closeBtn.isVisible()) {
      await humanClick(closeBtn);
    } else {
      // Click outside to close
      await this.page.click('body', { position: { x: 10, y: 10 } });
    }

    await randomDelay(200, 400);
  }

  /**
   * Navigate to category from mobile menu
   * @param category - Category name
   */
  async navigateToCategoryMobile(category: string): Promise<void> {
    await this.openMobileMenu();
    await randomDelay(200, 400);

    const categoryLink = this.page.locator(SELECTORS.mobile.categoryLink, {
      hasText: category,
    });
    await humanClick(categoryLink);
    await this.waitForPageLoad();
  }

  /**
   * Check if mobile layout is displayed
   * @returns true if mobile layout
   */
  async isMobileLayout(): Promise<boolean> {
    const hamburger = this.hamburgerMenu;
    return await hamburger.isVisible();
  }

  /**
   * Check if desktop navigation is visible
   * @returns true if desktop nav visible
   */
  async isDesktopNavVisible(): Promise<boolean> {
    const mainNav = this.mainNavigation;
    return await mainNav.isVisible();
  }

  /**
   * Click on logo to go to homepage
   */
  async clickLogo(): Promise<void> {
    await humanClick(this.logo);
    await this.waitForPageLoad();
  }
}

export default HomePage;

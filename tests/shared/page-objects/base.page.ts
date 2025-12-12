/**
 * Base Page Object
 *
 * Abstract base class for all page objects.
 * Implements common functionality and human-like interaction methods.
 */

import { Page, Locator, expect } from '@playwright/test';
import {
  humanClick,
  humanType,
  humanScroll,
  humanMouseMove,
  humanWaitForContent,
  randomDelay,
  conditionalDelay,
} from '../utils/human-like';
import { waitForPageLoad, waitForNetworkIdle, waitForLoadersToDisappear } from '../utils/wait-utils';
import { detectLanguageFromUrl, Language } from '../utils/language-utils';
import { SELECTORS } from '../config/selectors';
import { joinSelectors } from '../utils/locator-helper';

/**
 * Base Page class with common functionality
 */
export abstract class BasePage {
  /**
   * Creates an instance of BasePage
   * @param page - Playwright Page instance
   */
  constructor(protected page: Page) {}

  // ==================== Navigation ====================

  /**
   * Navigate to a URL path (relative or absolute)
   * @param path - Relative path (e.g., '/search') or full URL
   */
  async goto(path: string): Promise<void> {
    // If path is relative, it will be resolved against baseURL from playwright config
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to a full URL
   * @param url - Full URL
   */
  async gotoUrl(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  // ==================== Wait Methods ====================

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await waitForPageLoad(this.page);
    await conditionalDelay(300, 700);
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await waitForNetworkIdle(this.page);
  }

  /**
   * Wait for loaders to disappear
   */
  async waitForLoadersToDisappear(): Promise<void> {
    await waitForLoadersToDisappear(this.page);
  }

  /**
   * Wait like a human would (reading content)
   * @param maxMs - Maximum wait time
   */
  async waitLikeHuman(maxMs: number = 2000): Promise<void> {
    await humanWaitForContent(this.page, maxMs);
  }

  /**
   * Wait for a specific timeout
   * @param ms - Milliseconds to wait
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  // ==================== Human-like Actions ====================

  /**
   * Click on element with human-like behavior
   * @param locator - Element locator
   */
  async click(locator: Locator): Promise<void> {
    await humanClick(locator);
  }

  /**
   * Type text with human-like delays
   * @param locator - Input locator
   * @param text - Text to type
   */
  async type(locator: Locator, text: string): Promise<void> {
    await humanType(locator, text);
  }

  /**
   * Type and press Enter
   * @param locator - Input locator
   * @param text - Text to type
   */
  async typeAndEnter(locator: Locator, text: string): Promise<void> {
    await humanType(locator, text, { pressEnter: true });
  }

  /**
   * Scroll the page
   * @param direction - Scroll direction
   */
  async scroll(direction: 'down' | 'up' = 'down'): Promise<void> {
    await humanScroll(this.page, direction);
  }

  /**
   * Move mouse to element
   * @param locator - Target locator
   */
  async moveTo(locator: Locator): Promise<void> {
    await humanMouseMove(this.page, locator);
  }

  /**
   * Hover over element
   * @param locator - Element locator
   */
  async hover(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await randomDelay(100, 200);
    await locator.hover();
    await randomDelay(100, 300);
  }

  // ==================== Page Info ====================

  /**
   * Get current page URL
   * @returns Current URL
   */
  get currentUrl(): string {
    return this.page.url();
  }

  /**
   * Get current page title
   * @returns Page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current language from URL
   * @returns Current language
   */
  get currentLanguage(): Language {
    return detectLanguageFromUrl(this.currentUrl);
  }

  /**
   * Check if page URL contains a string
   * @param text - Text to check
   * @returns true if URL contains text
   */
  urlContains(text: string): boolean {
    return this.currentUrl.includes(text);
  }

  // ==================== Screenshots ====================

  /**
   * Take a screenshot
   * @param name - Screenshot name
   */
  async screenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: false,
    });
  }

  /**
   * Take a full page screenshot
   * @param name - Screenshot name
   */
  async fullPageScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({
      path: `screenshots/${name}-full-${Date.now()}.png`,
      fullPage: true,
    });
  }

  // ==================== Element Helpers ====================

  /**
   * Check if element is visible
   * @param locator - Element locator
   * @returns true if visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element exists in DOM
   * @param locator - Element locator
   * @returns true if exists
   */
  async exists(locator: Locator): Promise<boolean> {
    return (await locator.count()) > 0;
  }

  /**
   * Get element text
   * @param locator - Element locator
   * @returns Element text content
   */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  /**
   * Get element attribute
   * @param locator - Element locator
   * @param attribute - Attribute name
   * @returns Attribute value
   */
  async getAttribute(locator: Locator, attribute: string): Promise<string | null> {
    return await locator.getAttribute(attribute);
  }

  /**
   * Get element count
   * @param locator - Element locator
   * @returns Number of matching elements
   */
  async getCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  // ==================== Assertions ====================

  /**
   * Assert element is visible
   * @param locator - Element locator
   */
  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert element is hidden
   * @param locator - Element locator
   */
  async assertHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /**
   * Assert element has text
   * @param locator - Element locator
   * @param text - Expected text
   */
  async assertText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  /**
   * Assert element contains text
   * @param locator - Element locator
   * @param text - Expected text
   */
  async assertContainsText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }

  /**
   * Assert URL contains text
   * @param text - Expected text in URL
   */
  async assertUrlContains(text: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(text));
  }

  // ==================== Common Elements ====================

  /**
   * Get header element
   */
  get header(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.header.container));
  }

  /**
   * Get loader element
   */
  get loader(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.common.loader));
  }

  /**
   * Get toast/notification element
   */
  get toast(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.common.toast));
  }
}

export default BasePage;

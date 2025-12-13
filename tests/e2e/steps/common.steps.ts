/**
 * Common Step Definitions
 *
 * Shared steps used across multiple features.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { CustomWorld } from '../support/custom-world';
import { HomePage } from '../../shared/page-objects/home.page';
import { DEVICES } from '../../shared/fixtures/devices';
import { SELECTORS } from '../../shared/config/selectors';
import { humanClick, humanWaitForContent, randomDelay } from '../../shared/utils/human-like';
import { waitForPageLoad, waitForContentUpdate } from '../../shared/utils/wait-utils';
import { detectLanguageFromUrl } from '../../shared/utils/language-utils';
import { joinSelectors, firstWorkingLocator } from '../../shared/utils/locator-helper';

// ==================== Navigation ====================

Given('I am on the Smart.md homepage', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  await homePage.open();
  await humanWaitForContent(this.page, 1500);
});

Given('I am on the Smart.md homepage in {string}', async function (
  this: CustomWorld,
  language: 'RO' | 'RU'
) {
  const homePage = new HomePage(this.page);
  await homePage.open(language);
  await humanWaitForContent(this.page, 1500);
});

// ==================== Device Emulation ====================

Given('I am using {string} device emulation', async function (
  this: CustomWorld,
  deviceName: string
) {
  const device = DEVICES[deviceName];
  
  if (!device) {
    throw new Error(`Unknown device: ${deviceName}`);
  }

  // Store device info
  this.setDevice(deviceName);

  // Update viewport
  await this.page.setViewportSize(device.viewport);
  
  this.logMessage(`Device emulation set to: ${deviceName} (${device.viewport.width}x${device.viewport.height})`);
});

// ==================== Language ====================

Given('the current language is {string}', async function (
  this: CustomWorld,
  expectedLang: 'RO' | 'RU'
) {
  const currentLang = detectLanguageFromUrl(this.page.url());
  expect(currentLang).toBe(expectedLang);
});

When('I switch language to {string}', async function (
  this: CustomWorld,
  targetLang: 'RO' | 'RU'
) {
  const homePage = new HomePage(this.page);
  await homePage.switchLanguage(targetLang);
  await waitForPageLoad(this.page);
});

When('I ensure the language is set to {string}', async function (
  this: CustomWorld,
  targetLang: 'RO' | 'RU'
) {
  const homePage = new HomePage(this.page);
  const currentLang = await homePage.getCurrentLanguage();
  
  if (currentLang !== targetLang) {
    await homePage.switchLanguage(targetLang);
    await waitForPageLoad(this.page);
  }
});

// ==================== Wait Steps ====================

When('I wait for search results to load', async function (this: CustomWorld) {
  await waitForContentUpdate(this.page);
  await randomDelay(500, 1000);
});

When('I wait for the product list to update', async function (this: CustomWorld) {
  await waitForContentUpdate(this.page);
  await randomDelay(500, 1000);
});

When('I wait for the page to load', async function (this: CustomWorld) {
  await waitForPageLoad(this.page);
});

When('I wait {int} seconds', async function (this: CustomWorld, seconds: number) {
  await this.page.waitForTimeout(seconds * 1000);
});

// ==================== Storage Steps ====================

Then('I store the current URL as {string}', async function (
  this: CustomWorld,
  key: string
) {
  const url = this.page.url();
  this.storeValue(key, url);
});

Then('I store the product price as {string}', async function (
  this: CustomWorld,
  key: string
) {
  // Import ProductDetailPage dynamically to get price
  const { ProductDetailPage } = await import('../../shared/page-objects/product-detail.page');
  const productPage = new ProductDetailPage(this.page);
  const price = await productPage.getPrice();
  this.storeValue(key, price);
  this.logMessage(`Stored price: ${price} MDL`);
});

Then('I store the product name as {string}', async function (
  this: CustomWorld,
  key: string
) {
  // Import ProductDetailPage dynamically to get product name
  const { ProductDetailPage } = await import('../../shared/page-objects/product-detail.page');
  const productPage = new ProductDetailPage(this.page);
  const name = await productPage.getTitle();
  this.storeValue(key, name);
  this.logMessage(`Stored product name: ${name}`);
});

// ==================== URL Assertions ====================

Then('the URL should contain {string}', async function (
  this: CustomWorld,
  text: string
) {
  const url = this.page.url();
  expect(url).toContain(text);
});

Then('the URL should contain {string} prefix', async function (
  this: CustomWorld,
  prefix: string
) {
  const url = this.page.url();
  const path = new URL(url).pathname;
  expect(path).toMatch(new RegExp(`^${prefix}`));
});

Then('the URL path should match the stored {string} path', async function (
  this: CustomWorld,
  key: string
) {
  const storedUrl = this.getStoredValue<string>(key);
  
  if (!storedUrl) {
    throw new Error(`No stored URL with key: ${key}`);
  }

  // Normalize both paths by removing language prefix (/ru/)
  const currentPath = new URL(this.page.url()).pathname.replace(/^\/ru\//, '/');
  const storedPath = new URL(storedUrl).pathname.replace(/^\/ru\//, '/');
  
  expect(currentPath).toBe(storedPath);
});

Then('the page should not return 404 error', async function (this: CustomWorld) {
  // Check for common 404 indicators
  const page404 = this.page.locator('text=404, text="Page not found", text="Pagina nu a fost găsită"');
  const is404 = await page404.isVisible().catch(() => false);
  
  expect(is404).toBe(false);
});

// ==================== Button Visibility ====================

/**
 * Button Visibility Map - Maps button names to centralized selectors
 * Uses SELECTORS for Single Source of Truth
 */
const BUTTON_VISIBILITY_MAP = new Map<RegExp, string[]>([
  [/adaug|co[sș]|корзин/i, SELECTORS.product.addToCart],
  [/cump.*credit|credit/i, SELECTORS.product.buyCredit],
]);

Then('the {string} button should be visible', async function (
  this: CustomWorld,
  buttonText: string
) {
  const normalized = buttonText.trim().toLowerCase();

  // Try to match against Button Visibility Map
  for (const [pattern, selectors] of BUTTON_VISIBILITY_MAP.entries()) {
    if (pattern.test(normalized)) {
      // Use firstWorkingLocator to find visible button (more resilient)
      try {
        const button = await firstWorkingLocator(
          this.page,
          selectors,
          { 
            contextLabel: `button.${pattern.source}`, 
            requireVisible: true,
            perSelectorTimeout: 800
          }
        );
        await expect(button).toBeVisible({ timeout: 10000 });
        return;
      } catch (error) {
        // If centralized selectors fail, fall back to semantic getByRole
        if (pattern.test('adaug')) {
          const button = this.page.locator('#product').getByRole('button', { 
            name: /adauga in cos|в корзину/i 
          }).first();
          await expect(button).toBeVisible({ timeout: 10000 });
          return;
        }
        if (pattern.test('credit')) {
          const button = this.page.getByRole('button', { 
            name: /Credit de la \d+/i 
          }).first();
          await expect(button).toBeVisible({ timeout: 10000 });
          return;
        }
        throw error;
      }
    }
  }

  // Fallback: Generic text-based button locator
  const button = this.page.locator(
    `button:has-text("${buttonText}"), a:has-text("${buttonText}"), [role="button"]:has-text("${buttonText}")`
  );
  await expect(button.first()).toBeVisible({ timeout: 10000 });
});

Then('the {string} button should still be visible', async function (
  this: CustomWorld,
  buttonText: string
) {
  const normalized = buttonText.trim().toLowerCase();

  // Reuse Button Visibility Map for consistency
  for (const [pattern, selectors] of BUTTON_VISIBILITY_MAP.entries()) {
    if (pattern.test(normalized)) {
      const button = this.page.locator(joinSelectors(selectors)).first();
      await expect(button).toBeVisible();
      return;
    }
  }

  // Fallback: Generic text-based button locator
  const button = this.page.locator(`button:has-text("${buttonText}"), a:has-text("${buttonText}")`);
  await expect(button.first()).toBeVisible();
});

// ==================== Button Action Factory ====================

/**
 * Button Action Factory - Maps button names to Page Object methods
 * Eliminates hardcoded logic inside step definitions
 * Delegates specific click logic back to Page Objects
 */
type ButtonActionHandler = (world: CustomWorld, buttonText: string) => Promise<void>;

const BUTTON_ACTION_MAP = new Map<RegExp, ButtonActionHandler>([
  // Add to Cart Button - delegates to ProductDetailPage.addToCart()
  [
    /adaug|co[sș]|корзин/i,
    async (world: CustomWorld) => {
      const { ProductDetailPage } = await import('../../shared/page-objects/product-detail.page');
      const productPage = new ProductDetailPage(world.page);
      await productPage.addToCart();
    }
  ],
  
  // Credit Button - delegates to ProductDetailPage.openCreditCalculator()
  [
    /cump.*credit|credit/i,
    async (world: CustomWorld) => {
      const { ProductDetailPage } = await import('../../shared/page-objects/product-detail.page');
      const productPage = new ProductDetailPage(world.page);
      await productPage.openCreditCalculator();
    }
  ],
]);

/**
 * Generic button click action with smart routing
 * Uses ButtonActionFactory to delegate to appropriate Page Object methods
 */
When('I click the {string} button', async function (
  this: CustomWorld,
  buttonText: string
) {
  const normalized = buttonText.trim().toLowerCase();

  // Try to match against Button Action Factory
  for (const [pattern, handler] of BUTTON_ACTION_MAP.entries()) {
    if (pattern.test(normalized)) {
      await handler(this, buttonText);
      return;
    }
  }

  // Fallback: Generic text-based button locator
  const button = this.page
    .locator(
      `button:has-text("${buttonText}"), ` +
        `a:has-text("${buttonText}"), ` +
        `[role="button"]:has-text("${buttonText}"), ` +
        `input[value="${buttonText}"]`
    )
    .first();

  await humanClick(button);
  await randomDelay(300, 600);
});

// ==================== Debug Helpers ====================

Then('I take a screenshot', async function (this: CustomWorld) {
  await this.attachScreenshot('debug-screenshot');
});

Then('I log the current URL', async function (this: CustomWorld) {
  console.log('Current URL:', this.page.url());
  this.attach(this.page.url(), 'text/plain');
});

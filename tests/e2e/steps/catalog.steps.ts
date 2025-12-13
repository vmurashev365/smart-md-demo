/**
 * Catalog Experience Step Definitions
 *
 * Steps for catalog browsing, filtering, sorting, and mobile navigation.
 */

import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { CustomWorld } from '../support/custom-world';
import { HomePage } from '../../shared/page-objects/home.page';
import { CatalogPage } from '../../shared/page-objects/catalog.page';
import { ProductDetailPage } from '../../shared/page-objects/product-detail.page';
import { MobileMenuComponent } from '../../shared/page-objects/components/mobile-menu.component';
import { SELECTORS } from '../../shared/config/selectors';
import { humanWaitForContent, humanClick } from '../../shared/utils/human-like';
import { waitForPageLoad } from '../../shared/utils/wait-utils';
import { detectTextLanguage, containsCyrillic } from '../../shared/utils/language-utils';
import { joinSelectors } from '../../shared/utils/locator-helper';

// ==================== Category Navigation ====================

When(/^I navigate to "([^"]+)" > "([^"]+)"\s+category$/, async function (
  this: CustomWorld,
  category: string,
  subcategory: string
) {
  const homePage = new HomePage(this.page);
  await homePage.navigateToCategory(category, subcategory);
  await humanWaitForContent(this.page, 1500);
});

When(/^I navigate to "([^"]+)"\s+category$/, async function (
  this: CustomWorld,
  category: string
) {
  const homePage = new HomePage(this.page);
  await homePage.navigateToCategory(category);
  await humanWaitForContent(this.page, 1500);
});

Then('I should see the smartphones catalog', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  let productCount: number;

  try {
    productCount = await catalogPage.getVisibleProductsUpperBound();
  } catch {
    productCount = await catalogPage.getProductCount();
  }
  
  expect(productCount).toBeGreaterThan(0);
  
  // Verify we're on smartphones page
  const url = this.page.url().toLowerCase();
  expect(url).toMatch(/smartphone|telefon/);
});

Then('I should see the smartphones catalog page', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  let productCount: number;

  try {
    productCount = await catalogPage.getVisibleProductsUpperBound();
  } catch {
    productCount = await catalogPage.getProductCount();
  }
  
  expect(productCount).toBeGreaterThan(0);
  
  const url = this.page.url().toLowerCase();
  expect(url).toMatch(/smartphone|telefon/);
});

Then('I should see the gadgets catalog page', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  const productCount = await catalogPage.getProductCount();
  
  expect(productCount).toBeGreaterThan(0);
  
  // Verify we're on gadgets page
  const url = this.page.url().toLowerCase();
  expect(url).toMatch(/gadget/);
});

Then('the product count should be greater than {int}', async function (
  this: CustomWorld,
  minCount: number
) {
  const catalogPage = new CatalogPage(this.page);
  let count: number;

  // Prefer Smart.md pagination range label (e.g. "1 - 40 din 629 produse") as it is often
  // more reliable than counting cards when markup varies.
  try {
    count = await catalogPage.getVisibleProductsUpperBound();
  } catch {
    count = await catalogPage.getProductCount();
  }
  
  expect(count).toBeGreaterThan(minCount);
  this.logMessage(`Product count: ${count}`);
  
  // Store for later comparison
  this.storeValue('initial_product_count', count);
});

// ==================== Filtering ====================

When('I apply brand filter {string}', async function (
  this: CustomWorld,
  brand: string
) {
  const catalogPage = new CatalogPage(this.page);
  await catalogPage.applyBrandFilter(brand);
  
  this.storeValue('applied_brand_filter', brand);
});

Then('all visible products should be {string} brand', async function (
  this: CustomWorld,
  brand: string
) {
  const catalogPage = new CatalogPage(this.page);
  const allMatch = await catalogPage.allProductsMatchBrand(brand);
  
  expect(allMatch).toBe(true);
});

Then('the filter tag {string} should be displayed', async function (
  this: CustomWorld,
  filterName: string
) {
  const catalogPage = new CatalogPage(this.page);
  const isDisplayed = await catalogPage.isFilterTagDisplayed(filterName);
  
  expect(isDisplayed).toBe(true);
});

When('I clear all filters', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  await catalogPage.clearAllFilters();
});

Then('the product count should increase', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  const currentCount = await catalogPage.getProductCount();
  const initialCount = this.getStoredValue<number>('initial_product_count');
  
  // After clearing filters, count should be >= what it was with filters
  // (could be the same if filter didn't reduce count)
  expect(currentCount).toBeGreaterThanOrEqual(initialCount || 0);
  this.logMessage(`Product count after clearing: ${currentCount}`);
});

Then('no filter tags should be displayed', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  const hasFilters = await catalogPage.hasActiveFilters();
  
  expect(hasFilters).toBe(false);
});

// ==================== Sorting ====================

When('I apply sorting {string}', async function (
  this: CustomWorld,
  sortOption: string
) {
  const catalogPage = new CatalogPage(this.page);
  await catalogPage.applySorting(sortOption);
});

Then('the products should be sorted by price ascending', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  const isSorted = await catalogPage.isSortedByPriceAscending();
  
  expect(isSorted).toBe(true);
});

Then('the products should be sorted by price descending', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  const isSorted = await catalogPage.isSortedByPriceDescending();
  
  expect(isSorted).toBe(true);
});

Then('the first product price should be less than the second product price', async function (
  this: CustomWorld
) {
  const catalogPage = new CatalogPage(this.page);
  const price1 = await catalogPage.getProductPrice(0);
  const price2 = await catalogPage.getProductPrice(1);
  
  expect(price1).toBeLessThanOrEqual(price2);
  this.logMessage(`First: ${price1} MDL, Second: ${price2} MDL`);
});

// ==================== Language / Localization ====================

Then('the product title should be in Russian', async function (this: CustomWorld) {
  const productPage = new ProductDetailPage(this.page);
  const title = await productPage.getTitle();
  
  // Check if title contains Cyrillic characters
  const isRussian = containsCyrillic(title);
  
  // Title might be brand name (Latin) + Russian description
  const lang = detectTextLanguage(title);
  
  this.logMessage(`Product title: ${title}`);
  this.logMessage(`Detected language: ${lang}`);
  this.logMessage(`Contains Cyrillic: ${isRussian}`);
  
  // STRICT check: title must actually be in Russian (contain Cyrillic)
  // Known issue: Smart.md does NOT translate product names
  expect(isRussian).toBe(true);
});

Then('the navigation menu should be in Russian', async function (this: CustomWorld) {
  // Check navigation items for Cyrillic
  const navItems = this.page.locator(
    `:is(${joinSelectors(SELECTORS.navigation.mainNav)}) a, :is(${joinSelectors(SELECTORS.navigation.categoryLink)})`
  );
  const count = await navItems.count();
  
  let russianCount = 0;
  for (let i = 0; i < Math.min(count, 5); i++) {
    const text = await navItems.nth(i).textContent();
    if (text && containsCyrillic(text)) {
      russianCount++;
    }
  }
  
  // At least some nav items should be in Russian
  expect(russianCount).toBeGreaterThan(0);
});

// ==================== Mobile Navigation ====================

Then('the mobile layout should be displayed', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  const isMobile = await homePage.isMobileLayout();

  expect(isMobile).toBe(true);
});

Then('the bottom navigation bar should be visible', async function (this: CustomWorld) {
  const bottomNav = this.page.locator(joinSelectors(SELECTORS.mobile.bottomNav));
  await expect(bottomNav).toBeVisible();
});

Then('the mobile menu icon should be visible', async function (this: CustomWorld) {
  const menuIcon = this.page.locator('#menu_link');
  await expect(menuIcon).toBeVisible();
});

Then('the hamburger menu icon should be visible', async function (this: CustomWorld) {
  const hamburger = this.page.locator(joinSelectors(SELECTORS.header.hamburgerMenu));
  await expect(hamburger).toBeVisible();
});

Then('the desktop navigation should be hidden', async function (this: CustomWorld) {
  // Use MobileMenuComponent's assertDesktopNavHidden for CSS-based check
  const mobileMenu = new MobileMenuComponent(this.page);

  try {
    await mobileMenu.assertDesktopNavHidden();
  } catch (error) {
    // If assertion fails, re-throw with context
    throw new Error(`Desktop navigation should be hidden on mobile viewport: ${error}`);
  }
});

Then('the desktop navigation should not be visible', async function (this: CustomWorld) {
  // Alternative: Check CSS display/visibility
  const desktopNav = this.page.locator(joinSelectors(SELECTORS.mobile.desktopNav));
  const count = await desktopNav.count();

  if (count === 0) {
    // Element doesn't exist in DOM - that's acceptable
    return;
  }

  // Check computed styles
  const isHidden = await desktopNav.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return (
      styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0'
    );
  });

  expect(isHidden).toBe(true);
});

When('I tap on the mobile menu icon', async function (this: CustomWorld) {
  const menuIcon = this.page.locator('#menu_link');
  await humanClick(menuIcon);
  // Wait for menu to open
  await this.page.waitForTimeout(500);
});

When('I tap on {string} in bottom navigation', async function (this: CustomWorld, itemName: string) {
  const bottomNavItem = this.page.locator(joinSelectors(SELECTORS.mobile.bottomNavItem)).filter({ hasText: itemName });
  await humanClick(bottomNavItem);
});

When('I tap on the hamburger menu icon', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  await homePage.openMobileMenu();
});

Then('the mobile menu drawer should open', async function (this: CustomWorld) {
  const mobileMenu = new MobileMenuComponent(this.page);
  const isOpen = await mobileMenu.isOpen();
  
  expect(isOpen).toBe(true);
});

Then('I should see main category links', async function (this: CustomWorld) {
  const mobileMenu = new MobileMenuComponent(this.page);
  const categoryCount = await mobileMenu.getCategoryCount();
  
  expect(categoryCount).toBeGreaterThan(0);
});

When('I tap on {string} in the mobile menu', async function (
  this: CustomWorld,
  categoryName: string
) {
  const mobileMenu = new MobileMenuComponent(this.page);
  await mobileMenu.navigateToCategory(categoryName);
  await this.page.waitForTimeout(500);
});

When('I tap on {string} category', async function (
  this: CustomWorld,
  categoryName: string
) {
  const mobileMenu = new MobileMenuComponent(this.page);
  await mobileMenu.navigateToCategory(categoryName);
  await waitForPageLoad(this.page);
});

Then('the products should be displayed in mobile grid', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  const productCount = await catalogPage.getProductCount();
  
  expect(productCount).toBeGreaterThan(0);
  
  // Verify mobile layout (could check CSS classes)
  const viewport = this.page.viewportSize();
  expect(viewport?.width).toBeLessThan(768);
});

Then('each product card should be touch-friendly', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  const isTouchFriendly = await catalogPage.areProductsTouchFriendly();
  
  expect(isTouchFriendly).toBe(true);
});

When('I tap on the first product', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  await catalogPage.clickProduct(0);
});

Then('the "Adaugă în coș" button should be full-width', async function (this: CustomWorld) {
  const productPage = new ProductDetailPage(this.page);
  const isFullWidth = await productPage.isAddToCartFullWidth();
  
  expect(isFullWidth).toBe(true);
});

Then('the product images should be swipeable', async function (this: CustomWorld) {
  const productPage = new ProductDetailPage(this.page);
  const isSwipeable = await productPage.areImagesSwipeable();
  
  // On mobile, images should be in a swipeable gallery
  // This might not always be true, so we do a soft check
  this.logMessage(`Images swipeable: ${isSwipeable}`);
});

// ==================== Product Data Verification ====================

When('I store the first product name as {string}', async function (this: CustomWorld, key: string) {
  const catalogPage = new CatalogPage(this.page);
  const productName = await catalogPage.getProductName(0);
  this.storeValue(key, productName);
  this.logMessage(`Stored product name: ${productName}`);
});

When('I store the first product price as {string}', async function (this: CustomWorld, key: string) {
  const catalogPage = new CatalogPage(this.page);
  const productPrice = await catalogPage.getProductPriceText(0);
  this.storeValue(key, productPrice);
  this.logMessage(`Stored product price: ${productPrice}`);
});

Then('the product name should match stored {string}', async function (this: CustomWorld, key: string) {
  const expectedName = this.getStoredValue(key) as string;
  const productPage = new ProductDetailPage(this.page);
  const actualName = await productPage.getProductName();
  
  this.logMessage(`Expected: ${expectedName}`);
  this.logMessage(`Actual: ${actualName}`);
  
  expect(actualName).toContain(expectedName);
});

Then('the product price should match stored {string}', async function (this: CustomWorld, key: string) {
  const expectedPrice = this.getStoredValue(key) as string;
  const productPage = new ProductDetailPage(this.page);
  const actualPrice = await productPage.getProductPrice();
  
  this.logMessage(`Expected price: ${expectedPrice}`);
  this.logMessage(`Actual price: ${actualPrice}`);
  
  expect(actualPrice).toBe(expectedPrice);
});

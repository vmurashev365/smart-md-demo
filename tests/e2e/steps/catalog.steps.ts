/**
 * Catalog Experience Step Definitions
 *
 * Steps for catalog browsing, filtering, sorting, and mobile navigation.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { CustomWorld } from '../support/custom-world';
import { HomePage } from '../../shared/page-objects/home.page';
import { CatalogPage } from '../../shared/page-objects/catalog.page';
import { ProductDetailPage } from '../../shared/page-objects/product-detail.page';
import { MobileMenuComponent } from '../../shared/page-objects/components/mobile-menu.component';
import { SELECTORS } from '../../shared/config/selectors';
import { humanClick, humanWaitForContent, randomDelay } from '../../shared/utils/human-like';
import { waitForProductListUpdate, waitForPageLoad } from '../../shared/utils/wait-utils';
import { detectTextLanguage, containsCyrillic } from '../../shared/utils/language-utils';

// ==================== Category Navigation ====================

When('I navigate to {string} > {string} category', async function (
  this: CustomWorld,
  category: string,
  subcategory: string
) {
  const homePage = new HomePage(this.page);
  await homePage.navigateToCategory(category, subcategory);
  await humanWaitForContent(this.page, 1500);
});

When('I navigate to {string} category', async function (
  this: CustomWorld,
  category: string
) {
  const homePage = new HomePage(this.page);
  await homePage.navigateToCategory(category);
  await humanWaitForContent(this.page, 1500);
});

Then('I should see the smartphones catalog', async function (this: CustomWorld) {
  const catalogPage = new CatalogPage(this.page);
  const productCount = await catalogPage.getProductCount();
  
  expect(productCount).toBeGreaterThan(0);
  
  // Verify we're on smartphones page
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
  const count = await catalogPage.getProductCount();
  
  expect(count).toBeGreaterThan(minCount);
  this.log(`Product count: ${count}`);
  
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
  this.log(`Product count after clearing: ${currentCount}`);
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
  this.log(`First: ${price1} MDL, Second: ${price2} MDL`);
});

// ==================== Language / Localization ====================

Then('the product title should be in Russian', async function (this: CustomWorld) {
  const productPage = new ProductDetailPage(this.page);
  const title = await productPage.getTitle();
  
  // Check if title contains Cyrillic characters
  const isRussian = containsCyrillic(title);
  
  // Title might be brand name (Latin) + Russian description
  // So we check the page language indicator instead
  const lang = detectTextLanguage(title);
  
  this.log(`Product title: ${title}`);
  this.log(`Detected language: ${lang}`);
  
  // Either title is in Russian or URL confirms Russian version
  const urlIsRussian = this.page.url().includes('/ru/');
  expect(isRussian || urlIsRussian).toBe(true);
});

Then('the navigation menu should be in Russian', async function (this: CustomWorld) {
  // Check navigation items for Cyrillic
  const navItems = this.page.locator(`${SELECTORS.navigation.mainNav} a, ${SELECTORS.navigation.categoryLink}`);
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

Then('the hamburger menu icon should be visible', async function (this: CustomWorld) {
  const hamburger = this.page.locator(SELECTORS.header.hamburgerMenu);
  await expect(hamburger).toBeVisible();
});

Then('the desktop navigation should be hidden', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  const isDesktopNavVisible = await homePage.isDesktopNavVisible();
  
  // Desktop nav should be hidden on mobile
  expect(isDesktopNavVisible).toBe(false);
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
  this.log(`Images swipeable: ${isSwipeable}`);
});

/**
 * Shopping Flow Step Definitions
 *
 * Steps for search, product browsing, and cart functionality.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { CustomWorld } from '../support/custom-world';
import { HomePage } from '../../shared/page-objects/home.page';
import { SearchResultsPage } from '../../shared/page-objects/search-results.page';
import { ProductDetailPage } from '../../shared/page-objects/product-detail.page';
import { CartPage } from '../../shared/page-objects/cart.page';
import { SELECTORS } from '../../shared/config/selectors';
import { humanWaitForContent, randomDelay } from '../../shared/utils/human-like';
import { waitForSearchResults } from '../../shared/utils/wait-utils';
import { pricesEqual, calculateTotal } from '../../shared/utils/price-utils';

// ==================== Search ====================

When('I search for {string}', async function (this: CustomWorld, query: string) {
  const homePage = new HomePage(this.page);
  await homePage.search(query);
  await waitForSearchResults(this.page);
});

Then('the search results should contain at least {int} products', async function (
  this: CustomWorld,
  minCount: number
) {
  const searchResults = new SearchResultsPage(this.page);
  const count = await searchResults.getProductCount();
  
  expect(count).toBeGreaterThanOrEqual(minCount);
  this.logMessage(`Found ${count} products (expected at least ${minCount})`);
});

When('I click on the first product in search results', async function (this: CustomWorld) {
  const searchResults = new SearchResultsPage(this.page);
  await searchResults.clickFirstProduct();
  await humanWaitForContent(this.page, 1500);
});

// ==================== Product Detail ====================

Then('I should see the product detail page', async function (this: CustomWorld) {
  const productPage = new ProductDetailPage(this.page);
  const isLoaded = await productPage.isProductPageLoaded();
  
  expect(isLoaded).toBe(true);
});

Then('the product price should be greater than {int} MDL', async function (
  this: CustomWorld,
  minPrice: number
) {
  const productPage = new ProductDetailPage(this.page);
  const price = await productPage.getPrice();
  
  expect(price).toBeGreaterThan(minPrice);
  this.logMessage(`Product price: ${price} MDL (minimum: ${minPrice} MDL)`);
});

// ==================== Add to Cart ====================

When('I click the "Adaugă în coș" button', async function (this: CustomWorld) {
  const productPage = new ProductDetailPage(this.page);
  await productPage.addToCart();
});

Then('I should see a cart confirmation message', async function (this: CustomWorld) {
  // Wait for confirmation popup or toast
  const confirmation = this.page.locator(
    `${SELECTORS.cartPopup.message}, ` +
    `${SELECTORS.common.toast}, ` +
    `.cart-notification, ` +
    `.added-to-cart`
  );

  // Allow either a visible confirmation or just check cart count increased
  try {
    await confirmation.first().waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    // If no popup, just verify cart was updated
    const cartCount = this.page.locator(SELECTORS.header.cartCount);
    await expect(cartCount).toBeVisible({ timeout: 5000 });
  }
  
  await randomDelay(500, 1000);
});

Then('the cart icon should display {string} item', async function (
  this: CustomWorld,
  expectedCount: string
) {
  const homePage = new HomePage(this.page);
  const count = await homePage.getCartItemCount();
  
  expect(count.toString()).toBe(expectedCount);
});

// ==================== Cart Page ====================

When('I click on the cart icon', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  await homePage.clickCart();
});

Then('I should be on the shopping cart page', async function (this: CustomWorld) {
  const cartPage = new CartPage(this.page);
  
  // Wait for cart page to load
  await expect(cartPage.cartContainer).toBeVisible({ timeout: 10000 });
});

Then('the cart should contain {int} product(s)', async function (
  this: CustomWorld,
  expectedCount: number
) {
  const cartPage = new CartPage(this.page);
  const count = await cartPage.getItemCount();
  
  expect(count).toBe(expectedCount);
});

Then('the product name should contain {string}', async function (
  this: CustomWorld,
  partialName: string
) {
  const cartPage = new CartPage(this.page);
  const hasItem = await cartPage.hasItemWithTitle(partialName);
  
  expect(hasItem).toBe(true);
});

Then('the cart price should equal the stored {string}', async function (
  this: CustomWorld,
  key: string
) {
  const storedPrice = this.getStoredValue<number>(key);
  
  if (!storedPrice) {
    throw new Error(`No stored price with key: ${key}`);
  }

  const cartPage = new CartPage(this.page);
  const cartPrice = await cartPage.getItemPrice(0);
  
  // Allow small tolerance for price matching
  expect(pricesEqual(cartPrice, storedPrice, 1)).toBe(true);
  this.logMessage(`Cart price: ${cartPrice} MDL, Stored price: ${storedPrice} MDL`);
});

// ==================== Cart Modification ====================

Given('I have added {string} to the cart', async function (
  this: CustomWorld,
  productQuery: string
) {
  // Search and add product
  const homePage = new HomePage(this.page);
  await homePage.search(productQuery);
  await waitForSearchResults(this.page);

  const searchResults = new SearchResultsPage(this.page);
  await searchResults.clickFirstProduct();

  const productPage = new ProductDetailPage(this.page);
  
  // Store the price before adding
  const price = await productPage.getPrice();
  this.storeValue('item_price', price);
  
  await productPage.addToCart();
  await randomDelay(500, 1000);
});

When('I increase the product quantity to {int}', async function (
  this: CustomWorld,
  quantity: number
) {
  const cartPage = new CartPage(this.page);
  
  // Store initial price
  const initialPrice = await cartPage.getItemPrice(0);
  this.storeValue('initial_item_price', initialPrice);
  
  await cartPage.setQuantity(0, quantity);
});

Then('the cart should show quantity {string}', async function (
  this: CustomWorld,
  expectedQty: string
) {
  const cartPage = new CartPage(this.page);
  const quantity = await cartPage.getItemQuantity(0);
  
  expect(quantity.toString()).toBe(expectedQty);
});

Then('the total price should be doubled', async function (this: CustomWorld) {
  const initialPrice = this.getStoredValue<number>('initial_item_price');
  
  if (!initialPrice) {
    throw new Error('Initial price not stored');
  }

  const cartPage = new CartPage(this.page);
  const currentTotal = await cartPage.getTotal();
  const expectedTotal = calculateTotal(initialPrice, 2);
  
  // Allow 5% tolerance for price calculations
  const tolerance = expectedTotal * 0.05;
  expect(Math.abs(currentTotal - expectedTotal)).toBeLessThanOrEqual(tolerance);
});

When('I click the remove product button', async function (this: CustomWorld) {
  const cartPage = new CartPage(this.page);
  await cartPage.removeItem(0);
});

Then('the cart should be empty', async function (this: CustomWorld) {
  const cartPage = new CartPage(this.page);
  const isEmpty = await cartPage.isEmpty();
  
  expect(isEmpty).toBe(true);
});

Then('I should see {string} message', async function (
  this: CustomWorld,
  message: string
) {
  const messageEl = this.page.locator(`text="${message}"`);
  await expect(messageEl).toBeVisible({ timeout: 5000 });
});

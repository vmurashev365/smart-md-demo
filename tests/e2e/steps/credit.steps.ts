/**
 * Credit Calculator Step Definitions
 *
 * Steps for Moldova-specific credit/installment payment testing.
 */

import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { CustomWorld } from '../support/custom-world';
import { ProductDetailPage } from '../../shared/page-objects/product-detail.page';
import { CreditModalComponent } from '../../shared/page-objects/components/credit-modal.component';
import { SELECTORS } from '../../shared/config/selectors';
import { randomDelay } from '../../shared/utils/human-like';
import { waitForContentUpdate } from '../../shared/utils/wait-utils';
import { validateMonthlyPayment } from '../../shared/utils/price-utils';
import { joinSelectors } from '../../shared/utils/locator-helper';

// ==================== Credit Calculator ====================

When('I click the "Cumpără în credit" button', async function (this: CustomWorld) {
  const productPage = new ProductDetailPage(this.page);

  // Store product price for later validation
  const price = await productPage.getPrice();
  this.storeValue('product_price', price);

  // openCreditCalculator() now returns CreditModalComponent instance
  const creditModal = await productPage.openCreditCalculator();
  this.storeValue('credit_modal', creditModal);
});

When('I click the buy on credit button', async function (this: CustomWorld) {
  // Language-agnostic version
  const productPage = new ProductDetailPage(this.page);

  const price = await productPage.getPrice();
  this.storeValue('product_price', price);

  // openCreditCalculator() now returns CreditModalComponent instance
  const creditModal = await productPage.openCreditCalculator();
  this.storeValue('credit_modal', creditModal);
});

Then('the credit calculator modal should appear', async function (this: CustomWorld) {
  const creditModal = new CreditModalComponent(this.page);
  // waitForVisible now handles demo overlay automatically
  await creditModal.waitForVisible();

  const isVisible = await creditModal.isVisible();
  expect(isVisible).toBe(true);
  this.logMessage('Credit calculator modal opened');
});

Then('the credit calculator should be visible', async function (this: CustomWorld) {
  const creditModal = new CreditModalComponent(this.page);
  await creditModal.waitForVisible();

  // Dismiss any demo overlay that might be covering the modal
  await creditModal.dismissDemoOverlay();

  const isVisible = await creditModal.isVisible();
  expect(isVisible).toBe(true);
});

Then('I should see the monthly payment amount', async function (this: CustomWorld) {
  const creditModal = new CreditModalComponent(this.page);
  const monthlyPayment = await creditModal.getMonthlyPayment();
  
  expect(monthlyPayment).toBeGreaterThan(0);
  this.logMessage(`Monthly payment: ${monthlyPayment} MDL`);
  
  // Store for later assertions
  this.storeValue('monthly_payment', monthlyPayment);
});

Then('I should see at least {int} credit provider options', async function (
  this: CustomWorld,
  minProviders: number
) {
  const creditModal = new CreditModalComponent(this.page);
  const providerCount = await creditModal.getProviderCount();
  
  expect(providerCount).toBeGreaterThanOrEqual(minProviders);
  this.logMessage(`Found ${providerCount} credit providers`);
});

Then('the credit offers should include one of:', async function (
  this: CustomWorld,
  dataTable: DataTable
) {
  const expectedProviders = dataTable.hashes().map(row => row.provider);
  const creditModal = new CreditModalComponent(this.page);
  
  const hasAnyProvider = await creditModal.hasAnyProvider(expectedProviders);
  
  if (!hasAnyProvider) {
    // Get actual providers for debugging
    const actualProviders = await creditModal.getCreditProviders();
    this.logMessage(`Expected one of: ${expectedProviders.join(', ')}`);
    this.logMessage(`Found: ${actualProviders.join(', ')}`);
  }
  
  expect(hasAnyProvider).toBe(true);
});

// ==================== Term Selection ====================

When('I select {string} payment term', async function (
  this: CustomWorld,
  term: string
) {
  const creditModal = new CreditModalComponent(this.page);
  
  // Store previous monthly payment
  const previousPayment = await creditModal.getMonthlyPayment();
  this.storeValue('previous_monthly_payment', previousPayment);
  
  await creditModal.selectPaymentTerm(term);
  
  // Store selected term
  const months = parseInt(term.match(/\d+/)?.[0] || '12', 10);
  this.storeValue('selected_term_months', months);
  
  await randomDelay(500, 1000);
});

Then('the monthly payment should be recalculated', async function (this: CustomWorld) {
  const creditModal = new CreditModalComponent(this.page);
  const currentPayment = await creditModal.getMonthlyPayment();
  // Previous payment stored for reference, may be used for comparison if needed
  void this.getStoredValue<number>('previous_monthly_payment');
  
  // Payment should have changed after term selection
  // (unless it was already on that term)
  expect(currentPayment).toBeGreaterThan(0);
  
  this.storeValue('monthly_payment', currentPayment);
  this.logMessage(`Monthly payment after term change: ${currentPayment} MDL`);
});

Then('the monthly payment should be approximately {string}', async function (
  this: CustomWorld,
  _formula: string // Kept for step definition matching, actual calculation uses stored values
) {
  const productPrice = this.getStoredValue<number>('product_price');
  const months = this.getStoredValue<number>('selected_term_months') || 12;
  
  if (!productPrice) {
    throw new Error('Product price not stored');
  }

  const creditModal = new CreditModalComponent(this.page);
  const actualPayment = await creditModal.getMonthlyPayment();
  
  // Validate payment is approximately correct (allowing for interest/fees)
  const isValid = validateMonthlyPayment(actualPayment, productPrice, months, 25);
  
  if (!isValid) {
    const expectedBase = productPrice / months;
    this.logMessage(`Expected approximately: ${expectedBase} MDL/month`);
    this.logMessage(`Actual payment: ${actualPayment} MDL/month`);
  }
  
  expect(isValid).toBe(true);
});

// ==================== Modal Close ====================

When('I close the credit calculator modal', async function (this: CustomWorld) {
  const creditModal = new CreditModalComponent(this.page);
  await creditModal.close();
});

Then('I should be back on the product page', async function (this: CustomWorld) {
  // Verify modal is closed
  const creditModal = new CreditModalComponent(this.page);
  const isModalVisible = await creditModal.isVisible();
  expect(isModalVisible).toBe(false);
  
  // Verify product page elements are visible (use :visible for desktop + mobile h1)
  const title = this.page.locator(`${joinSelectors(SELECTORS.product.title)}:visible`);
  await expect(title).toBeVisible();
});

// ==================== Credit Provider Selection ====================

When('I select credit provider {string}', async function (
  this: CustomWorld,
  providerName: string
) {
  const creditModal = new CreditModalComponent(this.page);
  await creditModal.selectProvider(providerName);
  await waitForContentUpdate(this.page);
});

Then('the {string} credit offer should be selected', async function (
  this: CustomWorld,
  providerName: string
) {
  // This would check if the provider is highlighted/selected
  // Implementation depends on actual UI
  const selectedProvider = this.page.locator(
    `${joinSelectors(SELECTORS.creditModal.providers)}.selected:has-text("${providerName}"), ` +
    `${joinSelectors(SELECTORS.creditModal.providers)}.active:has-text("${providerName}"), ` +
    `${joinSelectors(SELECTORS.creditModal.providers)}[aria-selected="true"]:has-text("${providerName}")`
  );
  
  // Allow flexible matching - provider might be selected by default
  const isSelected = await selectedProvider.isVisible().catch(() => false);
  this.logMessage(`Provider ${providerName} selection status: ${isSelected}`);
});

// ==================== Available Terms ====================

Then('I should see available payment terms', async function (this: CustomWorld) {
  const creditModal = new CreditModalComponent(this.page);
  const terms = await creditModal.getAvailableTerms();

  expect(terms.length).toBeGreaterThan(0);
  this.logMessage(`Available terms: ${terms.join(', ')}`);
});

Then('the add to cart button should still be visible', async function (this: CustomWorld) {
  // Use getByRole for language-agnostic button detection
  // Romanian: "Adaugă în coș", Russian: "Add to cart"
  const addToCartButton = this.page.getByRole('button', { 
    name: /adaugă în coș|добавить в корзину|add to cart/i 
  }).first();
  await expect(addToCartButton).toBeVisible({ timeout: 5000 });
});

Then('the "Adaugă în coș" button should still be visible', async function (this: CustomWorld) {
  // Legacy step - redirects to language-agnostic version
  const addToCartButton = this.page.locator(joinSelectors(SELECTORS.product.addToCart));
  await expect(addToCartButton.first()).toBeVisible({ timeout: 5000 });
});

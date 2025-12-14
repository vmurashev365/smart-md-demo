/**
 * Price Utilities for Smart.md Testing
 *
 * Functions for parsing, comparing, and validating prices
 * in Moldovan Lei (MDL) format.
 *
 * @updated December 2025 - Added tolerance-based assertions
 */

import { Page } from '@playwright/test';

/**
 * Currency configuration for Moldova
 */
export const CURRENCY = {
  code: 'MDL',
  symbol: 'lei',
  symbolAlt: 'лей',
  decimalSeparator: ',',
  thousandsSeparator: ' ',
  decimalPlaces: 2,
};

/**
 * Parse price string to number
 * Handles various formats:
 * - "10 999 lei"
 * - "10.999 lei"
 * - "10,999.00 MDL"
 * - "10 999,00 MDL"
 * - "от 5 999 лей"
 *
 * @param priceString - Price string to parse
 * @returns Parsed price as number
 * @throws Error if price cannot be parsed
 */
export function parsePrice(priceString: string): number {
  if (!priceString || typeof priceString !== 'string') {
    throw new Error(`Invalid price text: ${priceString}`);
  }

  // Remove currency symbols, "от/from" prefix and trim
  let cleaned = priceString
    .replace(/lei/gi, '')
    .replace(/лей/gi, '')
    .replace(/MDL/gi, '')
    .replace(/€/g, '')
    .replace(/\$/g, '')
    .replace(/^от\s*/gi, '')  // "from 5 999"
    .replace(/^from\s*/gi, '')
    .replace(/^de la\s*/gi, '')
    .trim();

  // Remove thousand separators (spaces)
  cleaned = cleaned.replace(/[\s ]+/g, '');

  // Determine format by decimal separator position
  // "10.999" (dot as thousands) vs "10,99" (comma as decimal)
  const hasCommaDecimal = /,\d{1,2}$/.test(cleaned);
  const hasDotDecimal = /\.\d{1,2}$/.test(cleaned);

  if (hasCommaDecimal) {
    // Format: 10.999,00 or 10 999,00
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasDotDecimal) {
    // Format: 10,999.00
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Format without decimals: 10 999 or 10.999 or 10,999
    cleaned = cleaned.replace(/[,.\s]/g, '');
  }

  const price = parseFloat(cleaned);

  if (isNaN(price)) {
    throw new Error(`Could not parse price from: "${priceString}"`);
  }

  return price;
}

/**
 * Safe parse price - returns 0 instead of throwing
 */
export function parsePriceSafe(priceString: string): number {
  try {
    return parsePrice(priceString);
  } catch {
    return 0;
  }
}

/**
 * Format number as price string in MDL format
 *
 * @param price - Number to format
 * @param includeSymbol - Whether to include currency symbol
 * @returns Formatted price string
 */
export function formatPrice(price: number, includeSymbol: boolean = true): string {
  const formatted = price.toLocaleString('ro-MD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return includeSymbol ? `${formatted} ${CURRENCY.symbol}` : formatted;
}

/**
 * Compare two prices with tolerance
 *
 * @param price1 - First price
 * @param price2 - Second price
 * @param tolerance - Acceptable difference (default: 1 MDL)
 * @returns true if prices are equal within tolerance
 */
export function pricesEqual(price1: number, price2: number, tolerance: number = 1): boolean {
  return Math.abs(price1 - price2) <= tolerance;
}

/**
 * Assert prices are approximately equal (throws on mismatch)
 *
 * @param actual - Actual price
 * @param expected - Expected price
 * @param tolerance - Acceptable difference (default: 1 MDL)
 * @throws Error if prices differ more than tolerance
 */
export function assertPricesApproximatelyEqual(
  actual: number,
  expected: number,
  tolerance: number = 1
): void {
  const diff = Math.abs(actual - expected);

  if (diff > tolerance) {
    throw new Error(
      `Price mismatch: expected ${expected}, got ${actual} (difference: ${diff}, tolerance: ${tolerance})`
    );
  }
}

/**
 * Check if price is within expected range
 *
 * @param price - Price to check
 * @param min - Minimum expected price
 * @param max - Maximum expected price
 * @returns true if price is within range
 */
export function priceInRange(price: number, min: number, max: number): boolean {
  return price >= min && price <= max;
}

/**
 * Assert price is within range (throws on failure)
 */
export function assertPriceInRange(price: number, min: number, max: number): void {
  if (price < min || price > max) {
    throw new Error(`Price ${price} is out of range [${min}, ${max}]`);
  }
}

/**
 * Calculate total price for quantity
 *
 * @param unitPrice - Price per unit
 * @param quantity - Number of units
 * @returns Total price
 */
export function calculateTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}

/**
 * Calculate discount percentage
 *
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Discount percentage
 */
export function calculateDiscountPercent(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Calculate monthly credit payment (simple calculation)
 *
 * @param totalPrice - Total price
 * @param months - Number of months
 * @param interestRate - Annual interest rate (optional, default 0 for 0% offers)
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  totalPrice: number,
  months: number,
  interestRate: number = 0
): number {
  if (months <= 0) return totalPrice;

  if (interestRate === 0) {
    // Simple division for 0% interest
    return Math.ceil(totalPrice / months);
  }

  // Calculate with interest (annuity formula)
  const monthlyRate = interestRate / 12 / 100;
  const payment =
    (totalPrice * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Math.ceil(payment);
}

/**
 * Validate that monthly payment is approximately correct
 *
 * @param monthlyPayment - Actual monthly payment
 * @param totalPrice - Total product price
 * @param months - Number of months
 * @param tolerancePercent - Acceptable deviation percentage (default: 15%)
 * @returns true if payment is within expected range
 */
export function validateMonthlyPayment(
  monthlyPayment: number,
  totalPrice: number,
  months: number,
  tolerancePercent: number = 15
): boolean {
  const expectedBase = totalPrice / months;
  const toleranceAmount = (expectedBase * tolerancePercent) / 100;

  return monthlyPayment >= expectedBase - toleranceAmount && monthlyPayment <= expectedBase + toleranceAmount;
}

/**
 * Check if products are sorted by price ascending
 *
 * @param prices - Array of prices
 * @returns true if sorted ascending
 */
export function isSortedAscending(prices: number[]): boolean {
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] < prices[i - 1]) {
      return false;
    }
  }
  return true;
}

/**
 * Check if products are sorted by price descending
 *
 * @param prices - Array of prices
 * @returns true if sorted descending
 */
export function isSortedDescending(prices: number[]): boolean {
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      return false;
    }
  }
  return true;
}

/**
 * Extract numeric price from element text
 *
 * @param text - Text containing price
 * @returns Extracted price or 0 if not found
 */
export function extractPrice(text: string): number {
  // Find price pattern: digits with optional spaces/commas/dots
  const pricePattern = /[\d\s,.']+/g;
  const matches = text.match(pricePattern);

  if (!matches) return 0;

  // Try to find the most likely price (longest numeric string)
  const prices = matches
    .map(m => parsePrice(m))
    .filter(p => p > 0);

  return prices.length > 0 ? Math.max(...prices) : 0;
}

/**
 * Get price threshold for expensive products (for credit testing)
 * Products above this threshold typically have credit options
 */
export function getExpensiveProductThreshold(): number {
  return 5000; // 5000 MDL
}

/**
 * Check if product qualifies for credit
 *
 * @param price - Product price
 * @returns true if product likely has credit options
 */
export function qualifiesForCredit(price: number): boolean {
  return price >= getExpensiveProductThreshold();
}

/**
 * Assert prices are sorted (ascending or descending)
 * Uses tolerance for floating point comparison
 *
 * @param prices - Array of prices
 * @param direction - 'asc' or 'desc'
 * @param tolerance - Acceptable tolerance for "equal" prices
 * @throws Error if not properly sorted
 */
export function assertPricesSorted(
  prices: number[],
  direction: 'asc' | 'desc',
  tolerance: number = 1
): void {
  if (prices.length < 2) return;

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];

    if (direction === 'asc' && diff < -tolerance) {
      throw new Error(
        `Prices not sorted ascending at index ${i}: ${prices[i - 1]} -> ${prices[i]}`
      );
    }

    if (direction === 'desc' && diff > tolerance) {
      throw new Error(
        `Prices not sorted descending at index ${i}: ${prices[i - 1]} -> ${prices[i]}`
      );
    }
  }
}

/**
 * Extract all prices from catalog page using multiple selector strategies
 *
 * @param page - Playwright page
 * @param maxProducts - Maximum products to extract prices from
 * @returns Array of parsed prices
 */
export async function extractPricesFromCatalog(page: Page, maxProducts: number = 20): Promise<number[]> {
  const priceSelectors = [
    '[data-testid="product-price"]',
    '[data-price]',
    '.product-price',
    '.price-current',
    '.catalog-item__price',
    '.product-card__price',
  ];

  let priceElements: any[] = [];

  // Try each selector until we find prices
  for (const selector of priceSelectors) {
    priceElements = await page.locator(selector).all();
    if (priceElements.length > 0) break;
  }

  // If still no prices, try extracting from product cards directly
  if (priceElements.length === 0) {
    const productCards = await page.locator(
      '[data-testid="product-card"], .product-card, .catalog-item'
    ).all();

    const prices: number[] = [];
    for (const card of productCards.slice(0, maxProducts)) {
      const text = await card.textContent();
      if (text) {
        const price = extractPrice(text);
        if (price > 0) prices.push(price);
      }
    }
    return prices;
  }

  // Extract from price elements
  const prices: number[] = [];
  for (const element of priceElements.slice(0, maxProducts)) {
    // First check data-price attribute
    const dataPrice = await element.getAttribute('data-price');
    if (dataPrice) {
      const price = parseFloat(dataPrice);
      if (!isNaN(price) && price > 0) {
        prices.push(price);
        continue;
      }
    }

    // Fall back to text content
    const text = await element.textContent();
    if (text) {
      const price = parsePriceSafe(text);
      if (price > 0) prices.push(price);
    }
  }

  return prices;
}

/**
 * Wait for prices to load on page
 */
export async function waitForPrices(page: Page, timeout: number = 10000): Promise<boolean> {
  const priceSelectors = [
    '[data-testid="product-price"]',
    '[data-price]',
    '.product-price',
    '.price-current',
  ];

  const combinedSelector = priceSelectors.join(', ');

  try {
    await page.waitForSelector(combinedSelector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

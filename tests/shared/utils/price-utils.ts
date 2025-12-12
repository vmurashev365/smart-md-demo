/**
 * Price Utilities for Smart.md Testing
 *
 * Functions for parsing, comparing, and validating prices
 * in Moldovan Lei (MDL) format.
 */

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
 * Handles various formats: "1 234,56 lei", "1234.56 MDL", "1,234 лей"
 *
 * @param priceString - Price string to parse
 * @returns Parsed price as number
 */
export function parsePrice(priceString: string): number {
  if (!priceString) return 0;

  // Remove currency symbols and trim
  let cleaned = priceString
    .replace(/lei/gi, '')
    .replace(/лей/gi, '')
    .replace(/MDL/gi, '')
    .replace(/€/g, '')
    .replace(/\$/g, '')
    .trim();

  // Remove thousand separators (spaces and commas when followed by 3 digits)
  cleaned = cleaned.replace(/[\s ]+/g, ''); // Remove spaces
  
  // Handle comma as decimal separator
  // Check if comma is used as decimal (followed by 1-2 digits at end)
  if (/,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Comma is thousand separator
    cleaned = cleaned.replace(/,/g, '');
  }

  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
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
 * Compare two prices with tolerance for floating point errors
 *
 * @param price1 - First price
 * @param price2 - Second price
 * @param tolerance - Acceptable difference (default: 0.01)
 * @returns true if prices are equal within tolerance
 */
export function pricesEqual(price1: number, price2: number, tolerance: number = 0.01): boolean {
  return Math.abs(price1 - price2) <= tolerance;
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

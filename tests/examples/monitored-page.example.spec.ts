/**
 * Example: Using Monitored Page Fixture
 *
 * Demonstrates how to use the monitored-page fixture
 * for continuous security monitoring during stealth tests.
 *
 * The fixture automatically:
 * - Monitors all HTTP responses
 * - Detects WAF blocks (403)
 * - Captures screenshots on security events
 * - Logs server errors (5xx)
 * - Generates Allure reports
 *
 * @example
 */

import { test, expect } from '../shared/fixtures/monitored-page';

test.describe('Example: Monitored Stealth Tests', () => {
  test('Product search with continuous monitoring @stealth', async ({ monitoredPage, stats }) => {
    // Use monitoredPage instead of page
    // All security monitoring happens automatically in background

    await monitoredPage.goto('https://smart.md');

    // Your normal test flow
    await monitoredPage.fill('[name="search"]', 'iPhone');
    await monitoredPage.click('button[type="submit"]');

    await expect(monitoredPage.locator('.product-card')).toHaveCount(10, { timeout: 10000 });

    // Stats are automatically collected
    console.log(`WAF blocks detected: ${stats.wafBlocks}`);
    console.log(`Server errors: ${stats.serverErrors}`);
  });

  test('Product navigation with monitoring @stealth', async ({ monitoredPage }) => {
    await monitoredPage.goto('https://smart.md/catalog/telefoane-si-smartfonuri');

    // Click on first product
    await monitoredPage.locator('.product-card').first().click();

    // Any 403/500 during navigation will be automatically logged
    await expect(monitoredPage).toHaveTitle(/Smart\.md|Pandashop/);
  });

  test('Add to cart with error detection @stealth', async ({ monitoredPage, stats }) => {
    await monitoredPage.goto('https://smart.md');

    // Navigate and add to cart
    // If WAF blocks this action, you'll get screenshot and alert
    await monitoredPage.click('.product-card >> nth=0');
    await monitoredPage.click('button:has-text("În coș")');

    // Verify monitoring captured events
    if (stats.wafBlocks > 0) {
      console.warn('⚠️ WAF blocks occurred during add-to-cart flow');
      console.warn('This may indicate false positives affecting real users');
    }
  });
});

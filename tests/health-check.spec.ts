/**
 * Security Configuration Health Check
 *
 * Pre-flight smoke test to verify site availability and security configuration
 * before running main test suite. Detects critical issues early:
 *
 * - Site downtime (5xx errors)
 * - WAF misconfigurations blocking legitimate traffic (403)
 * - Basic accessibility and response validation
 *
 * This test should run first in CI/CD pipelines to fail fast
 * if fundamental issues prevent test execution.
 *
 * @smoke @health @critical
 * @updated December 2025
 */

import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { alerts } from './shared/utils/alerting';

const BASE_URL = process.env.BASE_URL || 'https://smart.md';
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 2000;

test.describe('Pre-flight Health Checks', () => {
  test.beforeAll(() => {
    console.log('🏥 Starting Security Configuration Health Check...');
    console.log(`   Target: ${BASE_URL}`);
  });

  test('Security Configuration Health Check @smoke @health @critical', async ({ page }) => {
    await allure.epic('Health Checks');
    await allure.feature('Site Availability');
    await allure.story('Security Configuration Validation');

    let response = await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    if (!response) {
      throw new Error('CRITICAL: Failed to get response from site');
    }

    const status = response.status();
    const url = response.url();

    // Log response details
    console.log(`✓ Initial response received`);
    console.log(`  Status: ${status}`);
    console.log(`  URL: ${url}`);

    // Scenario 1: Site is down (5xx errors)
    if (status >= 500 && status < 600) {
      await allure.step(`CRITICAL: Server error detected - ${status}`, async () => {});

      // Retry logic for transient errors
      console.warn(`⚠️ Server error (${status}), attempting retry...`);

      let retryCount = 0;
      while (retryCount < RETRY_ATTEMPTS && status >= 500) {
        retryCount++;
        console.log(`   Retry ${retryCount}/${RETRY_ATTEMPTS} after ${RETRY_DELAY_MS}ms...`);

        await page.waitForTimeout(RETRY_DELAY_MS);
        response = await page.reload({ waitUntil: 'domcontentloaded' });

        if (response && response.status() < 500) {
          console.log(`✓ Recovery successful after retry ${retryCount}`);
          break;
        }
      }

      // Still failing after retries
      if (response && response.status() >= 500) {
        const browserName = test.info().project.name || 'unknown';
        const timestamp = Date.now();
        
        // Capture error page with browser context
        const screenshot = await page.screenshot({
          path: `test-results/critical-site-down-${browserName}-${timestamp}.png`,
          fullPage: true,
        });

        await allure.attachment('Site Down Screenshot', screenshot, 'image/png');

        // Capture response headers
        const headers = response.headers();
        await allure.attachment('Response Headers', JSON.stringify(headers, null, 2), 'application/json');

        // Send alert to Slack/Telegram
        await alerts.siteDown(response.status(), RETRY_ATTEMPTS);

        throw new Error(
          `CRITICAL: Site is down (${response.status()}). ` +
            `Failed after ${RETRY_ATTEMPTS} retry attempts. ` +
            `Immediate manual check required.`
        );
      }
    }

    // Scenario 2: WAF is blocking human-like traffic (403 Forbidden)
    if (status === 403) {
      await allure.step('SECURITY ALERT: WAF blocking detected', async () => {});

      console.error('🚨 SECURITY ALERT: WAF is blocking human-like access');
      console.error(`   URL: ${url}`);
      console.error(`   Status: ${status}`);

      const browserName = test.info().project.name || 'unknown';
      const timestamp = Date.now();
      const deviceType = browserName.includes('mobile') || browserName.includes('Mobile') ? 'mobile' : 'desktop';

      // Capture screenshot with browser/device context
      const screenshot = await page.screenshot({
        path: `test-results/waf-block-${deviceType}-${browserName}-${timestamp}.png`,
        fullPage: true,
      });

      await allure.attachment('WAF Block Screenshot', screenshot, 'image/png');

      // Capture diagnostic information
      const headers = response?.headers() || {};
      const diagnostics = {
        status: status,
        url: url,
        browser: browserName,
        deviceType: deviceType,
        server: headers['server'] || 'unknown',
        cloudflare: headers['cf-ray'] || 'N/A',
        userAgent: await page.evaluate(() => navigator.userAgent),
        timestamp: new Date().toISOString(),
      };

      console.error('   Diagnostics:', JSON.stringify(diagnostics, null, 2));
      await allure.attachment('WAF Block Diagnostics', JSON.stringify(diagnostics, null, 2), 'application/json');

      // Send real-time alert to Slack/Telegram
      await alerts.wafBlock(url, diagnostics, screenshot);

      // Check for Cloudflare challenge page
      const pageContent = await page.content();
      const isCloudflareChallenge = pageContent.includes('Cloudflare') || pageContent.includes('cf-wrapper');

      if (isCloudflareChallenge) {
        console.error('   ⚠️ Detected: Cloudflare Challenge/Block');
      }

      throw new Error(
        'SECURITY ALERT: WAF is blocking human-like access. ' +
          'Potential False Positive affecting real users. ' +
          'Verify WAF rules immediately. ' +
          (isCloudflareChallenge ? 'Cloudflare challenge detected.' : '')
      );
    }

    // Scenario 3: Unexpected redirect or status
    if (status >= 300 && status < 400) {
      console.log(`ℹ️ Redirect detected: ${status} -> ${url}`);
      await allure.step(`Redirect: ${status} -> ${url}`, async () => {});
    }

    // Scenario 4: All OK - validate basic page structure
    if (status >= 200 && status < 300) {
      console.log('✓ Site is accessible');

      // Validate page title
      await expect(page).toHaveTitle(/Pandashop|Smart/i, {
        timeout: 5000,
      });

      console.log('✓ Page title validated');

      // Check for basic page structure
      const bodyExists = await page.locator('body').count();
      expect(bodyExists).toBeGreaterThan(0);

      console.log('✓ Page structure validated');

      // Check security headers
      const headers = response?.headers() || {};
      const securityHeaders = {
        'strict-transport-security': headers['strict-transport-security'],
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'content-security-policy': headers['content-security-policy'],
      };

      console.log('🔒 Security Headers:');
      Object.entries(securityHeaders).forEach(([key, value]) => {
        console.log(`   ${key}: ${value || 'NOT SET'}`);
      });

      await allure.attachment('Security Headers', JSON.stringify(securityHeaders, null, 2), 'application/json');

      await allure.step('✅ All health checks passed', async () => {});
    }

    // Hard fail assertion: ensure test fails if status is not 200-299
    // This guarantees CI/CD pipeline will turn red on any issues
    expect(status, `Expected successful status code (200-299), got ${status}`).toBeGreaterThanOrEqual(200);
    expect(status, `Expected successful status code (200-299), got ${status}`).toBeLessThan(300);
  });

  test.afterAll(() => {
    console.log('🏥 Health Check completed');
  });
});

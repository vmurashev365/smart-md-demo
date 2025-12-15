/**
 * Monitored Page Fixture
 *
 * Extends Playwright's page fixture with continuous monitoring
 * for security and availability issues during test execution.
 *
 * Features:
 * - Real-time WAF block detection (403)
 * - Server error monitoring (5xx)
 * - Screenshot capture on security events
 * - Allure attachment integration
 *
 * @updated December 2025
 */

import { test as base, Page } from '@playwright/test';
import { allure } from 'allure-playwright';
import { alerts } from '../utils/alerting';

interface MonitoringStats {
  wafBlocks: number;
  serverErrors: number;
  blockedUrls: string[];
  errorUrls: string[];
}

export const test = base.extend<{ monitoredPage: Page; stats: MonitoringStats }>({
  stats: async ({}, use) => {
    const stats: MonitoringStats = {
      wafBlocks: 0,
      serverErrors: 0,
      blockedUrls: [],
      errorUrls: [],
    };
    await use(stats);
  },

  monitoredPage: async ({ page, stats }, use) => {
    console.log('🔍 Starting continuous security monitoring...');

    // Response listener for continuous monitoring
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();

      // WAF/Security block detection (403 Forbidden)
      if (status === 403) {
        stats.wafBlocks++;
        stats.blockedUrls.push(url);

        console.warn(`⚠️ WAF BLOCK DETECTED [${stats.wafBlocks}]`);
        console.warn(`   URL: ${url}`);
        console.warn(`   Status: ${status}`);

        // Log response headers for diagnosis
        const headers = response.headers();
        console.warn(`   Server: ${headers['server'] || 'unknown'}`);
        console.warn(`   CF-Ray: ${headers['cf-ray'] || 'N/A'}`);

        // Capture screenshot for analysis with browser context
        try {
          const browserName = base.info().project?.name || 'unknown';
          const deviceType = browserName.includes('mobile') || browserName.includes('Mobile') ? 'mobile' : 'desktop';
          const timestamp = Date.now();

          const screenshot = await page.screenshot({
            path: `test-results/waf-block-${deviceType}-${browserName}-${timestamp}.png`,
            fullPage: true,
          });

          // Attach to Allure report
          await allure.attachment(
            `WAF Block Screenshot - ${new URL(url).pathname} [${browserName}]`,
            screenshot,
            'image/png'
          );

          console.warn(`   📸 Screenshot saved: ${deviceType}/${browserName}`);

          // Send real-time alert
          await alerts.wafBlock(url, {
            browser: browserName,
            deviceType: deviceType,
            server: headers['server'] || 'unknown',
            cloudflare: headers['cf-ray'] || 'N/A',
          }, screenshot);
        } catch (error) {
          console.error('Failed to capture WAF block screenshot:', error);
        }
      }

      // Server error detection (5xx)
      if (status >= 500 && status < 600) {
        stats.serverErrors++;
        stats.errorUrls.push(url);

        console.error(`🔴 SERVER ERROR DETECTED [${stats.serverErrors}]`);
        console.error(`   URL: ${url}`);
        console.error(`   Status: ${status} ${response.statusText()}`);

        // Log error details to Allure
        await allure.step(`Server Error: ${status} on ${url}`, async () => {});
      }
    });

    // Request failure listener
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      console.error(`❌ REQUEST FAILED: ${request.url()}`);
      console.error(`   Error: ${failure?.errorText || 'Unknown'}`);
    });

    // Use the page with monitoring enabled
    await use(page);

    // Report statistics after test completion
    if (stats.wafBlocks > 0 || stats.serverErrors > 0) {
      console.log('\n📊 Security Monitoring Summary:');
      console.log(`   WAF Blocks: ${stats.wafBlocks}`);
      console.log(`   Server Errors: ${stats.serverErrors}`);

      if (stats.wafBlocks > 0) {
        console.log(`   Blocked URLs: ${stats.blockedUrls.join(', ')}`);
      }

      if (stats.serverErrors > 0) {
        console.log(`   Error URLs: ${stats.errorUrls.join(', ')}`);
      }

      // Attach summary to Allure
      await allure.attachment(
        'Security Monitoring Report',
        JSON.stringify(
          {
            wafBlocks: stats.wafBlocks,
            serverErrors: stats.serverErrors,
            blockedUrls: stats.blockedUrls,
            errorUrls: stats.errorUrls,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
        'application/json'
      );
    }
  },
});

export { expect } from '@playwright/test';

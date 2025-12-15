/**
 * Cucumber Hooks
 *
 * Before/After hooks for test setup and teardown.
 * Implements anti-detection measures and human-like behavior.
 */

import { Before, After, BeforeAll, AfterAll, BeforeStep, AfterStep, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { CustomWorld } from './custom-world';
import {
  getRandomFingerprint,
  getAntiDetectionScript,
  getAntiDetectionArgs,
  getDeviceFingerprint,
} from '../../shared/utils/browser-fingerprint';

// Set default timeout for all steps
setDefaultTimeout(60 * 1000); // 60 seconds

// Global browser instance
let browser: Browser;

// Cookies storage path
const COOKIES_PATH = path.resolve(process.cwd(), 'auth/cookies.json');

/**
 * Ensure auth directory exists
 */
function ensureAuthDir(): void {
  const authDir = path.dirname(COOKIES_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
}

/**
 * Load saved cookies if available
 * @returns Storage state or undefined
 */
function loadCookies(): string | undefined {
  if (fs.existsSync(COOKIES_PATH) && process.env.SAVE_COOKIES !== 'false') {
    return COOKIES_PATH;
  }
  return undefined;
}

/**
 * Save cookies for next session
 * @param context - Browser context
 */
async function saveCookies(context: BrowserContext): Promise<void> {
  if (process.env.SAVE_COOKIES !== 'false') {
    ensureAuthDir();
    await context.storageState({ path: COOKIES_PATH });
  }
}

/**
 * BeforeAll - Launch browser once for all scenarios
 */
BeforeAll(async function () {
  ensureAuthDir();

  const headless = process.env.HEADLESS === 'true';
  const slowMo = parseInt(process.env.SLOW_MO || '50', 10);

  // Launch real Chrome for anti-detection
  browser = await chromium.launch({
    channel: 'chrome', // Use real Chrome, not Chromium
    headless: headless,
    slowMo: slowMo,
    args: getAntiDetectionArgs(),
  });

  console.log(`Browser launched: Chrome (headless: ${headless}, slowMo: ${slowMo}ms)`);
});

/**
 * AfterAll - Close browser after all scenarios
 */
AfterAll(async function () {
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
});

/**
 * Before - Setup for each scenario
 */
Before(async function (this: CustomWorld, scenario) {
  // Get fingerprint (random or device-specific)
  const fingerprint = this.currentDevice
    ? { ...getRandomFingerprint(), ...getDeviceFingerprint(this.currentDevice) }
    : getRandomFingerprint();

  // Disable human-like delays for mobile tests (faster execution, no bot protection)
  if (this.currentDevice) {
    process.env.DISABLE_HUMAN_DELAYS = 'true';
    console.log('Mobile device detected - human-like delays disabled');
  } else {
    process.env.DISABLE_HUMAN_DELAYS = 'false';
  }

  // Create browser context with anti-detection settings
  this.context = await browser.newContext({
    baseURL: this.baseUrl,
    viewport: fingerprint.viewport,
    userAgent: fingerprint.userAgent,
    locale: fingerprint.locale,
    timezoneId: fingerprint.timezoneId,
    geolocation: fingerprint.geolocation,
    permissions: ['geolocation'],
    colorScheme: fingerprint.colorScheme,
    deviceScaleFactor: fingerprint.deviceScaleFactor,
    bypassCSP: true,
    ignoreHTTPSErrors: true,
    // Load saved cookies if available
    storageState: loadCookies(),
  });

  // Inject anti-detection script
  await this.context.addInitScript(getAntiDetectionScript());

  // Create new page
  this.page = await this.context.newPage();

  // Set default timeout
  this.page.setDefaultTimeout(parseInt(process.env.DEFAULT_TIMEOUT || '60000', 10));
  this.page.setDefaultNavigationTimeout(parseInt(process.env.NAVIGATION_TIMEOUT || '60000', 10));

  // Store browser reference
  this.browser = browser;

  // Reset timer
  this.resetTimer();

  // Log scenario start
  const tags = scenario.pickle.tags.map(t => t.name).join(', ');
  console.log(`\nScenario: ${scenario.pickle.name}`);
  if (tags) {
    console.log(`Tags: ${tags}`);
  }
});

/**
 * After - Cleanup after each scenario
 */
After(async function (this: CustomWorld, scenario) {
  // Take screenshot on failure
  if (scenario.result?.status === Status.FAILED) {
    try {
      const screenshot = await this.page.screenshot({
        fullPage: true,
      });
      this.attach(screenshot, 'image/png');
      console.log('Screenshot captured on failure');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }

    // Attach page URL
    try {
      this.attach(`Failed at URL: ${this.page.url()}`, 'text/plain');
    } catch {
      // Ignore
    }
  }

  // Save cookies for session persistence
  if (this.context) {
    try {
      await saveCookies(this.context);
    } catch (error) {
      console.error('Failed to save cookies:', error);
    }
  }

  // Close context
  if (this.context) {
    await this.context.close();
  }

  // Clear stored values
  this.clearAllStoredValues();

  // Log elapsed time
  const elapsed = this.getElapsedTime();
  const status = scenario.result?.status || 'UNKNOWN';
  console.log(`Scenario ${status} in ${elapsed}ms`);
});

/**
 * BeforeStep - Log step execution (debug mode)
 */
BeforeStep(async function (this: CustomWorld, { pickleStep }) {
  if (process.env.DEBUG) {
    console.log(`  Step: ${pickleStep.text}`);
  }
});

/**
 * AfterStep - Handle step completion
 */
AfterStep(async function (this: CustomWorld, { result, pickleStep }) {
  // Log failed steps
  if (result.status === Status.FAILED) {
    console.error(`  ❌ Step failed: ${pickleStep.text}`);
    if (result.message) {
      console.error(`     Error: ${result.message.split('\n')[0]}`);
    }
  }
});

/**
 * Before hook for mobile scenarios
 */
Before({ tags: '@mobile' }, async function (this: CustomWorld) {
  // Set default mobile device if not already set
  if (!this.currentDevice) {
    this.setDevice(this.defaultDevice || 'iPhone 14');
  }
});

/**
 * Before hook for desktop-only scenarios
 */
Before({ tags: '@desktop' }, async function (this: CustomWorld) {
  this.setDevice(null);
});

/**
 * Before hook for critical scenarios - add extra stability
 */
Before({ tags: '@critical' }, async function (this: CustomWorld) {
  // Increase timeouts for critical tests
  if (this.page) {
    this.page.setDefaultTimeout(90000);
    this.page.setDefaultNavigationTimeout(60000);
  }
});

/**
 * UI-Based Dynamic Data Injection Hook (Cloudflare-Safe)
 * 
 * Fetches valid product via UI search instead of API to bypass Cloudflare WAF detection.
 * Uses existing browser session (already passed challenge) with human-like behavior.
 * 
 * Why UI instead of API?
 * - Cloudflare blocks fast API requests as bot traffic (403 Forbidden)
 * - UI search uses same page session (shared cookies/fingerprint)
 * - Human-like delays and interactions appear legitimate to WAF
 * 
 * Trade-off: ~5 seconds slower per test, but 100% reliable with Cloudflare
 */
Before({ tags: '@needs_product' }, async function (this: CustomWorld) {
  console.log('🔍 Dynamic Data: Searching via UI (Cloudflare-safe method)...');
  
  // Lazy import page objects
  const { HomePage } = await import('../../shared/page-objects/home.page');
  const { SearchResultsPage } = await import('../../shared/page-objects/search-results.page');
  const { ProductDetailPage } = await import('../../shared/page-objects/product-detail.page');
  
  try {
    const homePage = new HomePage(this.page);
    const searchResults = new SearchResultsPage(this.page);
    const productPage = new ProductDetailPage(this.page);
    
    // 1. Open homepage (initializes Cloudflare cookies if needed)
    console.log('   Step 1: Opening homepage...');
    await homePage.open();
    
    // 2. Search for popular query with expensive products
    const searchQuery = 'Samsung';
    console.log(`   Step 2: Searching for "${searchQuery}"...`);
    await homePage.search(searchQuery);
    await searchResults.waitForResults();
    
    // 3. Check that we have results
    const productCount = await searchResults.getProductCount();
    console.log(`   Found ${productCount} products`);
    
    if (productCount === 0) {
      throw new Error('❌ FAIL FAST: Search returned no products. Site may be down.');
    }
    
    // 4. Click FIRST product (simplest approach - no parsing needed)
    console.log('   Step 3: Opening first product...');
    await searchResults.clickProductByIndex(0);
    await productPage.waitForPageLoad();
    
    // 5. Get data from product page
    const productTitle = await productPage.getTitle();
    const productPrice = await productPage.getPrice();
    const productUrl = this.page.url();
    
    // 6. Verify price meets criteria (>2000 MDL for credit tests)
    if (productPrice < 2000) {
      console.warn(`⚠️ First product price (${productPrice} MDL) < 2000. Tests may fail for credit scenarios.`);
    }
    
    console.log(`   ✓ Product: "${productTitle}"`);
    console.log(`   ✓ Price: ${productPrice} MDL`);
    
    // 7. Store in testData for scenario steps
    this.testData.targetProduct = {
      id: 'ui-dynamic',
      title: productTitle,
      price: productPrice,
      url: productUrl,
      brand: productTitle.split(' ')[0], // Extract brand from title
      available: true,
    };
    
    // 8. Return to homepage so scenario starts clean
    console.log('   Step 4: Returning to homepage...');
    await homePage.open();
    
    console.log(`✅ Dynamic Data Ready: ${productTitle} (${productPrice} MDL)`);
    
    // Attach to report for visibility
    await this.attachJson({
      dynamicDataInjection: true,
      method: 'UI-based (Cloudflare-safe)',
      targetProduct: this.testData.targetProduct,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Dynamic Data Injection failed:', error);
    throw error;
  }
});

export { browser };

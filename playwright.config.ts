import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Determine worker count based on API_PROFILE
 * 
 * Throttling logic (semaphores) only works within a single process.
 * For 'stealth' and 'normal' profiles, we must limit workers to ensure
 * proper rate limiting across all tests.
 */
function getWorkerCount(): number {
  const profile = process.env.API_PROFILE?.toLowerCase();
  
  // CI always uses 1 worker
  if (process.env.CI) {
    return 1;
  }
  
  // Stealth profile: strictly sequential
  if (profile === 'stealth') {
    console.log('🎭 Stealth profile: forcing 1 worker for proper throttling');
    return 1;
  }
  
  // Normal profile: limited parallelism
  if (profile === 'normal') {
    console.log('🚶 Normal profile: limiting to 2 workers for throttling');
    return 2;
  }
  
  // Fast/burst profiles: allow parallelism
  // Default: 4 workers
  return 4;
}

/**
 * Playwright Configuration for Smart.md E2E Testing
 * 
 * Features:
 * - Multi-browser support (Chromium, Firefox, WebKit)
 * - Mobile device emulation
 * - Human-like behavior settings
 * - Anti-detection configurations
 * - Allure reporting integration
 * - API throttling with profile-based worker limits
 */
export default defineConfig({
  testDir: './tests',
  
  /* Global timeout for each test */
  timeout: 60000,
  
  /* Timeout for each expect() assertion */
  expect: {
    timeout: 60000,
  },
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  
  /* Worker count based on API_PROFILE for proper throttling */
  workers: getWorkerCount(),
  
  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
    ['allure-playwright', {
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: true,
    }],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for Smart.md */
    baseURL: process.env.BASE_URL || 'https://smart.md',
    
    /* Collect trace when retrying the failed test */
    trace: 'retain-on-failure',
    
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video for all tests - important for demo! */
    video: 'on',
    
    /* Maximum time each action can take */
    actionTimeout: 15000,
    
    /* Maximum time for navigation */
    navigationTimeout: 30000,
    
    /* Human-like behavior settings */
    locale: 'ro-MD',
    timezoneId: 'Europe/Chisinau',
    
    /* Geolocation for Chisinau, Moldova */
    geolocation: { latitude: 47.0105, longitude: 28.8638 },
    permissions: ['geolocation'],
    
    /* Browser context options for anti-detection */
    contextOptions: {
      strictSelectors: false,
    },
    
    /* Viewport settings */
    viewport: { width: 1366, height: 768 },
    
    /* User agent override */
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    /* Bypass CSP for testing */
    bypassCSP: true,
    
    /* Accept downloads */
    acceptDownloads: true,
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },
  
  /* Configure projects for major browsers and devices */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Use real Chrome for anti-detection
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
          slowMo: parseInt(process.env.SLOW_MO || '50'),
        },
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          slowMo: parseInt(process.env.SLOW_MO || '50'),
        },
      },
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        launchOptions: {
          slowMo: parseInt(process.env.SLOW_MO || '50'),
        },
      },
    },
    
    /* Mobile Chrome - Pixel 5 */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        launchOptions: {
          slowMo: parseInt(process.env.SLOW_MO || '50'),
        },
      },
    },
    
    /* Mobile Safari - iPhone 14 */
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 14'],
        launchOptions: {
          slowMo: parseInt(process.env.SLOW_MO || '50'),
        },
      },
    },
    
    /* Mobile Chrome - iPhone 14 for cross-browser mobile */
    {
      name: 'mobile-iphone',
      use: {
        ...devices['iPhone 14'],
        browserName: 'webkit',
        launchOptions: {
          slowMo: parseInt(process.env.SLOW_MO || '50'),
        },
      },
    },
    
    /* API Testing Project */
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts$/,
      use: {
        baseURL: process.env.API_BASE_URL || 'https://smart.md',
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Accept-Language': 'ru,ro;q=0.9',
        },
      },
    },
  ],
  
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
  
  /* Global setup/teardown */
  // globalSetup: require.resolve('./tests/e2e/support/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/support/global-teardown.ts'),
});

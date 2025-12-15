/**
 * Browser Fingerprint Randomization Utilities
 *
 * Makes each test session look unique to avoid detection.
 * Includes realistic user agents, viewports, and browser configurations.
 */

/**
 * Pool of realistic User-Agents (updated for 2024/2025)
 * These should be updated periodically to reflect current browser versions
 * Last updated: December 2025
 */
export const USER_AGENTS = [
  // Chrome on Windows (v143 - current stable)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',

  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',

  // Firefox on Windows (v133 - current stable)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',

  // Firefox on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',

  // Safari on macOS (v18 - current)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',

  // Edge on Windows (v143 - current stable)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
];

/**
 * Mobile User-Agents
 */
export const MOBILE_USER_AGENTS = [
  // iPhone Safari (iOS 18)
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',

  // Android Chrome
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
];

/**
 * Realistic desktop screen resolutions
 * Based on actual market share data
 */
export const VIEWPORTS = [
  { width: 1920, height: 1080 }, // Full HD - most common
  { width: 1366, height: 768 }, // HD - very common on laptops
  { width: 1536, height: 864 }, // Common on 15" laptops
  { width: 1440, height: 900 }, // MacBook Pro 13"
  { width: 1280, height: 720 }, // HD
  { width: 1680, height: 1050 }, // Common on larger displays
  { width: 1600, height: 900 }, // 16:9 variant
  { width: 2560, height: 1440 }, // QHD - high-end displays
];

/**
 * Mobile viewports
 */
export const MOBILE_VIEWPORTS = [
  { width: 390, height: 844 }, // iPhone 14
  { width: 393, height: 873 }, // iPhone 15
  { width: 414, height: 896 }, // iPhone 11/XR
  { width: 412, height: 915 }, // Pixel 5/6/7
  { width: 360, height: 800 }, // Common Android
];

/**
 * Supported languages for Moldova
 */
export const LOCALES = ['ro-MD', 'ro', 'ru-MD', 'ru', 'en-US', 'en'];

/**
 * Timezone for Moldova
 */
export const MOLDOVA_TIMEZONE = 'Europe/Chisinau';

/**
 * Geolocation coordinates for Chisinau, Moldova
 */
export const CHISINAU_GEOLOCATION = {
  latitude: 47.0105,
  longitude: 28.8638,
  accuracy: 100,
};

/**
 * WebGL Renderer strings (for fingerprint diversity)
 */
export const WEBGL_RENDERERS = [
  'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) Iris(R) Plus Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'Apple GPU',
];

/**
 * Get a random item from an array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Browser fingerprint configuration
 */
export interface BrowserFingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  locale: string;
  timezoneId: string;
  geolocation: { latitude: number; longitude: number; accuracy: number };
  colorScheme: 'light' | 'dark' | 'no-preference';
  deviceScaleFactor: number;
}

/**
 * Get a random desktop fingerprint
 * @returns Random browser fingerprint configuration
 */
export function getRandomFingerprint(): BrowserFingerprint {
  return {
    userAgent: getRandomItem(USER_AGENTS),
    viewport: getRandomItem(VIEWPORTS),
    locale: 'ro-MD',
    timezoneId: MOLDOVA_TIMEZONE,
    geolocation: CHISINAU_GEOLOCATION,
    colorScheme: Math.random() > 0.3 ? 'light' : 'dark',
    deviceScaleFactor: Math.random() > 0.5 ? 1 : 2,
  };
}

/**
 * Get a random mobile fingerprint
 * @returns Random mobile fingerprint configuration
 */
export function getRandomMobileFingerprint(): BrowserFingerprint {
  return {
    userAgent: getRandomItem(MOBILE_USER_AGENTS),
    viewport: getRandomItem(MOBILE_VIEWPORTS),
    locale: 'ro-MD',
    timezoneId: MOLDOVA_TIMEZONE,
    geolocation: CHISINAU_GEOLOCATION,
    colorScheme: Math.random() > 0.3 ? 'light' : 'dark',
    deviceScaleFactor: Math.random() > 0.3 ? 2 : 3, // Mobile usually has higher DPR
  };
}

/**
 * Get fingerprint for a specific device emulation
 * @param deviceName - Name of the device to emulate
 * @returns Fingerprint configuration
 */
export function getDeviceFingerprint(deviceName: string): Partial<BrowserFingerprint> {
  const deviceConfigs: Record<string, Partial<BrowserFingerprint>> = {
    'iPhone 14': {
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      deviceScaleFactor: 3,
    },
    'iPhone 15': {
      viewport: { width: 393, height: 873 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      deviceScaleFactor: 3,
    },
    'Pixel 5': {
      viewport: { width: 393, height: 851 },
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      deviceScaleFactor: 2.75,
    },
    'Samsung Galaxy S21': {
      viewport: { width: 360, height: 800 },
      userAgent:
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      deviceScaleFactor: 3,
    },
  };

  return (
    deviceConfigs[deviceName] || {
      ...getRandomMobileFingerprint(),
    }
  );
}

/**
 * Script to inject for hiding automation indicators
 * @returns JavaScript code to inject into page
 */
export function getAntiDetectionScript(): string {
  return `
    // Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Override plugins to look like a real browser
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const plugins = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ];
        return plugins;
      },
    });

    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ro-MD', 'ro', 'ru', 'en-US', 'en'],
    });

    // Override platform
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });

    // Override hardwareConcurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });

    // Override deviceMemory
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });

    // Override maxTouchPoints for desktop
    Object.defineProperty(navigator, 'maxTouchPoints', {
      get: () => 0,
    });

    // Remove automation-related chrome properties
    if (window.chrome) {
      window.chrome.runtime = undefined;
    }

    // Override permissions query
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // Prevent canvas fingerprinting detection
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
      if (type === 'image/png' && this.width === 220 && this.height === 30) {
        // This is likely a fingerprinting attempt
        return originalToDataURL.apply(this, arguments);
      }
      return originalToDataURL.apply(this, arguments);
    };
  `;
}

/**
 * Get browser launch arguments for anti-detection
 * @returns Array of Chrome launch arguments
 */
export function getAntiDetectionArgs(): string[] {
  return [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-site-isolation-trials',
    '--disable-features=BlockInsecurePrivateNetworkRequests',
    '--disable-infobars',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--no-first-run',
    '--password-store=basic',
    '--use-mock-keychain',
  ];
}

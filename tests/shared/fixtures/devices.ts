/**
 * Device Configurations
 *
 * Device presets for mobile testing on Smart.md.
 */

import { devices } from '@playwright/test';

/**
 * Device configuration interface
 */
export interface DeviceConfig {
  name: string;
  viewport: { width: number; height: number };
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

/**
 * Predefined device configurations
 */
export const DEVICES: Record<string, DeviceConfig> = {
  // iPhones
  'iPhone 14': {
    ...devices['iPhone 14'],
    name: 'iPhone 14',
  } as DeviceConfig,

  'iPhone 14 Pro': {
    name: 'iPhone 14 Pro',
    viewport: { width: 393, height: 852 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },

  'iPhone 13': {
    ...devices['iPhone 13'],
    name: 'iPhone 13',
  } as DeviceConfig,

  'iPhone 12': {
    ...devices['iPhone 12'],
    name: 'iPhone 12',
  } as DeviceConfig,

  'iPhone SE': {
    ...devices['iPhone SE'],
    name: 'iPhone SE',
  } as DeviceConfig,

  // Android phones
  'Pixel 5': {
    ...devices['Pixel 5'],
    name: 'Pixel 5',
  } as DeviceConfig,

  'Pixel 7': {
    name: 'Pixel 7',
    viewport: { width: 412, height: 915 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  },

  'Samsung Galaxy S21': {
    name: 'Samsung Galaxy S21',
    viewport: { width: 360, height: 800 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },

  'Samsung Galaxy S23': {
    name: 'Samsung Galaxy S23',
    viewport: { width: 360, height: 780 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },

  // Tablets
  'iPad': {
    ...devices['iPad (gen 7)'],
    name: 'iPad',
  } as DeviceConfig,

  'iPad Pro': {
    ...devices['iPad Pro 11'],
    name: 'iPad Pro',
  } as DeviceConfig,

  'Galaxy Tab S7': {
    name: 'Galaxy Tab S7',
    viewport: { width: 800, height: 1280 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 12; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },

  // Desktop
  'Desktop Chrome': {
    name: 'Desktop Chrome',
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },

  'Desktop Firefox': {
    name: 'Desktop Firefox',
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },

  'MacBook': {
    name: 'MacBook',
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  },
};

/**
 * Get device configuration by name
 * @param deviceName - Device name
 * @returns Device configuration
 */
export function getDevice(deviceName: string): DeviceConfig | undefined {
  return DEVICES[deviceName];
}

/**
 * Get all mobile device names
 * @returns Array of mobile device names
 */
export function getMobileDevices(): string[] {
  return Object.entries(DEVICES)
    .filter(([_, config]) => config.isMobile)
    .map(([name]) => name);
}

/**
 * Get all desktop device names
 * @returns Array of desktop device names
 */
export function getDesktopDevices(): string[] {
  return Object.entries(DEVICES)
    .filter(([_, config]) => !config.isMobile)
    .map(([name]) => name);
}

/**
 * Common viewport sizes
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1366, height: 768 },
  largeDesktop: { width: 1920, height: 1080 },
};

/**
 * Breakpoints for responsive testing
 */
export const BREAKPOINTS = {
  xs: 320, // Extra small phones
  sm: 576, // Small phones
  md: 768, // Tablets
  lg: 992, // Small desktops
  xl: 1200, // Large desktops
  xxl: 1400, // Extra large screens
};

export default DEVICES;

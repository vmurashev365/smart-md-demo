/**
 * Custom World for Cucumber
 *
 * Extends Cucumber World with Playwright integration and custom utilities.
 */

import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Page, BrowserContext, Browser } from '@playwright/test';

/**
 * Stored value type
 */
export type StoredValue = string | number | boolean | object | null;

/**
 * Custom World Options
 */
export interface CustomWorldOptions extends IWorldOptions {
  parameters: {
    baseUrl: string;
    headless: boolean;
    slowMo: number;
    humanLikeMode: boolean;
    device?: string;
  };
}

/**
 * Custom World class with Playwright integration
 */
export class CustomWorld extends World {
  /**
   * Playwright Browser instance
   */
  browser!: Browser;

  /**
   * Playwright BrowserContext instance
   */
  context!: BrowserContext;

  /**
   * Playwright Page instance
   */
  page!: Page;

  /**
   * Storage for values between steps
   */
  private storedValues: Map<string, StoredValue> = new Map();

  /**
   * Current device emulation (if any)
   */
  currentDevice: string | null = null;

  /**
   * Default device name provided via worldParameters (optional)
   */
  defaultDevice: string | null = null;

  /**
   * Test start time
   */
  testStartTime: number = Date.now();

  /**
   * Base URL for the application
   */
  baseUrl: string;

  /**
   * Whether to run in headless mode
   */
  headless: boolean;

  /**
   * Slow motion delay
   */
  slowMo: number;

  /**
   * Human-like behavior mode
   */
  humanLikeMode: boolean;

  /**
   * Creates an instance of CustomWorld
   * @param options - World options
   */
  constructor(options: CustomWorldOptions) {
    super(options);

    this.baseUrl = options.parameters.baseUrl || 'https://smart.md';
    this.headless = options.parameters.headless ?? false;
    this.slowMo = options.parameters.slowMo ?? 50;
    this.humanLikeMode = options.parameters.humanLikeMode ?? true;

    this.defaultDevice = options.parameters.device ?? null;
    if (this.defaultDevice) {
      this.setDevice(this.defaultDevice);
    }
  }

  /**
   * Store a value for later use
   * @param key - Storage key
   * @param value - Value to store
   */
  storeValue(key: string, value: StoredValue): void {
    this.storedValues.set(key, value);
    this.log(`Stored "${key}": ${JSON.stringify(value)}`);
  }

  /**
   * Get a stored value
   * @param key - Storage key
   * @returns Stored value or undefined
   */
  getStoredValue<T extends StoredValue>(key: string): T | undefined {
    return this.storedValues.get(key) as T | undefined;
  }

  /**
   * Check if a value is stored
   * @param key - Storage key
   * @returns true if value exists
   */
  hasStoredValue(key: string): boolean {
    return this.storedValues.has(key);
  }

  /**
   * Clear a stored value
   * @param key - Storage key
   */
  clearStoredValue(key: string): void {
    this.storedValues.delete(key);
  }

  /**
   * Clear all stored values
   */
  clearAllStoredValues(): void {
    this.storedValues.clear();
  }

  /**
   * Get all stored values
   * @returns Map of stored values
   */
  getAllStoredValues(): Map<string, StoredValue> {
    return new Map(this.storedValues);
  }

  /**
   * Set current device emulation
   * @param deviceName - Device name
   */
  setDevice(deviceName: string | null): void {
    this.currentDevice = deviceName;
    this.log(`Device set to: ${deviceName || 'Desktop'}`);
  }

  /**
   * Check if running on mobile device
   * @returns true if mobile device
   */
  isMobile(): boolean {
    return this.currentDevice !== null;
  }

  /**
   * Log a message (for debugging)
   * @param message - Log message
   */
  logMessage(message: string): void {
    if (process.env.DEBUG) {
      const elapsed = Date.now() - this.testStartTime;
      console.log(`[${elapsed}ms] ${message}`);
    }
  }

  /**
   * Get elapsed time since test start
   * @returns Elapsed milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.testStartTime;
  }

  /**
   * Reset test timer
   */
  resetTimer(): void {
    this.testStartTime = Date.now();
  }

  /**
   * Attach data to the test report
   * @param data - Data to attach
   * @param mediaType - MIME type
   */
  async attachToReport(data: string | Buffer, mediaType: string): Promise<void> {
    if (typeof data === 'string') {
      this.attach(data, mediaType);
    } else {
      this.attach(data, mediaType);
    }
  }

  /**
   * Take and attach screenshot
   * @param _name - Screenshot name (unused but kept for API compatibility)
   */
  async attachScreenshot(_name: string = 'screenshot'): Promise<void> {
    if (this.page) {
      const screenshot = await this.page.screenshot();
      await this.attachToReport(screenshot, 'image/png');
    }
  }

  /**
   * Attach text to report
   * @param text - Text to attach
   */
  async attachText(text: string): Promise<void> {
    await this.attachToReport(text, 'text/plain');
  }

  /**
   * Attach JSON to report
   * @param data - Data object
   */
  async attachJson(data: object): Promise<void> {
    await this.attachToReport(JSON.stringify(data, null, 2), 'application/json');
  }
}

// Set custom world constructor
setWorldConstructor(CustomWorld);

export default CustomWorld;

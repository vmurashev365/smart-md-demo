/**
 * Human-Like Interaction Utilities
 *
 * For bypassing Cloudflare, Turnstile, and bot detection systems.
 * These utilities simulate realistic human behavior patterns.
 *
 * Key features:
 * - Random delays between actions
 * - Human-like typing with variable speed
 * - Natural mouse movements and hover effects
 * - Realistic scrolling behavior
 * - Idle movements simulating a "live" user
 */

import { Page, Locator } from '@playwright/test';

/**
 * Generate a random delay within a range
 * @param min - Minimum delay in milliseconds
 * @param max - Maximum delay in milliseconds
 * @returns Promise that resolves after random delay
 */
export async function randomDelay(min: number = 100, max: number = 500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Generate a random number within a range
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Type text like a human with variable delays between keystrokes
 * Uses pressSequentially for more realistic typing simulation
 *
 * @param locator - Playwright Locator for the input element
 * @param text - Text to type
 * @param options - Typing options
 */
export async function humanType(
  locator: Locator,
  text: string,
  options?: {
    minDelay?: number;
    maxDelay?: number;
    clearFirst?: boolean;
    pressEnter?: boolean;
  }
): Promise<void> {
  const { minDelay = 50, maxDelay = 150, clearFirst = true, pressEnter = false } = options || {};

  // Click to focus the input
  await locator.click();
  await randomDelay(100, 300);

  // Clear existing text if needed
  if (clearFirst) {
    await locator.clear();
    await randomDelay(50, 150);
  }

  // Type each character with random delay
  for (const char of text) {
    await locator.pressSequentially(char, { delay: 0 });
    await randomDelay(minDelay, maxDelay);

    // Occasional longer pause (simulating thinking)
    if (Math.random() < 0.1) {
      await randomDelay(200, 500);
    }
  }

  // Press Enter if needed
  if (pressEnter) {
    await randomDelay(100, 300);
    await locator.press('Enter');
  }
}

/**
 * Click element like a human - hover first, then click
 * Includes scrolling into view and natural delays
 *
 * @param locator - Playwright Locator for the element to click
 * @param options - Click options
 */
export async function humanClick(
  locator: Locator,
  options?: {
    scrollFirst?: boolean;
    hoverFirst?: boolean;
    doubleClick?: boolean;
  }
): Promise<void> {
  const { scrollFirst = true, hoverFirst = true, doubleClick = false } = options || {};

  // Scroll element into view
  if (scrollFirst) {
    await locator.scrollIntoViewIfNeeded();
    await randomDelay(200, 400);
  }

  // Hover over element first (like a human would)
  if (hoverFirst) {
    await locator.hover();
    await randomDelay(100, 300);
  }

  // Perform the click
  if (doubleClick) {
    await locator.dblclick();
  } else {
    await locator.click();
  }

  // Small delay after click
  await randomDelay(150, 350);
}

/**
 * Move mouse to element in a natural way
 *
 * @param page - Playwright Page
 * @param locator - Target element locator
 */
export async function humanMouseMove(page: Page, locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) return;

  // Calculate a random point inside the element (not center)
  const offsetX = randomNumber(Math.floor(box.width * 0.2), Math.floor(box.width * 0.8));
  const offsetY = randomNumber(Math.floor(box.height * 0.2), Math.floor(box.height * 0.8));

  const x = box.x + offsetX;
  const y = box.y + offsetY;

  // Move mouse with steps (smooth movement)
  const steps = randomNumber(5, 15);
  await page.mouse.move(x, y, { steps });
  await randomDelay(50, 150);
}

/**
 * Scroll like a human - not instant, variable amounts
 *
 * @param page - Playwright Page
 * @param direction - Scroll direction
 * @param options - Scroll options
 */
export async function humanScroll(
  page: Page,
  direction: 'down' | 'up' = 'down',
  options?: {
    amount?: number;
    smooth?: boolean;
  }
): Promise<void> {
  const { amount, smooth = true } = options || {};

  // Random scroll amount if not specified
  const scrollAmount = amount || randomNumber(200, 500);
  const delta = direction === 'down' ? scrollAmount : -scrollAmount;

  if (smooth) {
    // Smooth scroll with multiple small steps
    const steps = randomNumber(3, 8);
    const stepSize = Math.floor(delta / steps);

    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, stepSize);
      await randomDelay(50, 150);
    }
  } else {
    await page.mouse.wheel(0, delta);
  }

  await randomDelay(300, 700);
}

/**
 * Scroll to bottom of page like a human
 *
 * @param page - Playwright Page
 */
export async function humanScrollToBottom(page: Page): Promise<void> {
  // Document access is inside page.evaluate, which runs in browser context
  const pageHeight = await page.evaluate(() => {
    // eslint-disable-next-line no-undef
    return document.body.scrollHeight;
  });
  const viewportHeight = page.viewportSize()?.height || 768;
  const scrollSteps = Math.ceil(pageHeight / viewportHeight);

  for (let i = 0; i < scrollSteps; i++) {
    await humanScroll(page, 'down', { amount: randomNumber(300, 500) });
    await randomDelay(500, 1000);
  }
}

/**
 * Random micro-movements simulating an "alive" user
 * Useful for avoiding bot detection during idle periods
 *
 * @param page - Playwright Page
 */
export async function humanIdleMovement(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) return;

  // Move to a random point on the page
  const x = randomNumber(50, viewport.width - 50);
  const y = randomNumber(50, viewport.height - 50);

  await page.mouse.move(x, y, { steps: randomNumber(3, 8) });
}

/**
 * Wait while simulating human "reading" behavior
 * Includes random mouse movements to appear active
 *
 * @param page - Playwright Page
 * @param timeout - Maximum wait time in milliseconds
 */
export async function humanWaitForContent(page: Page, timeout: number = 2000): Promise<void> {
  const readTime = randomNumber(1000, timeout);
  const movements = Math.floor(readTime / 500);

  for (let i = 0; i < movements; i++) {
    await humanIdleMovement(page);
    await randomDelay(400, 600);
  }
}

/**
 * Select option from dropdown like a human
 *
 * @param locator - Dropdown locator
 * @param value - Option value to select
 */
export async function humanSelectOption(locator: Locator, value: string): Promise<void> {
  await humanClick(locator);
  await randomDelay(200, 400);
  await locator.selectOption(value);
  await randomDelay(100, 300);
}

/**
 * Fill form field with human-like behavior
 *
 * @param page - Playwright Page
 * @param locator - Input locator
 * @param value - Value to fill
 */
export async function humanFillField(page: Page, locator: Locator, value: string): Promise<void> {
  await humanMouseMove(page, locator);
  await humanClick(locator);
  await humanType(locator, value);
}

/**
 * Simulate reading a page before taking action
 *
 * @param page - Playwright Page
 * @param minSeconds - Minimum read time in seconds
 * @param maxSeconds - Maximum read time in seconds
 */
export async function humanReadPage(
  page: Page,
  minSeconds: number = 1,
  maxSeconds: number = 3
): Promise<void> {
  const readTime = randomNumber(minSeconds * 1000, maxSeconds * 1000);
  const scrollCount = randomNumber(1, 3);

  // Initial pause (like eyes landing on page)
  await randomDelay(500, 1000);

  // Scroll and read
  for (let i = 0; i < scrollCount; i++) {
    await humanScroll(page, 'down');
    await humanWaitForContent(page, readTime / scrollCount);
  }
}

/**
 * Check if human-like mode is enabled
 * @returns Boolean indicating if human-like mode is enabled
 */
export function isHumanLikeModeEnabled(): boolean {
  return process.env.HUMAN_LIKE_MODE !== 'false';
}

/**
 * Conditional human delay - only delays if human-like mode is enabled
 *
 * @param min - Minimum delay
 * @param max - Maximum delay
 */
export async function conditionalDelay(min: number = 100, max: number = 500): Promise<void> {
  if (isHumanLikeModeEnabled()) {
    await randomDelay(min, max);
  }
}

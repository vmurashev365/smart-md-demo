/**
 * Wait Utilities for Smart.md Testing
 *
 * Custom wait functions for handling dynamic content,
 * AJAX requests, and page transitions.
 */

import { Page, Locator, expect } from '@playwright/test';
import { SELECTORS } from '../config/selectors';
import { joinSelectors } from './locator-helper';

/**
 * Default timeout values
 */
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  navigation: 30000,
  animation: 500,
  debounce: 300,
};

/**
 * Wait for page to be fully loaded
 * @param page - Playwright Page
 * @param timeout - Maximum wait time
 */
export async function waitForPageLoad(page: Page, timeout: number = TIMEOUTS.navigation): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout });
  // networkidle removed for speed - domcontentloaded is sufficient
}

/**
 * Wait for all network requests to complete
 * @param page - Playwright Page
 * @param timeout - Maximum wait time
 */
export async function waitForNetworkIdle(page: Page, timeout: number = TIMEOUTS.medium): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for loaders/spinners to disappear
 * @param page - Playwright Page
 * @param timeout - Maximum wait time
 */
export async function waitForLoadersToDisappear(
  page: Page,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  const loaderSelector = joinSelectors(SELECTORS.common.loader);
  const loader = page.locator(loaderSelector);

  try {
    // Reduced timeout for loader appearance (was 1000ms, now 200ms)
    await loader.waitFor({ state: 'visible', timeout: 200 });
    // Then wait for it to disappear
    await loader.waitFor({ state: 'hidden', timeout });
  } catch {
    // Loader didn't appear, which is fine
  }
}

/**
 * Wait for skeleton loaders to be replaced with content
 * @param page - Playwright Page
 * @param timeout - Maximum wait time
 */
export async function waitForSkeletonsToDisappear(
  page: Page,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  const skeletonSelector = joinSelectors(SELECTORS.common.skeleton);
  const skeleton = page.locator(skeletonSelector);

  try {
    await skeleton.waitFor({ state: 'hidden', timeout });
  } catch {
    // Skeletons didn't appear or already gone
  }
}

/**
 * Wait for AJAX content to update after an action
 * Combines multiple wait strategies
 *
 * @param page - Playwright Page
 * @param timeout - Maximum wait time
 */
export async function waitForContentUpdate(
  page: Page,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  // networkidle removed for speed - just wait for loaders to disappear
  
  // Wait for loaders
  await waitForLoadersToDisappear(page, timeout);

  // Wait for skeletons
  await waitForSkeletonsToDisappear(page, timeout);

  // Animation buffer removed for speed
}

/**
 * Wait for element to be visible and stable
 * @param locator - Element locator
 * @param timeout - Maximum wait time
 */
export async function waitForElementStable(
  locator: Locator,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });

  // Wait for element to stop moving (useful for animations)
  let previousBox = await locator.boundingBox();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    await locator.page().waitForTimeout(50);
    const currentBox = await locator.boundingBox();

    if (
      previousBox &&
      currentBox &&
      previousBox.x === currentBox.x &&
      previousBox.y === currentBox.y &&
      previousBox.width === currentBox.width &&
      previousBox.height === currentBox.height
    ) {
      break;
    }

    previousBox = currentBox;
    attempts++;
  }
}

/**
 * Wait for element text to change
 * @param locator - Element locator
 * @param previousText - Text to wait to change from
 * @param timeout - Maximum wait time
 */
export async function waitForTextChange(
  locator: Locator,
  previousText: string,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  await expect(locator).not.toHaveText(previousText, { timeout });
}

/**
 * Wait for URL to change
 * @param page - Playwright Page
 * @param previousUrl - URL to wait to change from
 * @param timeout - Maximum wait time
 */
export async function waitForUrlChange(
  page: Page,
  previousUrl: string,
  timeout: number = TIMEOUTS.navigation
): Promise<void> {
  await page.waitForURL(url => url.href !== previousUrl, { timeout });
}

/**
 * Wait for URL to contain a specific string
 * @param page - Playwright Page
 * @param urlPart - String that URL should contain
 * @param timeout - Maximum wait time
 */
export async function waitForUrlContains(
  page: Page,
  urlPart: string,
  timeout: number = TIMEOUTS.navigation
): Promise<void> {
  await page.waitForURL(url => url.href.includes(urlPart), { timeout });
}

/**
 * Wait for element count to reach expected value
 * @param locator - Element locator
 * @param expectedCount - Expected number of elements
 * @param timeout - Maximum wait time
 */
export async function waitForElementCount(
  locator: Locator,
  expectedCount: number,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  await expect(locator).toHaveCount(expectedCount, { timeout });
}

/**
 * Wait for minimum element count
 * @param locator - Element locator
 * @param minCount - Minimum number of elements
 * @param timeout - Maximum wait time
 */
export async function waitForMinimumElements(
  locator: Locator,
  minCount: number,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const count = await locator.count();
    if (count >= minCount) {
      return;
    }
    await locator.page().waitForTimeout(50);
  }

  throw new Error(`Expected at least ${minCount} elements, but found ${await locator.count()}`);
}

/**
 * Wait for product list to update (after filtering/sorting)
 * @param page - Playwright Page
 * @param timeout - Maximum wait time
 */
export async function waitForProductListUpdate(
  page: Page,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  // Wait for any AJAX requests
  await waitForNetworkIdle(page, timeout);

  // Wait for product cards to be visible
  const productCards = page.locator(joinSelectors(SELECTORS.catalog.productCard));
  await waitForMinimumElements(productCards, 1, timeout);

  // Wait for loaders
  await waitForLoadersToDisappear(page, timeout);

  // Wait for cards to have actual content (not just skeleton loaders)
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const firstCard = productCards.first();
    const text = await firstCard.textContent().catch(() => '');
    // If card has substantial text (more than 10 chars), consider it loaded
    if (text && text.trim().length > 10) {
      // Reduced delay (was 1000ms, now 50ms)
      await page.waitForTimeout(50);
      return;
    }
    await page.waitForTimeout(100);
  }
}

/**
 * Wait for modal to appear
 * @param page - Playwright Page
 * @param modalSelector - Selector for the modal
 * @param timeout - Maximum wait time
 */
export async function waitForModal(
  page: Page,
  modalSelector: string = joinSelectors(SELECTORS.common.modal),
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  const modal = page.locator(modalSelector);
  await modal.waitFor({ state: 'visible', timeout });

  // Animation timeout removed for speed
}

/**
 * Wait for modal to close
 * @param page - Playwright Page
 * @param modalSelector - Selector for the modal
 * @param timeout - Maximum wait time
 */
export async function waitForModalClose(
  page: Page,
  modalSelector: string = joinSelectors(SELECTORS.common.modal),
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  const modal = page.locator(modalSelector);
  await modal.waitFor({ state: 'hidden', timeout });
}

/**
 * Retry an action until it succeeds or times out
 * @param action - Async function to retry
 * @param timeout - Maximum total time to retry
 * @param interval - Time between retries
 */
export async function retryUntilSuccess<T>(
  action: () => Promise<T>,
  timeout: number = TIMEOUTS.medium,
  interval: number = 100
): Promise<T> {
  const startTime = Date.now();
  let lastError: Error | null = null;

  while (Date.now() - startTime < timeout) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  throw lastError || new Error('Action timed out');
}

/**
 * Wait for search results to load
 * @param page - Playwright Page
 * @param timeout - Maximum wait time
 */
export async function waitForSearchResults(
  page: Page,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  await waitForNetworkIdle(page, timeout);

  const productCards = page.locator(joinSelectors(SELECTORS.searchResults.productCard));
  const noResults = page.locator(joinSelectors(SELECTORS.searchResults.noResults));

  // Wait for either results or "no results" message
  await Promise.race([
    waitForMinimumElements(productCards, 1, timeout),
    noResults.waitFor({ state: 'visible', timeout }),
  ]);

  await waitForLoadersToDisappear(page, timeout);
}

/**
 * Wait for cart update
 * @param page - Playwright Page
 * @param timeout - Maximum wait time
 */
export async function waitForCartUpdate(
  page: Page,
  timeout: number = TIMEOUTS.medium
): Promise<void> {
  await waitForNetworkIdle(page, timeout);
  await waitForLoadersToDisappear(page, timeout);

  // Animation timeout removed for speed
}

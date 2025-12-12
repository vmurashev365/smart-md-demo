import type { Locator, Page } from '@playwright/test';

/**
 * Options for firstWorkingLocator function
 */
export type FirstWorkingLocatorOptions = {
  /** Label for logging/error messages (e.g., 'header.cartIcon') */
  contextLabel?: string;
  /** If true (default), requires the element to be visible. If false, just checks existence. */
  requireVisible?: boolean;
  /** Timeout in ms for each selector attempt (default: 800ms) */
  perSelectorTimeout?: number;
};

/**
 * Result of a single selector attempt
 */
interface SelectorAttemptResult {
  selector: string;
  success: boolean;
  error?: string;
  elementCount?: number;
  visible?: boolean;
}

/**
 * Resolves the first working selector from an array of fallback selectors.
 *
 * This function iterates through the provided selectors array in order,
 * attempting each one with a short timeout. It returns the first locator
 * that successfully matches a visible (or existing, if requireVisible=false) element.
 *
 * Key features:
 * - Explicit logging of which selector "won"
 * - Detailed error report if all selectors fail
 * - Short per-selector timeout to avoid long waits on production
 *
 * @param page - Playwright Page object
 * @param selectors - Array of CSS/XPath selectors to try in order (fallback chain)
 * @param options - Configuration options
 * @returns The first working Locator
 * @throws Error with detailed report if no selector matches
 *
 * @example
 * ```ts
 * const cartIcon = await firstWorkingLocator(page, SELECTORS.header.cartIcon, {
 *   contextLabel: 'header.cartIcon',
 * });
 * await cartIcon.click();
 * ```
 */
export async function firstWorkingLocator(
  page: Page,
  selectors: string[],
  options: FirstWorkingLocatorOptions = {}
): Promise<Locator> {
  const {
    contextLabel = 'unknown',
    requireVisible = true,
    perSelectorTimeout = 800,
  } = options;

  if (!selectors || selectors.length === 0) {
    throw new Error(
      `[locator-helper] ❌ No selectors provided for ${contextLabel}`
    );
  }

  const attempts: SelectorAttemptResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    const attemptResult: SelectorAttemptResult = {
      selector,
      success: false,
    };

    try {
      const locator = page.locator(selector).first();

      // Wait for element to exist with short timeout
      await locator.waitFor({
        state: requireVisible ? 'visible' : 'attached',
        timeout: perSelectorTimeout,
      });

      // Get element count for logging
      const count = await page.locator(selector).count();
      attemptResult.elementCount = count;

      if (requireVisible) {
        const isVisible = await locator.isVisible();
        attemptResult.visible = isVisible;

        if (!isVisible) {
          attemptResult.error = 'Element found but not visible';
          attempts.push(attemptResult);
          continue;
        }
      }

      // SUCCESS! Log and return
      attemptResult.success = true;
      attempts.push(attemptResult);

      const elapsed = Date.now() - startTime;
      // eslint-disable-next-line no-console
      console.log(
        `✅ [Matched] Selector: '${selector}' for ${contextLabel} ` +
        `(attempt ${i + 1}/${selectors.length}, ${elapsed}ms, ${count} element(s))`
      );

      return locator;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Extract just the key part of the error for cleaner logs
      const shortError = errorMessage.includes('Timeout')
        ? 'Timeout - element not found'
        : errorMessage.split('\n')[0].substring(0, 100);

      attemptResult.error = shortError;
      attempts.push(attemptResult);

      // Log each failed attempt in debug mode
      if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
          `  ⏭️  [Skip] Selector ${i + 1}/${selectors.length}: '${selector}' - ${shortError}`
        );
      }
    }
  }

  // ALL SELECTORS FAILED - throw detailed error
  const elapsed = Date.now() - startTime;
  const report = buildFailureReport(contextLabel, attempts, elapsed);
  throw new Error(report);
}

/**
 * Builds a detailed failure report when all selectors fail
 */
function buildFailureReport(
  contextLabel: string,
  attempts: SelectorAttemptResult[],
  elapsedMs: number
): string {
  const lines: string[] = [
    ``,
    `╔══════════════════════════════════════════════════════════════════╗`,
    `║  ❌ LOCATOR RESOLUTION FAILED                                    ║`,
    `╚══════════════════════════════════════════════════════════════════╝`,
    ``,
    `  Context: ${contextLabel}`,
    `  Total time: ${elapsedMs}ms`,
    `  Selectors tried: ${attempts.length}`,
    ``,
    `  ┌─────────────────────────────────────────────────────────────────`,
    `  │ ATTEMPTED SELECTORS (in order):`,
    `  └─────────────────────────────────────────────────────────────────`,
  ];

  attempts.forEach((attempt, index) => {
    const status = attempt.success ? '✅' : '❌';
    const details: string[] = [];

    if (attempt.elementCount !== undefined) {
      details.push(`found: ${attempt.elementCount}`);
    }
    if (attempt.visible !== undefined) {
      details.push(`visible: ${attempt.visible}`);
    }
    if (attempt.error) {
      details.push(`error: ${attempt.error}`);
    }

    lines.push(`    ${index + 1}. ${status} ${attempt.selector}`);
    if (details.length > 0) {
      lines.push(`       └── ${details.join(', ')}`);
    }
  });

  lines.push(``);
  lines.push(`  💡 Suggestions:`);
  lines.push(`     - Check if the page has fully loaded`);
  lines.push(`     - Verify the element exists in the current viewport`);
  lines.push(`     - Consider adding new fallback selectors to SELECTORS.${contextLabel}`);
  lines.push(`     - Check for dynamic content or iframes`);
  lines.push(``);

  return lines.join('\n');
}

/**
 * Utility: Check if any selector from the array matches (without throwing)
 *
 * @param page - Playwright Page object
 * @param selectors - Array of selectors to check
 * @param options - Configuration options
 * @returns Object with matched selector or null
 */
export async function findMatchingSelector(
  page: Page,
  selectors: string[],
  options: Omit<FirstWorkingLocatorOptions, 'contextLabel'> = {}
): Promise<{ selector: string; locator: Locator } | null> {
  const { requireVisible = true, perSelectorTimeout = 500 } = options;

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({
        state: requireVisible ? 'visible' : 'attached',
        timeout: perSelectorTimeout,
      });

      if (requireVisible) {
        const isVisible = await locator.isVisible();
        if (!isVisible) continue;
      }

      return { selector, locator };
    } catch {
      // Continue to next selector
    }
  }

  return null;
}

/**
 * Legacy support: Convert joined string to array and call firstWorkingLocator
 *
 * @deprecated Use firstWorkingLocator with string[] directly
 */
export async function firstWorkingLocatorFromString(
  page: Page,
  selectorString: string,
  options: FirstWorkingLocatorOptions = {}
): Promise<Locator> {
  // Simple split - for truly complex selectors, migrate to array format
  const selectors = selectorString
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // eslint-disable-next-line no-console
  console.warn(
    `[locator-helper] ⚠️ Using deprecated string format for ${options.contextLabel || 'unknown'}. ` +
    `Please migrate to string[] format.`
  );

  return firstWorkingLocator(page, selectors, options);
}

// ==================== Simple Selector Utilities ====================

/**
 * Joins a selector array into a comma-separated string for use with page.locator().
 * Use this for simple cases where you don't need the full fallback logic with logging.
 *
 * @param selectors - Array of selectors
 * @returns Joined selector string
 *
 * @example
 * ```ts
 * // Simple usage in page objects
 * get cartIcon(): Locator {
 *   return this.page.locator(joinSelectors(SELECTORS.header.cartIcon));
 * }
 * ```
 */
export function joinSelectors(selectors: string[]): string {
  return selectors.join(', ');
}

/**
 * Creates a simple locator from a selector array by joining them.
 * For critical elements that need fallback logging, use firstWorkingLocator instead.
 *
 * @param page - Playwright Page object
 * @param selectors - Array of selectors
 * @returns Locator that matches any of the selectors
 *
 * @example
 * ```ts
 * const header = simpleLocator(page, SELECTORS.header.container);
 * await expect(header).toBeVisible();
 * ```
 */
export function simpleLocator(page: Page, selectors: string[]): Locator {
  return page.locator(selectors.join(', '));
}

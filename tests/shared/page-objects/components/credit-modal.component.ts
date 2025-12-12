/**
 * Credit Modal Component
 *
 * Component object for Smart.md credit calculator modal.
 * Handles credit provider selection, term selection, and payment calculation.
 *
 * @updated December 2025 - Added demo overlay handling
 */

import { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../../config/selectors';
import { humanClick, humanSelectOption, randomDelay } from '../../utils/human-like';
import { parsePrice, validateMonthlyPayment } from '../../utils/price-utils';
import { waitForContentUpdate } from '../../utils/wait-utils';
import { joinSelectors } from '../../utils/locator-helper';

/**
 * Credit provider data interface
 */
export interface CreditProvider {
  name: string;
  index: number;
}

/**
 * Credit Modal Component class
 */
export class CreditModalComponent {
  constructor(private page: Page) {}

  // ==================== Locators ====================

  /**
   * Modal container
   */
  get modal(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.modal));
  }

  /**
   * Modal content
   */
  get modalContent(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.modalContent));
  }

  /**
   * Monthly payment display
   */
  get monthlyPayment(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.monthlyPayment));
  }

  /**
   * Total amount display
   */
  get totalAmount(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.totalAmount));
  }

  /**
   * Credit provider options
   */
  get providers(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.providers));
  }

  /**
   * Payment term selector
   */
  get termSelector(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.termSelector));
  }

  /**
   * Interest rate display
   */
  get interestRate(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.interestRate));
  }

  /**
   * Apply for credit button
   */
  get applyButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.applyButton));
  }

  /**
   * Close modal button
   */
  get closeButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.closeButton));
  }

  /**
   * Modal overlay
   */
  get overlay(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.creditModal.overlay));
  }

  /**
   * Demo/promotional overlay that may appear on credit modals
   */
  get demoOverlay(): Locator {
    return this.page.locator(
      '[data-testid="demo-overlay"], ' +
        '.demo-overlay, ' +
        '.promo-overlay, ' +
        '[class*="demo"], ' +
        '[class*="promotional"]'
    );
  }

  /**
   * Demo overlay close button
   */
  get demoOverlayClose(): Locator {
    return this.page.locator(
      '[data-testid="demo-close"], ' +
        '.demo-overlay .close, ' +
        '.demo-overlay button, ' +
        '[class*="demo"] .close-btn, ' +
        '[class*="demo"] [class*="close"]'
    );
  }

  // ==================== Actions ====================

  /**
   * Dismiss demo overlay if present
   * Some credit providers show demo/promo overlays that need dismissing
   *
   * @returns true if overlay was dismissed
   */
  async dismissDemoOverlay(): Promise<boolean> {
    try {
      // Wait briefly for overlay to appear (if it will)
      await this.demoOverlay.waitFor({ state: 'visible', timeout: 2000 });

      // Try to close via close button
      if (await this.demoOverlayClose.isVisible({ timeout: 1000 })) {
        await this.demoOverlayClose.click();
        await randomDelay(300, 500);
        return true;
      }

      // Try clicking the overlay itself (some dismiss on click)
      await this.demoOverlay.click({ force: true });
      await randomDelay(300, 500);
      return true;
    } catch {
      // No overlay appeared or couldn't dismiss - that's fine
      return false;
    }
  }

  /**
   * Check if modal is visible
   * @returns true if visible
   */
  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  /**
   * Wait for modal to be visible (with demo overlay handling)
   */
  async waitForVisible(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
    await randomDelay(300, 500);

    // Attempt to dismiss any demo overlay
    await this.dismissDemoOverlay();
  }

  /**
   * Get monthly payment amount
   * @returns Monthly payment in MDL
   */
  async getMonthlyPayment(): Promise<number> {
    const text = (await this.monthlyPayment.textContent()) || '0';
    return parsePrice(text);
  }

  /**
   * Get total credit amount
   * @returns Total amount in MDL
   */
  async getTotalAmount(): Promise<number> {
    if (!(await this.totalAmount.isVisible())) {
      return 0;
    }
    const text = (await this.totalAmount.textContent()) || '0';
    return parsePrice(text);
  }

  /**
   * Get number of credit providers
   * @returns Provider count
   */
  async getProviderCount(): Promise<number> {
    return await this.providers.count();
  }

  /**
   * Get all credit provider names
   * @returns Array of provider names
   */
  async getCreditProviders(): Promise<string[]> {
    const count = await this.getProviderCount();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const provider = this.providers.nth(i);
      const nameEl = provider.locator(joinSelectors(SELECTORS.creditModal.providerName));

      let name: string;
      if (await nameEl.isVisible()) {
        name = (await nameEl.textContent()) || '';
      } else {
        name = (await provider.textContent()) || '';
      }

      if (name) {
        names.push(name.trim());
      }
    }

    return names;
  }

  /**
   * Check if specific provider is available
   * @param providerName - Provider name to check
   * @returns true if provider exists
   */
  async hasProvider(providerName: string): Promise<boolean> {
    const providers = await this.getCreditProviders();
    return providers.some(
      p => p.toLowerCase().includes(providerName.toLowerCase())
    );
  }

  /**
   * Check if any of specified providers is available
   * @param providerNames - Array of provider names
   * @returns true if any provider exists
   */
  async hasAnyProvider(providerNames: string[]): Promise<boolean> {
    for (const name of providerNames) {
      if (await this.hasProvider(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Select credit provider
   * @param providerName - Provider name
   */
  async selectProvider(providerName: string): Promise<void> {
    const provider = this.providers.filter({ hasText: providerName });

    if (await provider.isVisible()) {
      await humanClick(provider);
      await waitForContentUpdate(this.page);
    }
  }

  /**
   * Select payment term
   * @param term - Term like "12 luni" or "12"
   */
  async selectPaymentTerm(term: string): Promise<void> {
    const termSelector = this.termSelector;

    // Check if it's a select element or custom selector
    const tagName = await termSelector.evaluate(el => el.tagName.toLowerCase());

    if (tagName === 'select') {
      await humanSelectOption(termSelector, term);
    } else {
      // Custom term selector - find and click option
      const termOption = this.page.locator(`${SELECTORS.creditModal.termOption}:has-text("${term}")`);

      if (!(await termOption.isVisible())) {
        // Try clicking the selector to open dropdown
        await humanClick(termSelector);
        await randomDelay(200, 400);
      }

      await humanClick(termOption);
    }

    await waitForContentUpdate(this.page);
  }

  /**
   * Get available payment terms
   * @returns Array of term strings
   */
  async getAvailableTerms(): Promise<string[]> {
    const terms: string[] = [];
    const termSelector = this.termSelector;

    const tagName = await termSelector.evaluate(el => el.tagName.toLowerCase());

    if (tagName === 'select') {
      // Get options from select
      const options = termSelector.locator('option');
      const count = await options.count();

      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        if (text) {
          terms.push(text.trim());
        }
      }
    } else {
      // Get from custom selector
      const options = this.page.locator(joinSelectors(SELECTORS.creditModal.termOption));
      const count = await options.count();

      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        if (text) {
          terms.push(text.trim());
        }
      }
    }

    return terms;
  }

  /**
   * Validate monthly payment is approximately correct
   * @param productPrice - Original product price
   * @param months - Selected term in months
   * @returns true if payment is valid
   */
  async validatePayment(productPrice: number, months: number): Promise<boolean> {
    const monthlyPayment = await this.getMonthlyPayment();
    return validateMonthlyPayment(monthlyPayment, productPrice, months, 20);
  }

  /**
   * Close the modal
   */
  async close(): Promise<void> {
    // Try close button first
    if (await this.closeButton.isVisible()) {
      await humanClick(this.closeButton);
    } else {
      // Click overlay to close
      await this.overlay.click({ position: { x: 10, y: 10 } });
    }

    // Wait for modal to disappear
    await this.modal.waitFor({ state: 'hidden' });
    await randomDelay(200, 400);
  }

  /**
   * Apply for credit
   */
  async apply(): Promise<void> {
    await humanClick(this.applyButton);
  }
}

export default CreditModalComponent;

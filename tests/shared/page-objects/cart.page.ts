/**
 * Cart Page Object
 *
 * Page object for Smart.md shopping cart page.
 * Handles cart items, quantities, and totals.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { SELECTORS } from '../config/selectors';
import { URLS } from '../config/urls';
import { humanClick, randomDelay } from '../utils/human-like';
import { firstWorkingLocator, joinSelectors } from '../utils/locator-helper';
import { parsePrice, calculateTotal, pricesEqual } from '../utils/price-utils';
import { waitForCartUpdate, waitForContentUpdate } from '../utils/wait-utils';

/**
 * Cart item data interface
 */
export interface CartItemData {
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  index: number;
}

/**
 * Cart Page class
 */
export class CartPage extends BasePage {
  // ==================== Locators ====================

  /**
   * Cart container
   */
  get cartContainer(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.cart.container));
  }

  /**
   * All cart items
   */
  get cartItems(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.cart.item));
  }

  /**
   * Cart total price
   */
  get totalPrice(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.cart.total));
  }

  /**
   * Empty cart message
   */
  get emptyCartMessage(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.cart.emptyState));
  }

  /**
   * Checkout button
   */
  get checkoutButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.cart.checkoutBtn));
  }

  /**
   * Continue shopping link
   */
  get continueShoppingLink(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.cart.continueShopping));
  }

  /**
   * Promo code input
   */
  get promoCodeInput(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.cart.promoCode));
  }

  /**
   * Apply promo button
   */
  get applyPromoButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.cart.applyPromo));
  }

  // ==================== Actions ====================

  /**
   * Open cart page directly
   */
  async open(): Promise<void> {
    await this.goto(URLS.cart.page);
  }

  /**
   * Get number of items in cart
   * @returns Item count
   */
  async getItemCount(): Promise<number> {
    if (await this.isEmpty()) {
      return 0;
    }
    return await this.cartItems.count();
  }

  /**
   * Check if cart is empty
   * @returns true if empty
   */
  async isEmpty(): Promise<boolean> {
    const emptyState = await firstWorkingLocator(this.page, SELECTORS.cart.emptyState, {
      contextLabel: 'cart.emptyState',
    });
    return await emptyState.isVisible();
  }

  /**
   * Get cart item by index
   * @param index - Zero-based index
   * @returns Cart item locator
   */
  getCartItem(index: number): Locator {
    return this.cartItems.nth(index);
  }

  /**
   * Get first cart item
   * @returns First item locator
   */
  get firstItem(): Locator {
    return this.getCartItem(0);
  }

  /**
   * Get item title by index
   * @param index - Zero-based index
   * @returns Item title
   */
  async getItemTitle(index: number): Promise<string> {
    const item = this.getCartItem(index);
    const titleEl = item.locator(joinSelectors(SELECTORS.cart.itemTitle));
    return (await titleEl.textContent()) || '';
  }

  /**
   * Get item price by index
   * @param index - Zero-based index
   * @returns Item price
   */
  async getItemPrice(index: number): Promise<number> {
    const item = this.getCartItem(index);
    const priceEl = item.locator(joinSelectors(SELECTORS.cart.itemPrice));
    const priceText = (await priceEl.textContent()) || '0';
    return parsePrice(priceText);
  }

  /**
   * Get item quantity by index
   * @param index - Zero-based index
   * @returns Item quantity
   */
  async getItemQuantity(index: number): Promise<number> {
    const item = this.getCartItem(index);
    const qtyEl = item.locator(joinSelectors(SELECTORS.cart.quantity));
    const value = await qtyEl.inputValue();
    return parseInt(value, 10) || 1;
  }

  /**
   * Increase item quantity
   * @param index - Item index
   */
  async increaseQuantity(index: number): Promise<void> {
    const item = this.getCartItem(index);
    const plusBtn = item.locator(joinSelectors(SELECTORS.cart.increaseBtn));
    await humanClick(plusBtn);
    await waitForCartUpdate(this.page);
  }

  /**
   * Decrease item quantity
   * @param index - Item index
   */
  async decreaseQuantity(index: number): Promise<void> {
    const item = this.getCartItem(index);
    const minusBtn = item.locator(joinSelectors(SELECTORS.cart.decreaseBtn));
    await humanClick(minusBtn);
    await waitForCartUpdate(this.page);
  }

  /**
   * Set item quantity to specific value
   * @param index - Item index
   * @param quantity - Target quantity
   */
  async setQuantity(index: number, quantity: number): Promise<void> {
    const currentQty = await this.getItemQuantity(index);

    if (quantity > currentQty) {
      for (let i = currentQty; i < quantity; i++) {
        await this.increaseQuantity(index);
        await randomDelay(300, 500);
      }
    } else if (quantity < currentQty && quantity > 0) {
      for (let i = currentQty; i > quantity; i--) {
        await this.decreaseQuantity(index);
        await randomDelay(300, 500);
      }
    }
  }

  /**
   * Remove item from cart
   * @param index - Item index
   */
  async removeItem(index: number): Promise<void> {
    const item = this.getCartItem(index);
    const removeBtn = item.locator(joinSelectors(SELECTORS.cart.removeBtn));
    await humanClick(removeBtn);
    await waitForCartUpdate(this.page);
    await randomDelay(300, 500);
  }

  /**
   * Get cart total price
   * @returns Total price
   */
  async getTotal(): Promise<number> {
    const totalText = (await this.totalPrice.textContent()) || '0';
    return parsePrice(totalText);
  }

  /**
   * Get all cart items data
   * @returns Array of cart item data
   */
  async getAllItemsData(): Promise<CartItemData[]> {
    const count = await this.getItemCount();
    const items: CartItemData[] = [];

    for (let i = 0; i < count; i++) {
      const title = await this.getItemTitle(i);
      const price = await this.getItemPrice(i);
      const quantity = await this.getItemQuantity(i);
      const subtotal = calculateTotal(price, quantity);

      items.push({ title, price, quantity, subtotal, index: i });
    }

    return items;
  }

  /**
   * Verify cart total matches sum of items
   * @returns true if totals match
   */
  async verifyTotalMatchesItems(): Promise<boolean> {
    const items = await this.getAllItemsData();
    const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const displayedTotal = await this.getTotal();

    return pricesEqual(calculatedTotal, displayedTotal, 1);
  }

  /**
   * Apply promo code
   * @param code - Promo code
   */
  async applyPromoCode(code: string): Promise<void> {
    await this.type(this.promoCodeInput, code);
    await humanClick(this.applyPromoButton);
    await waitForContentUpdate(this.page);
  }

  /**
   * Proceed to checkout
   */
  async checkout(): Promise<void> {
    await humanClick(this.checkoutButton);
    await this.waitForPageLoad();
  }

  /**
   * Continue shopping
   */
  async continueShopping(): Promise<void> {
    await humanClick(this.continueShoppingLink);
    await this.waitForPageLoad();
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    while (!(await this.isEmpty())) {
      await this.removeItem(0);
      await randomDelay(300, 500);
    }
  }

  /**
   * Verify item exists in cart by partial title match
   * @param partialTitle - Partial title to search
   * @returns true if item found
   */
  async hasItemWithTitle(partialTitle: string): Promise<boolean> {
    const count = await this.getItemCount();

    for (let i = 0; i < count; i++) {
      const title = await this.getItemTitle(i);
      if (title.toLowerCase().includes(partialTitle.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get displayed quantity text (for assertions)
   * @returns Quantity display text
   */
  async getQuantityDisplayText(index: number): Promise<string> {
    const item = this.getCartItem(index);
    const qtyEl = item.locator(joinSelectors(SELECTORS.cart.quantity));
    return (await qtyEl.inputValue()) || '';
  }
}

export default CartPage;

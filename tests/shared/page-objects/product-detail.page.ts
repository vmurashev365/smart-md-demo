/**
 * Product Detail Page Object
 *
 * Page object for Smart.md product detail page.
 * Handles product info, add to cart, and credit calculator.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { SELECTORS } from '../config/selectors';
import { humanClick, randomDelay } from '../utils/human-like';
import { firstWorkingLocator } from '../utils/locator-helper';
import { parsePrice, qualifiesForCredit } from '../utils/price-utils';
import { waitForCartUpdate, waitForModal } from '../utils/wait-utils';

/**
 * Product Detail Page class
 */
export class ProductDetailPage extends BasePage {
  // ==================== Locators ====================

  /**
   * Product container
   */
  get productContainer(): Locator {
    return this.page.locator(SELECTORS.product.container);
  }

  /**
   * Product title
   */
  get productTitle(): Locator {
    return this.page.locator(SELECTORS.product.title);
  }

  /**
   * Product price
   */
  get productPrice(): Locator {
    return this.page.locator(SELECTORS.product.price);
  }

  /**
   * Old price (if discounted)
   */
  get oldPrice(): Locator {
    return this.page.locator(SELECTORS.product.oldPrice);
  }

  /**
   * Discount badge
   */
  get discountBadge(): Locator {
    return this.page.locator(SELECTORS.product.discount);
  }

  /**
   * Add to cart button
   */
  get addToCartButton(): Locator {
    return this.page.locator(SELECTORS.product.addToCart);
  }

  /**
   * Buy on credit button
   */
  get buyOnCreditButton(): Locator {
    return this.page.locator(SELECTORS.product.buyCredit);
  }

  /**
   * Buy in one click button
   */
  get buyOneClickButton(): Locator {
    return this.page.locator(SELECTORS.product.buyOneClick);
  }

  /**
   * Quantity input
   */
  get quantityInput(): Locator {
    return this.page.locator(SELECTORS.product.quantity);
  }

  /**
   * Increase quantity button
   */
  get quantityPlusButton(): Locator {
    return this.page.locator(SELECTORS.product.quantityPlus);
  }

  /**
   * Decrease quantity button
   */
  get quantityMinusButton(): Locator {
    return this.page.locator(SELECTORS.product.quantityMinus);
  }

  /**
   * Product gallery
   */
  get gallery(): Locator {
    return this.page.locator(SELECTORS.product.gallery);
  }

  /**
   * Main product image
   */
  get mainImage(): Locator {
    return this.page.locator(SELECTORS.product.mainImage);
  }

  /**
   * Product thumbnails
   */
  get thumbnails(): Locator {
    return this.page.locator(SELECTORS.product.thumbnails);
  }

  /**
   * Product description
   */
  get description(): Locator {
    return this.page.locator(SELECTORS.product.description);
  }

  /**
   * Product specifications
   */
  get specifications(): Locator {
    return this.page.locator(SELECTORS.product.specifications);
  }

  /**
   * Availability status
   */
  get availability(): Locator {
    return this.page.locator(SELECTORS.product.availability);
  }

  // ==================== Actions ====================

  /**
   * Get product title text
   * @returns Product title
   */
  async getTitle(): Promise<string> {
    return (await this.productTitle.textContent()) || '';
  }

  /**
   * Get product price as number
   * @returns Price in MDL
   */
  async getPrice(): Promise<number> {
    const priceText = (await this.productPrice.textContent()) || '0';
    return parsePrice(priceText);
  }

  /**
   * Get old price if product is discounted
   * @returns Old price or 0 if not discounted
   */
  async getOldPrice(): Promise<number> {
    if (!(await this.oldPrice.isVisible())) {
      return 0;
    }
    const priceText = (await this.oldPrice.textContent()) || '0';
    return parsePrice(priceText);
  }

  /**
   * Check if product is discounted
   * @returns true if discounted
   */
  async isDiscounted(): Promise<boolean> {
    return await this.oldPrice.isVisible();
  }

  /**
   * Check if product qualifies for credit
   * @returns true if credit available
   */
  async hasCredit(): Promise<boolean> {
    const price = await this.getPrice();
    const hasCreditButton = await this.buyOnCreditButton.isVisible();
    return hasCreditButton || qualifiesForCredit(price);
  }

  /**
   * Check if product is in stock
   * @returns true if in stock
   */
  async isInStock(): Promise<boolean> {
    const inStockEl = this.page.locator(SELECTORS.product.inStock);
    const outOfStockEl = this.page.locator(SELECTORS.product.outOfStock);

    if (await outOfStockEl.isVisible()) {
      return false;
    }

    if (await inStockEl.isVisible()) {
      return true;
    }

    // Default to true if add to cart is visible
    return await this.addToCartButton.isVisible();
  }

  /**
   * Add product to cart
   */
  async addToCart(): Promise<void> {
    const addToCart = await firstWorkingLocator(this.page, SELECTORS.product.addToCart, {
      contextLabel: 'product.addToCart',
    });
    await humanClick(addToCart);
    await waitForCartUpdate(this.page);
    await randomDelay(300, 600);
  }

  /**
   * Open credit calculator modal
   */
  async openCreditCalculator(): Promise<void> {
    // Scroll to make sure button is visible
    await this.buyOnCreditButton.scrollIntoViewIfNeeded();
    await randomDelay(200, 400);

    await humanClick(this.buyOnCreditButton);
    await waitForModal(this.page, SELECTORS.creditModal.modal);
    await randomDelay(300, 500);
  }

  /**
   * Set product quantity
   * @param quantity - Desired quantity
   */
  async setQuantity(quantity: number): Promise<void> {
    const currentQty = await this.getQuantity();

    if (quantity > currentQty) {
      // Increase quantity
      for (let i = currentQty; i < quantity; i++) {
        await humanClick(this.quantityPlusButton);
        await randomDelay(200, 400);
      }
    } else if (quantity < currentQty) {
      // Decrease quantity
      for (let i = currentQty; i > quantity; i--) {
        await humanClick(this.quantityMinusButton);
        await randomDelay(200, 400);
      }
    }
  }

  /**
   * Get current quantity
   * @returns Current quantity
   */
  async getQuantity(): Promise<number> {
    const value = await this.quantityInput.inputValue();
    return parseInt(value, 10) || 1;
  }

  /**
   * Click on thumbnail to change main image
   * @param index - Thumbnail index
   */
  async clickThumbnail(index: number): Promise<void> {
    const thumbnail = this.thumbnails.locator('img, [data-thumb]').nth(index);
    await humanClick(thumbnail);
    await randomDelay(200, 400);
  }

  /**
   * Check if images are swipeable (mobile)
   * @returns true if swipeable
   */
  async areImagesSwipeable(): Promise<boolean> {
    const swiper = this.page.locator(SELECTORS.mobile.swipeGallery);
    return await swiper.isVisible();
  }

  /**
   * Check if add to cart button is full width (mobile)
   * @returns true if full width
   */
  async isAddToCartFullWidth(): Promise<boolean> {
    const button = this.addToCartButton;
    const buttonBox = await button.boundingBox();
    const viewportSize = this.page.viewportSize();

    if (!buttonBox || !viewportSize) return false;

    // Consider full width if button is at least 90% of viewport width
    const widthRatio = buttonBox.width / viewportSize.width;
    return widthRatio >= 0.9;
  }

  /**
   * Scroll to product description
   */
  async scrollToDescription(): Promise<void> {
    await this.description.scrollIntoViewIfNeeded();
    await randomDelay(300, 500);
  }

  /**
   * Scroll to specifications
   */
  async scrollToSpecifications(): Promise<void> {
    await this.specifications.scrollIntoViewIfNeeded();
    await randomDelay(300, 500);
  }

  /**
   * Verify product page is loaded
   * @returns true if product page is valid
   */
  async isProductPageLoaded(): Promise<boolean> {
    await this.waitForPageLoad();

    const hasTitle = await this.productTitle.isVisible();
    const hasPrice = await this.productPrice.isVisible();
    const hasAddToCart = await this.addToCartButton.isVisible();

    return hasTitle && hasPrice && hasAddToCart;
  }
}

export default ProductDetailPage;

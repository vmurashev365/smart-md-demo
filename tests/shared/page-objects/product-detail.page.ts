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
import { firstWorkingLocator, joinSelectors } from '../utils/locator-helper';
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
    return this.page.locator(joinSelectors(SELECTORS.product.container));
  }

  /**
   * Product title
   */
  get productTitle(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.title));
  }

  /**
   * Product price
   */
  get productPrice(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.price));
  }

  /**
   * Old price (if discounted)
   */
  get oldPrice(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.oldPrice));
  }

  /**
   * Discount badge
   */
  get discountBadge(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.discount));
  }

  /**
   * Add to cart button
   */
  get addToCartButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.addToCart));
  }

  /**
   * Buy on credit button
   */
  get buyOnCreditButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.buyCredit));
  }

  /**
   * Buy in one click button
   */
  get buyOneClickButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.buyOneClick));
  }

  /**
   * Quantity input
   */
  get quantityInput(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.quantity));
  }

  /**
   * Increase quantity button
   */
  get quantityPlusButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.quantityPlus));
  }

  /**
   * Decrease quantity button
   */
  get quantityMinusButton(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.quantityMinus));
  }

  /**
   * Product gallery
   */
  get gallery(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.gallery));
  }

  /**
   * Main product image
   */
  get mainImage(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.mainImage));
  }

  /**
   * Product thumbnails
   */
  get thumbnails(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.thumbnails));
  }

  /**
   * Product description
   */
  get description(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.description));
  }

  /**
   * Product specifications
   */
  get specifications(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.specifications));
  }

  /**
   * Availability status
   */
  get availability(): Locator {
    return this.page.locator(joinSelectors(SELECTORS.product.availability));
  }

  // ==================== Actions ====================

  /**
   * Get product title text
   * Smart.md has 2 h1 titles (desktop and mobile), filter by visible
   * @returns Product title
   */
  async getTitle(): Promise<string> {
    // Use locator filter to get only visible h1
    const visibleTitle = this.productTitle.locator('visible=true').first();
    const text = await visibleTitle.textContent().catch(() => '');
    
    // Fallback if visible filter doesn't work
    if (!text) {
      return (await this.productTitle.first().textContent()) || '';
    }
    
    return text;
  }

  /**
   * Get product name (alias for getTitle)
   * @returns Product name
   */
  async getProductName(): Promise<string> {
    return this.getTitle();
  }

  /**
   * Get product price as number
   * @returns Price in MDL
   */
  async getPrice(): Promise<number> {
    // Use #priceProduct input element which contains the canonical price
    const priceInput = this.page.locator('#priceProduct');
    const priceValue = await priceInput.getAttribute('value');
    return priceValue ? parseFloat(priceValue) : 0;
  }

  /**
   * Get product price as formatted string
   * @returns Price text with currency
   */
  async getProductPrice(): Promise<string> {
    // Smart.md uses #priceProduct input element
    const priceInput = this.page.locator('#priceProduct');
    const priceValue = await priceInput.getAttribute('value');
    
    if (priceValue) {
      // Format as "26 999 lei"
      const price = parseFloat(priceValue);
      return `${price.toLocaleString('ru')} lei`;
    }
    
    return '0 lei';
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
    const inStockEl = this.page.locator(joinSelectors(SELECTORS.product.inStock));
    const outOfStockEl = this.page.locator(joinSelectors(SELECTORS.product.outOfStock));

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
   * Uses centralized SELECTORS.product.addToCart with fallback chain
   * Falls back to semantic getByRole() for language-agnostic detection
   */
  async addToCart(): Promise<void> {
    let addToCartButton: Locator;
    
    try {
      // Try centralized selectors first (data-testid, classes, etc.)
      addToCartButton = await firstWorkingLocator(
        this.page,
        SELECTORS.product.addToCart,
        { 
          contextLabel: 'product.addToCart', 
          requireVisible: true,
          perSelectorTimeout: 500  // Shorter timeout for fast fallback
        }
      );
    } catch (error) {
      // Fallback: Use semantic getByRole for language-agnostic button detection
      // Romanian: "Adauga in cos", Russian: "В корзину", English: "Add to cart"
      addToCartButton = this.page.locator('#product').getByRole('button', {
        name: /adauga in cos|в корзину|add to cart/i
      }).first();
      
      // Verify it's visible
      await addToCartButton.waitFor({ state: 'visible', timeout: 5000 });
    }
    
    await addToCartButton.scrollIntoViewIfNeeded();
    await humanClick(addToCartButton);
    await waitForCartUpdate(this.page);
    await randomDelay(300, 600);
  }

  /**
   * Open credit calculator modal
   * Uses centralized SELECTORS.product.buyCredit with fallback chain
   * Returns CreditModalComponent instance for proper decoupling
   */
  async openCreditCalculator(): Promise<any> {
    // Import CreditModalComponent dynamically to avoid circular dependencies
    const { CreditModalComponent } = await import('./components/credit-modal.component');
    
    let creditButton: Locator;
    
    try {
      // Try centralized selectors first
      creditButton = await firstWorkingLocator(
        this.page,
        SELECTORS.product.buyCredit,
        { 
          contextLabel: 'product.buyCredit', 
          requireVisible: true,
          perSelectorTimeout: 500  // Shorter timeout for fast fallback
        }
      );
    } catch (error) {
      // Fallback: Use getByRole with regex for dynamic price
      // Matches "Credit de la 1241 lei/luna" with any price
      creditButton = this.page.getByRole('button', { 
        name: /Credit de la \d+/i 
      }).first();
      
      // Verify it's visible
      await creditButton.waitFor({ state: 'visible', timeout: 5000 });
    }
    
    // Scroll to make sure button is visible
    await creditButton.scrollIntoViewIfNeeded();
    await randomDelay(200, 400);

    await humanClick(creditButton);
    
    // Return CreditModalComponent instance - let consumer handle waiting
    const modal = new CreditModalComponent(this.page);
    // Basic wait to ensure modal starts opening
    await waitForModal(this.page, joinSelectors(SELECTORS.creditModal.modal));
    await randomDelay(300, 500);
    
    return modal;
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
    const swiper = this.page.locator(joinSelectors(SELECTORS.mobile.swipeGallery));
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

    // Smart.md structure from Codegen: #product container with button role
    const productContainer = this.page.locator('#product');
    
    // Check title (2 h1 elements: desktop and mobile)
    const hasTitle = await this.productTitle.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // Check "Adauga in cos" button using Codegen pattern
    const hasAddToCart = await productContainer
      .getByRole('button', { name: /adauga in cos|в корзину/i })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    console.log(`[isProductPageLoaded] Title: ${hasTitle}, AddToCart: ${hasAddToCart}`);
    
    // For Smart.md mobile, button is enough (title might be lazy loaded)
    return hasAddToCart;
  }
}

export default ProductDetailPage;

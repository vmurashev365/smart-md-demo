/**
 * Centralized Selectors for Smart.md
 *
 * This file contains all CSS/XPath selectors used throughout the test framework.
 * Keeping selectors centralized makes maintenance easier when the UI changes.
 *
 * Selector Strategy Priority (Fallback Chain):
 * 1. data-testid attributes (most stable)
 * 2. data-* attributes
 * 3. Semantic HTML elements with unique attributes
 * 4. CSS classes (less stable)
 * 5. Partial text match (last resort)
 *
 * FORMAT: All selector properties are string[] arrays for explicit iteration
 * and debugging with firstWorkingLocator helper.
 *
 * @updated December 2025 - Migrated from .join(', ') to string[] arrays
 */

export const SELECTORS = {
  /**
   * Header Component Selectors
   */
  header: {
    container: [
      '[data-testid="header"]',
      'header',
      '.header',
      '#header',
    ],

    searchInput: [
      '[data-testid="search-input"]',
      'input[name="search"]',
      'input[type="search"]',
      '.search-input',
      '#search',
      '#search-input',
    ],

    searchButton: [
      '[data-testid="search-btn"]',
      'button[type="submit"].search',
      '.search-btn',
      '.search-button',
      'button:has(.search-icon)',
    ],

    searchForm: [
      '[data-testid="search-form"]',
      'form[role="search"]',
      '.search-form',
    ],

    cartIcon: [
      '[data-testid="cart"]',
      '[data-action="open-cart"]',
      '.cart-icon',
      '.header-cart',
      // Avoid greedy matches like "cart-..." on PDP/catalog
      'a[href="/cart"]',
      'a[href$="/cart"]',
      // Some environments may use RO path "cos" for cart
      'a[href="/cos"]',
      'a[href$="/cos"]',
    ],

    cartCount: [
      '[data-testid="cart-count"]',
      '.cart-count',
      '.cart-badge',
      '.cart-qty',
      '.cart-quantity',
    ],

    languageSwitcher: [
      '[data-testid="lang-switch"]',
      '[data-action="change-lang"]',
      '.lang-switch',
      '.language-selector',
      '.lang-dropdown',
    ],

    languageRO: [
      '[data-lang="ro"]',
      'a[href="/"]',
      '.lang-ro',
    ],

    languageRU: [
      '[data-lang="ru"]',
      'a[href="/ru/"]',
      '.lang-ru',
    ],

    hamburgerMenu: [
      '[data-testid="mobile-menu"]',
      '[aria-label="Menu"]',
      '.hamburger',
      '.mobile-menu-btn',
      '.burger-menu',
      '.menu-toggle',
    ],

    logo: [
      '[data-testid="logo"]',
      '.logo',
      '.header-logo',
      'a.logo',
    ],

    userMenu: [
      '[data-testid="user-menu"]',
      '.user-menu',
      '.account-menu',
    ],

    wishlist: [
      '[data-testid="wishlist"]',
      '.wishlist',
      'a[href*="wishlist"]',
    ],
  },

  /**
   * Navigation & Menu Selectors
   */
  navigation: {
    mainNav: [
      '[data-testid="main-nav"]',
      'nav.main-nav',
      '.main-nav',
      '.navigation',
      'nav',
    ],

    categoryMenu: [
      '[data-testid="categories"]',
      '.category-menu',
      '.categories',
    ],

    categoryLink: [
      '[data-testid="category-link"]',
      '.category-link',
      '.nav-category',
    ],

    subcategoryLink: [
      '[data-testid="subcategory-link"]',
      '.subcategory-link',
      '.nav-subcategory',
    ],

    megaMenu: [
      '[data-testid="mega-menu"]',
      '.mega-menu',
      '.dropdown-menu',
    ],

    breadcrumb: [
      '[data-testid="breadcrumb"]',
      '.breadcrumb',
      '.breadcrumbs',
      '[aria-label="breadcrumb"]',
    ],
  },

  /**
   * Search Results Page Selectors
   */
  searchResults: {
    container: [
      '[data-testid="search-results"]',
      '.search-results',
      '.products-list',
      '.product-list',
    ],

    productGrid: [
      '[data-testid="product-grid"]',
      '.product-grid',
      '.products-grid',
    ],

    productCard: [
      '[data-testid="product-card"]',
      '[data-product-id]',
      '.product-card',
      '.product-item',
      '.product',
    ],

    productTitle: [
      '[data-testid="product-title"]',
      '[itemprop="name"]',
      '.product-title',
      '.product-name',
      'h2.title',
    ],

    productPrice: [
      '[data-testid="product-price"]',
      '[data-price]',
      '[itemprop="price"]',
      '.product-price',
      '.price',
    ],

    productImage: [
      '[data-testid="product-image"]',
      '.product-image',
      '.product-img',
    ],

    productLink: [
      '[data-testid="product-link"]',
      '.product-link',
      'a.product-card',
    ],

    resultCount: [
      '[data-testid="result-count"]',
      '.result-count',
      '.products-count',
    ],

    noResults: [
      '[data-testid="no-results"]',
      '.no-results',
      '.empty-results',
    ],

    pagination: [
      '[data-testid="pagination"]',
      '.pagination',
    ],

    loadMore: [
      '[data-testid="load-more"]',
      '.load-more',
    ],
  },

  /**
   * Catalog Page Selectors
   */
  catalog: {
    container: [
      '[data-testid="catalog"]',
      '.catalog',
      '.category-page',
    ],

    productCard: [
      '[data-testid="product-card"]',
      '[data-product-id]',
      '.product-card',
      '.product-item',
    ],

    productTitle: [
      '[data-testid="product-title"]',
      '[itemprop="name"]',
      '.product-title',
      '.product-name',
    ],

    productPrice: [
      '[data-testid="product-price"]',
      '[data-price]',
      '[itemprop="price"]',
      '.product-price',
      '.price',
    ],

    filterSidebar: [
      '[data-testid="filters"]',
      '.filter-sidebar',
      '.filters',
      '.sidebar-filters',
    ],

    brandFilter: [
      '[data-testid="filter-brand"]',
      '[data-filter="brand"]',
      '.filter-brand',
      '.brand-filter',
    ],

    priceFilter: [
      '[data-testid="price-filter"]',
      '[data-filter="price"]',
      '.filter-price',
    ],

    colorFilter: [
      '[data-testid="color-filter"]',
      '[data-filter="color"]',
      '.filter-color',
    ],

    filterCheckbox: ['.filter-checkbox', 'input[type="checkbox"]'],
    filterLabel: ['.filter-label', 'label'],

    sortDropdown: [
      '[data-testid="sort"]',
      '[data-action="sort"]',
      '.sort-select',
      'select.sort',
      '.sorting-dropdown',
    ],

    sortOption: ['.sort-option', 'option'],

    activeFilters: [
      '[data-testid="active-filters"]',
      '.active-filters',
      '.filter-tags',
      '.applied-filters',
    ],

    filterTag: [
      '[data-testid="filter-tag"]',
      '.filter-tag',
      '.active-filter',
    ],

    clearFilters: [
      '[data-testid="clear-filters"]',
      '[data-action="clear-filters"]',
      '.clear-filters',
      '.reset-filters',
    ],

    productCount: [
      '[data-testid="product-count"]',
      '.product-count',
      '.items-count',
    ],
  },

  /**
   * Product Detail Page Selectors
   */
  product: {
    container: [
      '[data-testid="product-detail"]',
      '.product-detail',
      '.product-page',
    ],

    title: [
      '[data-testid="pdp-title"]',
      'h1[itemprop="name"]',
      'h1.product-title',
      '.pdp-title',
      'h1',
    ],

    price: [
      '[data-testid="pdp-price"]',
      '[data-price]',
      '[itemprop="price"]',
      '.product-price',
      '.pdp-price',
      '.price-current',
    ],

    oldPrice: [
      '[data-testid="old-price"]',
      '.old-price',
      '.price-old',
      '.original-price',
    ],

    discount: [
      '[data-testid="discount"]',
      '.discount',
      '.discount-badge',
    ],

    productId: [
      '[data-product-id]',
      '[data-sku]',
      '[data-testid="product-id"]',
    ],

    // CRITICAL: No exact text! Use semantic selectors with text fallback
    addToCart: [
      '[data-testid="add-to-cart"]',
      '[data-action="add-to-cart"]',
      'button.add-to-cart',
      '.btn-add-cart',
      '.add-to-cart',
      // RO fallback: cover both "cos" and "coș"
      'button:has-text(/co[sș]/i)',
      // RU fallback
      'button:has-text(/корзин/i)',
    ],

    buyCredit: [
      '[data-testid="buy-credit"]',
      '[data-action="credit"]',
      '.credit-btn',
      '.buy-credit',
      '.btn-credit',
      'button:has-text("credit")',
      'a:has-text("credit")',
    ],

    buyOneClick: [
      '[data-testid="one-click"]',
      '.buy-one-click',
      '.one-click-buy',
    ],

    quantity: [
      '[data-testid="quantity"]',
      '.quantity-input',
      'input[type="number"]',
    ],

    quantityPlus: [
      '[data-testid="qty-plus"]',
      '[data-action="increase"]',
      '.qty-plus',
      '.quantity-plus',
    ],

    quantityMinus: [
      '[data-testid="qty-minus"]',
      '[data-action="decrease"]',
      '.qty-minus',
      '.quantity-minus',
    ],

    gallery: [
      '[data-testid="gallery"]',
      '.product-gallery',
      '.product-images',
    ],

    mainImage: [
      '[data-testid="main-image"]',
      '.main-image',
      '.product-main-image',
    ],

    thumbnails: [
      '[data-testid="thumbnails"]',
      '.thumbnails',
      '.product-thumbs',
    ],

    description: [
      '[data-testid="description"]',
      '[itemprop="description"]',
      '.product-description',
    ],

    specifications: [
      '[data-testid="specifications"]',
      '.specifications',
      '.product-specs',
    ],

    reviews: [
      '[data-testid="reviews"]',
      '.reviews',
      '.product-reviews',
    ],

    availability: [
      '[data-testid="availability"]',
      '.availability',
      '.stock-status',
    ],

    inStock: ['.in-stock', '.available', '[data-stock="in"]'],
    outOfStock: ['.out-of-stock', '.unavailable', '[data-stock="out"]'],
  },

  /**
   * Credit Calculator Modal Selectors
   */
  creditModal: {
    modal: [
      '[data-testid="credit-calculator"]',
      '.credit-modal',
      '.credit-calculator',
      '.modal-credit',
      '[role="dialog"]:has-text("credit")',
    ],

    modalContent: ['.modal-content', '.credit-content'],

    monthlyPayment: [
      '[data-testid="monthly-payment"]',
      '[data-monthly]',
      '.monthly-payment',
      '.credit-amount',
      '.payment-amount',
    ],

    totalAmount: [
      '[data-testid="total-amount"]',
      '.total-amount',
      '.credit-total',
    ],

    providers: [
      '[data-testid="credit-provider"]',
      '[data-provider]',
      '.credit-provider',
      '.bank-option',
      '.provider-item',
    ],

    providerName: ['.provider-name', '.bank-name'],
    providerLogo: ['.provider-logo', '.bank-logo'],

    termSelector: [
      '[data-testid="credit-term"]',
      '[data-action="select-term"]',
      '.term-select',
      'select.term',
      '.term-options',
      '.payment-term',
    ],

    termOption: ['.term-option', 'option', '.term-item'],

    interestRate: [
      '[data-testid="interest-rate"]',
      '.interest-rate',
      '.rate',
    ],

    applyButton: [
      '[data-testid="apply-credit"]',
      '.apply-credit',
      '.btn-apply',
    ],

    closeButton: [
      '[data-testid="close-modal"]',
      '[aria-label="Close"]',
      '.modal-close',
      '.close-btn',
      'button.close',
      '.btn-close',
    ],

    overlay: [
      '[data-testid="modal-overlay"]',
      '.modal-overlay',
      '.modal-backdrop',
    ],
  },

  /**
   * Shopping Cart Selectors
   */
  cart: {
    container: [
      '[data-testid="cart-container"]',
      '[data-testid="cart-page"]',
      '.cart-container',
      '.shopping-cart',
      '.cart',
      '#cart',
    ],

    item: [
      '[data-testid="cart-item"]',
      '[data-cart-item]',
      '.cart-item',
      '.cart-product',
    ],

    itemTitle: [
      '[data-testid="item-title"]',
      '.item-title',
      '.cart-item-title',
    ],

    itemPrice: [
      '[data-testid="item-price"]',
      '.item-price',
      '.cart-item-price',
    ],

    itemImage: ['.item-image', '.cart-item-image'],

    quantity: [
      '[data-testid="quantity"]',
      '.quantity-input',
      'input[name="qty"]',
      'input.qty',
    ],

    increaseBtn: [
      '[data-testid="qty-plus"]',
      '[data-action="increase"]',
      '.qty-plus',
      'button.increase',
      '.btn-increase',
      '.quantity-plus',
    ],

    decreaseBtn: [
      '[data-testid="qty-minus"]',
      '[data-action="decrease"]',
      '.qty-minus',
      'button.decrease',
      '.btn-decrease',
      '.quantity-minus',
    ],

    removeBtn: [
      '[data-testid="remove-item"]',
      '[data-action="remove"]',
      '.remove-item',
      'button.remove',
      '.delete-item',
      '.btn-remove',
    ],

    subtotal: [
      '[data-testid="subtotal"]',
      '.subtotal',
      '.cart-subtotal',
    ],

    total: [
      '[data-testid="cart-total"]',
      '.cart-total',
      '.total-price',
    ],

    // CRITICAL: Empty cart by selector, NOT by text!
    emptyState: [
      '[data-testid="cart-empty"]',
      '.cart-empty',
      '.empty-cart',
      '.cart-is-empty',
      // RO fallback (real smart.md message) - keep last
      '*:text-matches("Nu ați adăugat încă articole în coșul de cumpărături", "i")',
    ],

    checkoutBtn: [
      '[data-testid="checkout"]',
      '.checkout-btn',
      '.btn-checkout',
      'a[href*="checkout"]',
    ],

    continueShopping: [
      '[data-testid="continue-shopping"]',
      '.continue-shopping',
    ],

    promoCode: [
      '[data-testid="promo-code"]',
      '.promo-code',
      'input.coupon',
    ],

    applyPromo: [
      '[data-testid="apply-promo"]',
      '.apply-promo',
    ],
  },

  /**
   * Cart Popup/Mini-Cart Selectors
   */
  cartPopup: {
    container: [
      '[data-testid="cart-popup"]',
      '.cart-popup',
      '.mini-cart',
    ],

    message: [
      '[data-testid="cart-message"]',
      '.cart-message',
      '.added-message',
      '.success-message',
    ],

    viewCart: [
      '[data-testid="view-cart"]',
      '.view-cart',
      'a.view-cart',
    ],

    continueBtn: [
      '[data-testid="continue"]',
      '.continue',
    ],

    closeBtn: [
      '[data-testid="close-popup"]',
      '.close-popup',
    ],
  },

  /**
   * Mobile-Specific Selectors
   */
  mobile: {
    menuDrawer: [
      '[data-testid="mobile-drawer"]',
      '[role="navigation"].mobile',
      '.mobile-drawer',
      '.mobile-nav',
      '.drawer',
    ],

    menuClose: [
      '[data-testid="menu-close"]',
      '[aria-label="Close menu"]',
      '.menu-close',
      '.drawer-close',
    ],

    categoryLink: [
      '[data-testid="mobile-category"]',
      '.mobile-category',
      '.nav-category',
      '.mobile-menu-item',
    ],

    backButton: [
      '[data-testid="back"]',
      '.back-button',
      '.nav-back',
    ],

    mobileSearch: [
      '[data-testid="mobile-search"]',
      '.mobile-search',
    ],

    mobileCart: [
      '[data-testid="mobile-cart"]',
      '.mobile-cart',
    ],

    bottomNav: [
      '[data-testid="bottom-nav"]',
      '.bottom-nav',
      '.mobile-bottom-nav',
    ],

    productGrid: [
      '[data-testid="mobile-grid"]',
      '.mobile-grid',
      '.products-mobile',
    ],

    swipeGallery: [
      '[data-testid="swipe-gallery"]',
      '.swipe-gallery',
      '.swiper',
    ],

    // For checking desktop nav is hidden
    desktopNav: [
      '[data-testid="desktop-nav"]',
      '.desktop-nav',
      '.main-nav:not(.mobile)',
      'nav.desktop-only',
    ],
  },

  /**
   * Common UI Elements
   */
  common: {
    loader: [
      '[data-testid="loader"]',
      '[data-loading]',
      '.loader',
      '.loading',
      '.spinner',
    ],

    skeleton: [
      '[data-testid="skeleton"]',
      '.skeleton',
      '.placeholder',
    ],

    toast: [
      '[data-testid="toast"]',
      '.toast',
      '.notification',
    ],

    modal: [
      '[data-testid="modal"]',
      '[role="dialog"]',
      '.modal',
      '.dialog',
    ],

    modalOverlay: [
      '[data-testid="overlay"]',
      '.modal-overlay',
      '.overlay',
    ],

    button: ['button', '.btn', '[data-testid="button"]'],
    input: ['input', '.input', '[data-testid="input"]'],
    select: ['select', '.select', '[data-testid="select"]'],
    checkbox: ['input[type="checkbox"]', '.checkbox'],
    radio: ['input[type="radio"]', '.radio'],

    errorMessage: [
      '[data-testid="error"]',
      '.error',
      '.error-message',
    ],

    successMessage: [
      '[data-testid="success"]',
      '.success',
      '.success-message',
    ],
  },
};

export default SELECTORS;

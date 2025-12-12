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
 * @updated December 2025 - Added fallback chains for stability
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
    ].join(', '),

    searchInput: [
      '[data-testid="search-input"]',
      'input[name="search"]',
      'input[type="search"]',
      '.search-input',
      '#search',
      '#search-input',
    ].join(', '),

    searchButton: [
      '[data-testid="search-btn"]',
      'button[type="submit"].search',
      '.search-btn',
      '.search-button',
      'button:has(.search-icon)',
    ].join(', '),

    searchForm: [
      '[data-testid="search-form"]',
      'form[role="search"]',
      '.search-form',
    ].join(', '),

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
    ].join(', '),

    cartCount: [
      '[data-testid="cart-count"]',
      '.cart-count',
      '.cart-badge',
      '.cart-qty',
      '.cart-quantity',
    ].join(', '),

    languageSwitcher: [
      '[data-testid="lang-switch"]',
      '[data-action="change-lang"]',
      '.lang-switch',
      '.language-selector',
      '.lang-dropdown',
    ].join(', '),

    languageRO: [
      '[data-lang="ro"]',
      'a[href="/"]',
      '.lang-ro',
    ].join(', '),

    languageRU: [
      '[data-lang="ru"]',
      'a[href="/ru/"]',
      '.lang-ru',
    ].join(', '),

    hamburgerMenu: [
      '[data-testid="mobile-menu"]',
      '[aria-label="Menu"]',
      '.hamburger',
      '.mobile-menu-btn',
      '.burger-menu',
      '.menu-toggle',
    ].join(', '),

    logo: [
      '[data-testid="logo"]',
      '.logo',
      '.header-logo',
      'a.logo',
    ].join(', '),

    userMenu: [
      '[data-testid="user-menu"]',
      '.user-menu',
      '.account-menu',
    ].join(', '),

    wishlist: [
      '[data-testid="wishlist"]',
      '.wishlist',
      'a[href*="wishlist"]',
    ].join(', '),
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
    ].join(', '),

    categoryMenu: [
      '[data-testid="categories"]',
      '.category-menu',
      '.categories',
    ].join(', '),

    categoryLink: [
      '[data-testid="category-link"]',
      '.category-link',
      '.nav-category',
    ].join(', '),

    subcategoryLink: [
      '[data-testid="subcategory-link"]',
      '.subcategory-link',
      '.nav-subcategory',
    ].join(', '),

    megaMenu: [
      '[data-testid="mega-menu"]',
      '.mega-menu',
      '.dropdown-menu',
    ].join(', '),

    breadcrumb: [
      '[data-testid="breadcrumb"]',
      '.breadcrumb',
      '.breadcrumbs',
      '[aria-label="breadcrumb"]',
    ].join(', '),
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
    ].join(', '),

    productGrid: [
      '[data-testid="product-grid"]',
      '.product-grid',
      '.products-grid',
    ].join(', '),

    productCard: [
      '[data-testid="product-card"]',
      '[data-product-id]',
      '.product-card',
      '.product-item',
      '.product',
    ].join(', '),

    productTitle: [
      '[data-testid="product-title"]',
      '[itemprop="name"]',
      '.product-title',
      '.product-name',
      'h2.title',
    ].join(', '),

    productPrice: [
      '[data-testid="product-price"]',
      '[data-price]',
      '[itemprop="price"]',
      '.product-price',
      '.price',
    ].join(', '),

    productImage: [
      '[data-testid="product-image"]',
      '.product-image',
      '.product-img',
    ].join(', '),

    productLink: [
      '[data-testid="product-link"]',
      '.product-link',
      'a.product-card',
    ].join(', '),

    resultCount: [
      '[data-testid="result-count"]',
      '.result-count',
      '.products-count',
    ].join(', '),

    noResults: [
      '[data-testid="no-results"]',
      '.no-results',
      '.empty-results',
    ].join(', '),

    pagination: [
      '[data-testid="pagination"]',
      '.pagination',
    ].join(', '),

    loadMore: [
      '[data-testid="load-more"]',
      '.load-more',
    ].join(', '),
  },

  /**
   * Catalog Page Selectors
   */
  catalog: {
    container: [
      '[data-testid="catalog"]',
      '.catalog',
      '.category-page',
    ].join(', '),

    productCard: [
      '[data-testid="product-card"]',
      '[data-product-id]',
      '.product-card',
      '.product-item',
    ].join(', '),

    productTitle: [
      '[data-testid="product-title"]',
      '[itemprop="name"]',
      '.product-title',
      '.product-name',
    ].join(', '),

    productPrice: [
      '[data-testid="product-price"]',
      '[data-price]',
      '[itemprop="price"]',
      '.product-price',
      '.price',
    ].join(', '),

    filterSidebar: [
      '[data-testid="filters"]',
      '.filter-sidebar',
      '.filters',
      '.sidebar-filters',
    ].join(', '),

    brandFilter: [
      '[data-testid="filter-brand"]',
      '[data-filter="brand"]',
      '.filter-brand',
      '.brand-filter',
    ].join(', '),

    priceFilter: [
      '[data-testid="price-filter"]',
      '[data-filter="price"]',
      '.filter-price',
    ].join(', '),

    colorFilter: [
      '[data-testid="color-filter"]',
      '[data-filter="color"]',
      '.filter-color',
    ].join(', '),

    filterCheckbox: '.filter-checkbox, input[type="checkbox"]',
    filterLabel: '.filter-label, label',

    sortDropdown: [
      '[data-testid="sort"]',
      '[data-action="sort"]',
      '.sort-select',
      'select.sort',
      '.sorting-dropdown',
    ].join(', '),

    sortOption: '.sort-option, option',

    activeFilters: [
      '[data-testid="active-filters"]',
      '.active-filters',
      '.filter-tags',
      '.applied-filters',
    ].join(', '),

    filterTag: [
      '[data-testid="filter-tag"]',
      '.filter-tag',
      '.active-filter',
    ].join(', '),

    clearFilters: [
      '[data-testid="clear-filters"]',
      '[data-action="clear-filters"]',
      '.clear-filters',
      '.reset-filters',
    ].join(', '),

    productCount: [
      '[data-testid="product-count"]',
      '.product-count',
      '.items-count',
    ].join(', '),
  },

  /**
   * Product Detail Page Selectors
   */
  product: {
    container: [
      '[data-testid="product-detail"]',
      '.product-detail',
      '.product-page',
    ].join(', '),

    title: [
      '[data-testid="pdp-title"]',
      'h1[itemprop="name"]',
      'h1.product-title',
      '.pdp-title',
      'h1',
    ].join(', '),

    price: [
      '[data-testid="pdp-price"]',
      '[data-price]',
      '[itemprop="price"]',
      '.product-price',
      '.pdp-price',
      '.price-current',
    ].join(', '),

    oldPrice: [
      '[data-testid="old-price"]',
      '.old-price',
      '.price-old',
      '.original-price',
    ].join(', '),

    discount: [
      '[data-testid="discount"]',
      '.discount',
      '.discount-badge',
    ].join(', '),

    productId: [
      '[data-product-id]',
      '[data-sku]',
      '[data-testid="product-id"]',
    ].join(', '),

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
    ].join(', '),

    buyCredit: [
      '[data-testid="buy-credit"]',
      '[data-action="credit"]',
      '.credit-btn',
      '.buy-credit',
      '.btn-credit',
      'button:has-text("credit")',
      'a:has-text("credit")',
    ].join(', '),

    buyOneClick: [
      '[data-testid="one-click"]',
      '.buy-one-click',
      '.one-click-buy',
    ].join(', '),

    quantity: [
      '[data-testid="quantity"]',
      '.quantity-input',
      'input[type="number"]',
    ].join(', '),

    quantityPlus: [
      '[data-testid="qty-plus"]',
      '[data-action="increase"]',
      '.qty-plus',
      '.quantity-plus',
    ].join(', '),

    quantityMinus: [
      '[data-testid="qty-minus"]',
      '[data-action="decrease"]',
      '.qty-minus',
      '.quantity-minus',
    ].join(', '),

    gallery: [
      '[data-testid="gallery"]',
      '.product-gallery',
      '.product-images',
    ].join(', '),

    mainImage: [
      '[data-testid="main-image"]',
      '.main-image',
      '.product-main-image',
    ].join(', '),

    thumbnails: [
      '[data-testid="thumbnails"]',
      '.thumbnails',
      '.product-thumbs',
    ].join(', '),

    description: [
      '[data-testid="description"]',
      '[itemprop="description"]',
      '.product-description',
    ].join(', '),

    specifications: [
      '[data-testid="specifications"]',
      '.specifications',
      '.product-specs',
    ].join(', '),

    reviews: [
      '[data-testid="reviews"]',
      '.reviews',
      '.product-reviews',
    ].join(', '),

    availability: [
      '[data-testid="availability"]',
      '.availability',
      '.stock-status',
    ].join(', '),

    inStock: '.in-stock, .available, [data-stock="in"]',
    outOfStock: '.out-of-stock, .unavailable, [data-stock="out"]',
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
    ].join(', '),

    modalContent: '.modal-content, .credit-content',

    monthlyPayment: [
      '[data-testid="monthly-payment"]',
      '[data-monthly]',
      '.monthly-payment',
      '.credit-amount',
      '.payment-amount',
    ].join(', '),

    totalAmount: [
      '[data-testid="total-amount"]',
      '.total-amount',
      '.credit-total',
    ].join(', '),

    providers: [
      '[data-testid="credit-provider"]',
      '[data-provider]',
      '.credit-provider',
      '.bank-option',
      '.provider-item',
    ].join(', '),

    providerName: '.provider-name, .bank-name',
    providerLogo: '.provider-logo, .bank-logo',

    termSelector: [
      '[data-testid="credit-term"]',
      '[data-action="select-term"]',
      '.term-select',
      'select.term',
      '.term-options',
      '.payment-term',
    ].join(', '),

    termOption: '.term-option, option, .term-item',

    interestRate: [
      '[data-testid="interest-rate"]',
      '.interest-rate',
      '.rate',
    ].join(', '),

    applyButton: [
      '[data-testid="apply-credit"]',
      '.apply-credit',
      '.btn-apply',
    ].join(', '),

    closeButton: [
      '[data-testid="close-modal"]',
      '[aria-label="Close"]',
      '.modal-close',
      '.close-btn',
      'button.close',
      '.btn-close',
    ].join(', '),

    overlay: [
      '[data-testid="modal-overlay"]',
      '.modal-overlay',
      '.modal-backdrop',
    ].join(', '),
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
    ].join(', '),

    item: [
      '[data-testid="cart-item"]',
      '[data-cart-item]',
      '.cart-item',
      '.cart-product',
    ].join(', '),

    itemTitle: [
      '[data-testid="item-title"]',
      '.item-title',
      '.cart-item-title',
    ].join(', '),

    itemPrice: [
      '[data-testid="item-price"]',
      '.item-price',
      '.cart-item-price',
    ].join(', '),

    itemImage: '.item-image, .cart-item-image',

    quantity: [
      '[data-testid="quantity"]',
      '.quantity-input',
      'input[name="qty"]',
      'input.qty',
    ].join(', '),

    increaseBtn: [
      '[data-testid="qty-plus"]',
      '[data-action="increase"]',
      '.qty-plus',
      'button.increase',
      '.btn-increase',
      '.quantity-plus',
    ].join(', '),

    decreaseBtn: [
      '[data-testid="qty-minus"]',
      '[data-action="decrease"]',
      '.qty-minus',
      'button.decrease',
      '.btn-decrease',
      '.quantity-minus',
    ].join(', '),

    removeBtn: [
      '[data-testid="remove-item"]',
      '[data-action="remove"]',
      '.remove-item',
      'button.remove',
      '.delete-item',
      '.btn-remove',
    ].join(', '),

    subtotal: [
      '[data-testid="subtotal"]',
      '.subtotal',
      '.cart-subtotal',
    ].join(', '),

    total: [
      '[data-testid="cart-total"]',
      '.cart-total',
      '.total-price',
    ].join(', '),

    // CRITICAL: Empty cart by selector, NOT by text!
    emptyState: [
      '[data-testid="cart-empty"]',
      '.cart-empty',
      '.empty-cart',
      '.cart-is-empty',
      // RO fallback (real smart.md message) - keep last
      '*:text-matches("Nu ați adăugat încă articole în coșul de cumpărături", "i")',
    ].join(', '),

    checkoutBtn: [
      '[data-testid="checkout"]',
      '.checkout-btn',
      '.btn-checkout',
      'a[href*="checkout"]',
    ].join(', '),

    continueShopping: [
      '[data-testid="continue-shopping"]',
      '.continue-shopping',
    ].join(', '),

    promoCode: [
      '[data-testid="promo-code"]',
      '.promo-code',
      'input.coupon',
    ].join(', '),

    applyPromo: [
      '[data-testid="apply-promo"]',
      '.apply-promo',
    ].join(', '),
  },

  /**
   * Cart Popup/Mini-Cart Selectors
   */
  cartPopup: {
    container: [
      '[data-testid="cart-popup"]',
      '.cart-popup',
      '.mini-cart',
    ].join(', '),

    message: [
      '[data-testid="cart-message"]',
      '.cart-message',
      '.added-message',
      '.success-message',
    ].join(', '),

    viewCart: [
      '[data-testid="view-cart"]',
      '.view-cart',
      'a.view-cart',
    ].join(', '),

    continueBtn: [
      '[data-testid="continue"]',
      '.continue',
    ].join(', '),

    closeBtn: [
      '[data-testid="close-popup"]',
      '.close-popup',
    ].join(', '),
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
    ].join(', '),

    menuClose: [
      '[data-testid="menu-close"]',
      '[aria-label="Close menu"]',
      '.menu-close',
      '.drawer-close',
    ].join(', '),

    categoryLink: [
      '[data-testid="mobile-category"]',
      '.mobile-category',
      '.nav-category',
      '.mobile-menu-item',
    ].join(', '),

    backButton: [
      '[data-testid="back"]',
      '.back-button',
      '.nav-back',
    ].join(', '),

    mobileSearch: [
      '[data-testid="mobile-search"]',
      '.mobile-search',
    ].join(', '),

    mobileCart: [
      '[data-testid="mobile-cart"]',
      '.mobile-cart',
    ].join(', '),

    bottomNav: [
      '[data-testid="bottom-nav"]',
      '.bottom-nav',
      '.mobile-bottom-nav',
    ].join(', '),

    productGrid: [
      '[data-testid="mobile-grid"]',
      '.mobile-grid',
      '.products-mobile',
    ].join(', '),

    swipeGallery: [
      '[data-testid="swipe-gallery"]',
      '.swipe-gallery',
      '.swiper',
    ].join(', '),

    // For checking desktop nav is hidden
    desktopNav: [
      '[data-testid="desktop-nav"]',
      '.desktop-nav',
      '.main-nav:not(.mobile)',
      'nav.desktop-only',
    ].join(', '),
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
    ].join(', '),

    skeleton: [
      '[data-testid="skeleton"]',
      '.skeleton',
      '.placeholder',
    ].join(', '),

    toast: [
      '[data-testid="toast"]',
      '.toast',
      '.notification',
    ].join(', '),

    modal: [
      '[data-testid="modal"]',
      '[role="dialog"]',
      '.modal',
      '.dialog',
    ].join(', '),

    modalOverlay: [
      '[data-testid="overlay"]',
      '.modal-overlay',
      '.overlay',
    ].join(', '),

    button: 'button, .btn, [data-testid="button"]',
    input: 'input, .input, [data-testid="input"]',
    select: 'select, .select, [data-testid="select"]',
    checkbox: 'input[type="checkbox"], .checkbox',
    radio: 'input[type="radio"], .radio',

    errorMessage: [
      '[data-testid="error"]',
      '.error',
      '.error-message',
    ].join(', '),

    successMessage: [
      '[data-testid="success"]',
      '.success',
      '.success-message',
    ].join(', '),
  },
};

export default SELECTORS;

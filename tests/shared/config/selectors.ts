/**
 * Centralized Selectors for Smart.md
 *
 * This file contains all CSS/XPath selectors used throughout the test framework.
 * Keeping selectors centralized makes maintenance easier when the UI changes.
 *
 * Selector Strategy Priority:
 * 1. data-testid attributes (most stable)
 * 2. Semantic HTML elements with unique attributes
 * 3. CSS classes (less stable, may change with redesigns)
 * 4. XPath (last resort)
 */

export const SELECTORS = {
  /**
   * Header Component Selectors
   */
  header: {
    container: 'header, .header, [data-testid="header"]',
    searchInput:
      '[data-testid="search-input"], input[name="search"], .search-input, input[type="search"], #search-input',
    searchButton:
      '[data-testid="search-btn"], button[type="submit"].search, .search-button, .search-submit',
    searchForm: '.search-form, form[role="search"], [data-testid="search-form"]',
    cartIcon: '.cart-icon, [data-testid="cart"], .header-cart, a[href*="cart"]',
    cartCount: '.cart-count, .cart-badge, [data-testid="cart-count"], .cart-quantity',
    languageSwitcher:
      '.lang-switch, [data-testid="lang"], .language-selector, .lang-dropdown',
    languageRO: 'a[href="/"], .lang-ro, [data-lang="ro"]',
    languageRU: 'a[href="/ru/"], .lang-ru, [data-lang="ru"]',
    hamburgerMenu:
      '.hamburger, .mobile-menu-btn, [data-testid="mobile-menu"], .burger-menu, .menu-toggle',
    logo: '.logo, [data-testid="logo"], .header-logo, a.logo',
    userMenu: '.user-menu, [data-testid="user-menu"], .account-menu',
    wishlist: '.wishlist, [data-testid="wishlist"], a[href*="wishlist"]',
  },

  /**
   * Navigation & Menu Selectors
   */
  navigation: {
    mainNav: 'nav, .main-nav, [data-testid="main-nav"], .navigation',
    categoryMenu: '.category-menu, .categories, [data-testid="categories"]',
    categoryLink: '.category-link, .nav-category, [data-testid="category-link"]',
    subcategoryLink: '.subcategory-link, .nav-subcategory',
    megaMenu: '.mega-menu, .dropdown-menu, [data-testid="mega-menu"]',
    breadcrumb: '.breadcrumb, [data-testid="breadcrumb"], .breadcrumbs',
  },

  /**
   * Search Results Page Selectors
   */
  searchResults: {
    container: '.search-results, [data-testid="search-results"], .products-list',
    productGrid: '.product-grid, .products-grid, [data-testid="product-grid"]',
    productCard: '.product-card, .product-item, [data-testid="product-card"], .product',
    productTitle: '.product-title, .product-name, [data-testid="product-title"]',
    productPrice: '.product-price, .price, [data-testid="product-price"], [itemprop="price"]',
    productImage: '.product-image, .product-img, [data-testid="product-image"]',
    productLink: '.product-link, a.product-card, [data-testid="product-link"]',
    resultCount: '.result-count, .products-count, [data-testid="result-count"]',
    noResults: '.no-results, .empty-results, [data-testid="no-results"]',
    pagination: '.pagination, [data-testid="pagination"]',
    loadMore: '.load-more, [data-testid="load-more"]',
  },

  /**
   * Catalog Page Selectors
   */
  catalog: {
    container: '.catalog, .category-page, [data-testid="catalog"]',
    productCard: '.product-card, .product-item, [data-testid="product-card"]',
    productTitle: '.product-title, .product-name',
    productPrice: '.product-price, .price',
    filterSidebar: '.filters, .filter-sidebar, [data-testid="filters"], .sidebar-filters',
    brandFilter: '[data-filter="brand"], .filter-brand, [data-testid="brand-filter"]',
    priceFilter: '[data-filter="price"], .filter-price, [data-testid="price-filter"]',
    colorFilter: '[data-filter="color"], .filter-color, [data-testid="color-filter"]',
    filterCheckbox: '.filter-checkbox, input[type="checkbox"]',
    filterLabel: '.filter-label, label',
    sortDropdown:
      '.sort-select, [data-testid="sort"], .sorting-dropdown, select.sort',
    sortOption: '.sort-option, option',
    activeFilters: '.active-filters, .filter-tags, [data-testid="active-filters"]',
    filterTag: '.filter-tag, .active-filter, [data-testid="filter-tag"]',
    clearFilters: '.clear-filters, [data-testid="clear-filters"], .reset-filters',
    productCount: '.product-count, .items-count, [data-testid="product-count"]',
  },

  /**
   * Product Detail Page Selectors
   */
  product: {
    container: '.product-detail, .product-page, [data-testid="product-detail"]',
    title: 'h1.product-title, h1[itemprop="name"], [data-testid="product-title"], h1',
    price:
      '.product-price, [itemprop="price"], [data-testid="product-price"], .price-current',
    oldPrice: '.old-price, .price-old, [data-testid="old-price"], .original-price',
    discount: '.discount, .discount-badge, [data-testid="discount"]',
    addToCart:
      '.add-to-cart, [data-testid="add-cart"], button.add-to-cart, .btn-add-cart',
    buyCredit:
      '.buy-credit, [data-testid="credit-btn"], .credit-button, .btn-credit, button:has-text("credit")',
    buyOneClick: '.buy-one-click, [data-testid="one-click"], .one-click-buy',
    quantity: '.quantity-input, [data-testid="quantity"], input[type="number"]',
    quantityPlus: '.qty-plus, .quantity-plus, [data-action="increase"]',
    quantityMinus: '.qty-minus, .quantity-minus, [data-action="decrease"]',
    gallery: '.product-gallery, [data-testid="gallery"], .product-images',
    mainImage: '.main-image, .product-main-image, [data-testid="main-image"]',
    thumbnails: '.thumbnails, .product-thumbs, [data-testid="thumbnails"]',
    description: '.product-description, [itemprop="description"], [data-testid="description"]',
    specifications: '.specifications, .product-specs, [data-testid="specifications"]',
    reviews: '.reviews, .product-reviews, [data-testid="reviews"]',
    availability: '.availability, .stock-status, [data-testid="availability"]',
    inStock: '.in-stock, .available',
    outOfStock: '.out-of-stock, .unavailable',
  },

  /**
   * Credit Calculator Modal Selectors
   */
  creditModal: {
    modal:
      '.credit-modal, [data-testid="credit-calculator"], .credit-calculator, .modal-credit',
    modalContent: '.modal-content, .credit-content',
    monthlyPayment:
      '.monthly-payment, .credit-amount, [data-testid="monthly-payment"], .payment-amount',
    totalAmount: '.total-amount, .credit-total, [data-testid="total-amount"]',
    providers:
      '.credit-provider, .bank-option, [data-testid="credit-provider"], .provider-item',
    providerName: '.provider-name, .bank-name',
    providerLogo: '.provider-logo, .bank-logo',
    termSelector:
      '.term-select, [data-testid="term"], .payment-term, select.term, .term-options',
    termOption: '.term-option, option, .term-item',
    interestRate: '.interest-rate, .rate, [data-testid="interest-rate"]',
    applyButton: '.apply-credit, [data-testid="apply-credit"], .btn-apply',
    closeButton:
      '.modal-close, [data-testid="close-modal"], .close-btn, button.close, .btn-close',
    overlay: '.modal-overlay, .modal-backdrop, [data-testid="modal-overlay"]',
  },

  /**
   * Shopping Cart Selectors
   */
  cart: {
    container: '.cart, .shopping-cart, [data-testid="cart-page"]',
    item: '.cart-item, [data-testid="cart-item"], .cart-product',
    itemTitle: '.item-title, .cart-item-title, [data-testid="item-title"]',
    itemPrice: '.item-price, .cart-item-price, [data-testid="item-price"]',
    itemImage: '.item-image, .cart-item-image',
    quantity: '.quantity-input, [data-testid="quantity"], input.qty',
    increaseBtn: '.qty-plus, [data-action="increase"], .btn-increase, .quantity-plus',
    decreaseBtn: '.qty-minus, [data-action="decrease"], .btn-decrease, .quantity-minus',
    removeBtn:
      '.remove-item, [data-action="remove"], .btn-remove, .delete-item, button.remove',
    subtotal: '.subtotal, .cart-subtotal, [data-testid="subtotal"]',
    total: '.cart-total, [data-testid="cart-total"], .total-price',
    emptyMessage:
      '.empty-cart, .cart-empty, [data-testid="empty-cart"], .cart-is-empty',
    checkoutBtn:
      '.checkout-btn, [data-testid="checkout"], .btn-checkout, a[href*="checkout"]',
    continueShopping: '.continue-shopping, [data-testid="continue-shopping"]',
    promoCode: '.promo-code, [data-testid="promo-code"], input.coupon',
    applyPromo: '.apply-promo, [data-testid="apply-promo"]',
  },

  /**
   * Cart Popup/Mini-Cart Selectors
   */
  cartPopup: {
    container: '.cart-popup, .mini-cart, [data-testid="cart-popup"]',
    message:
      '.cart-message, .added-message, [data-testid="cart-message"], .success-message',
    viewCart: '.view-cart, [data-testid="view-cart"], a.view-cart',
    continueBtn: '.continue, [data-testid="continue"]',
    closeBtn: '.close-popup, [data-testid="close-popup"]',
  },

  /**
   * Mobile-Specific Selectors
   */
  mobile: {
    menuDrawer: '.mobile-drawer, .mobile-nav, [data-testid="mobile-drawer"], .drawer',
    menuClose: '.menu-close, .drawer-close, [data-testid="menu-close"]',
    categoryLink: '.mobile-category, .nav-category, [data-testid="mobile-category"]',
    backButton: '.back-button, .nav-back, [data-testid="back"]',
    mobileSearch: '.mobile-search, [data-testid="mobile-search"]',
    mobileCart: '.mobile-cart, [data-testid="mobile-cart"]',
    bottomNav: '.bottom-nav, .mobile-bottom-nav, [data-testid="bottom-nav"]',
    productGrid: '.mobile-grid, .products-mobile, [data-testid="mobile-grid"]',
    swipeGallery: '.swipe-gallery, [data-testid="swipe-gallery"], .swiper',
  },

  /**
   * Common UI Elements
   */
  common: {
    loader: '.loader, .loading, [data-testid="loader"], .spinner',
    skeleton: '.skeleton, .placeholder, [data-testid="skeleton"]',
    toast: '.toast, .notification, [data-testid="toast"]',
    modal: '.modal, [data-testid="modal"], .dialog',
    modalOverlay: '.modal-overlay, .overlay, [data-testid="overlay"]',
    button: 'button, .btn, [data-testid="button"]',
    input: 'input, .input, [data-testid="input"]',
    select: 'select, .select, [data-testid="select"]',
    checkbox: 'input[type="checkbox"], .checkbox',
    radio: 'input[type="radio"], .radio',
    errorMessage: '.error, .error-message, [data-testid="error"]',
    successMessage: '.success, .success-message, [data-testid="success"]',
  },
};

export default SELECTORS;

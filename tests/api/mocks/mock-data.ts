/**
 * Mock Data for API tests
 * 
 * Used when there's no real REST API.
 * Data emulates Smart.md responses.
 */

import { SearchProduct, SearchResult } from '../actions/search.actions';
import { Cart, CartItem, AddToCartResult, PromoCodeResult } from '../actions/cart.actions';
import { Category, Product, CatalogPage } from '../actions/catalog.actions';
import { CreditOffer, CreditCalculation } from '../actions/credit.actions';

// === MOCK TYPES ===

export interface CreditBankInfo {
    id: string;
    name: string;
    logo?: string;
    minAmount: number;
    maxAmount: number;
    terms: number[];
}

// === PRODUCTS ===

export const mockProducts: SearchProduct[] = [
    {
        id: '12345',
        title: 'Apple iPhone 15 Pro Max 256GB Смартфон',
        price: 42990,
        currency: 'MDL',
        url: '/apple-iphone-15-pro-max-256gb',
        image: 'https://smart.md/image/iphone15.jpg',
        available: true,
        brand: 'Apple',
        category: 'Smartphones'
    },
    {
        id: '12346',
        title: 'Samsung Galaxy S24 Ultra 512GB Мобильный телефон',
        price: 38990,
        currency: 'MDL',
        url: '/samsung-galaxy-s24-ultra-512gb',
        image: 'https://smart.md/image/s24.jpg',
        available: true,
        brand: 'Samsung',
        category: 'Smartphones'
    },
    {
        id: '12347',
        title: 'Xiaomi 14 Pro 256GB Смартфон',
        price: 22990,
        currency: 'MDL',
        url: '/xiaomi-14-pro-256gb',
        image: 'https://smart.md/image/xiaomi14.jpg',
        available: true,
        brand: 'Xiaomi',
        category: 'Smartphones'
    },
    {
        id: '12348',
        title: 'MacBook Pro 14" M3 Pro Ноутбук',
        price: 89990,
        currency: 'MDL',
        url: '/macbook-pro-14-m3-pro',
        image: 'https://smart.md/image/macbook.jpg',
        available: true,
        brand: 'Apple',
        category: 'Laptops'
    },
    {
        id: '12349',
        title: 'Sony PlayStation 5 Slim Игровая консоль',
        price: 18990,
        currency: 'MDL',
        url: '/sony-playstation-5-slim',
        image: 'https://smart.md/image/ps5.jpg',
        available: true,
        brand: 'Sony',
        category: 'Gaming'
    },
    {
        id: '12350',
        title: 'Samsung QLED 65" 4K Smart TV Телевизор',
        price: 32990,
        currency: 'MDL',
        url: '/samsung-qled-65-4k',
        image: 'https://smart.md/image/tv.jpg',
        available: false,
        brand: 'Samsung',
        category: 'TV'
    },
    {
        id: '12351',
        title: 'Apple Watch Ultra 2 Умные часы',
        price: 15990,
        currency: 'MDL',
        url: '/apple-watch-ultra-2',
        image: 'https://smart.md/image/watch.jpg',
        available: true,
        brand: 'Apple',
        category: 'Smartwatches'
    },
    {
        id: '12352',
        title: 'AirPods Pro 2 Наушники',
        price: 5990,
        currency: 'MDL',
        url: '/airpods-pro-2',
        image: 'https://smart.md/image/airpods.jpg',
        available: true,
        brand: 'Apple',
        category: 'Headphones'
    },
];

// === CATEGORIES ===

export const mockCategories: Category[] = [
    {
        id: '1',
        name: 'Смартфоны',
        slug: 'smartphones',
        productCount: 234,
        children: [
            { id: '1-1', name: 'Apple', slug: 'apple-phones', productCount: 45 },
            { id: '1-2', name: 'Samsung', slug: 'samsung-phones', productCount: 67 },
            { id: '1-3', name: 'Xiaomi', slug: 'xiaomi-phones', productCount: 89 },
        ]
    },
    {
        id: '2',
        name: 'Ноутбуки',
        slug: 'laptops',
        productCount: 156,
        children: [
            { id: '2-1', name: 'MacBook', slug: 'macbook', productCount: 23 },
            { id: '2-2', name: 'Windows Ноутбуки', slug: 'windows-laptops', productCount: 133 },
        ]
    },
    {
        id: '3',
        name: 'Телевизоры',
        slug: 'tv',
        productCount: 89,
    },
    {
        id: '4',
        name: 'Игровые консоли',
        slug: 'gaming',
        productCount: 34,
    },
    {
        id: '5',
        name: 'Умные часы',
        slug: 'smartwatches',
        productCount: 67,
    },
    {
        id: '6',
        name: 'Наушники',
        slug: 'headphones',
        productCount: 123,
    },
];

// === CART ===

export const mockEmptyCart: Cart = {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    currency: 'MDL',
};

export const mockCartWithItems: Cart = {
    items: [
        {
            id: 'cart-1',
            productId: '12345',
            title: 'Apple iPhone 15 Pro Max 256GB',
            price: 42990,
            quantity: 1,
            totalPrice: 42990,
            image: 'https://smart.md/image/iphone15.jpg',
            available: true,
            maxQuantity: 10,
        },
        {
            id: 'cart-2',
            productId: '12352',
            title: 'AirPods Pro 2',
            price: 5990,
            quantity: 2,
            totalPrice: 11980,
            image: 'https://smart.md/image/airpods.jpg',
            available: true,
            maxQuantity: 5,
        },
    ],
    totalItems: 3,
    totalPrice: 54970,
    currency: 'MDL',
};

// === CREDIT OFFERS ===

export const mockBanks: CreditBankInfo[] = [
    {
        id: 'maib',
        name: 'MAIB',
        logo: 'https://smart.md/image/maib.png',
        minAmount: 1000,
        maxAmount: 100000,
        terms: [3, 6, 12, 18, 24],
    },
    {
        id: 'micb',
        name: 'Moldova Agroindbank',
        logo: 'https://smart.md/image/micb.png',
        minAmount: 2000,
        maxAmount: 150000,
        terms: [6, 12, 24, 36],
    },
    {
        id: 'victoriabank',
        name: 'Victoriabank',
        logo: 'https://smart.md/image/vb.png',
        minAmount: 1500,
        maxAmount: 120000,
        terms: [3, 6, 12, 18, 24, 36],
    },
];

export const mockCreditOffers: CreditOffer[] = [
    {
        bankId: 'maib',
        bankName: 'MAIB',
        monthlyPayment: 3750,
        interestRate: 0,
        totalAmount: 45000,
        termMonths: 12,
        currency: 'MDL',
    },
    {
        bankId: 'micb',
        bankName: 'Moldova Agroindbank',
        monthlyPayment: 2100,
        interestRate: 12.5,
        totalAmount: 50400,
        termMonths: 24,
        currency: 'MDL',
    },
    {
        bankId: 'victoriabank',
        bankName: 'Victoriabank',
        monthlyPayment: 1350,
        interestRate: 14.9,
        totalAmount: 48600,
        termMonths: 36,
        currency: 'MDL',
    },
];

// === PROMO CODES ===

export const mockPromoCodes: Record<string, PromoCodeResult> = {
    'WELCOME10': {
        valid: true,
        discount: 10,
        discountType: 'percent',
        message: 'Скидка 10% на первый заказ!',
        minOrderAmount: 500,
    },
    'SUMMER500': {
        valid: true,
        discount: 500,
        discountType: 'fixed',
        message: 'Скидка 500 MDL',
        minOrderAmount: 5000,
    },
    'INVALID': {
        valid: false,
        message: 'Промокод недействителен',
    },
    'EXPIRED': {
        valid: false,
        message: 'Срок действия промокода истёк',
    },
};

// === SEARCH SUGGESTIONS ===

export const mockSearchSuggestions: Record<string, string[]> = {
    'iph': ['iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 14'],
    'sam': ['Samsung Galaxy S24', 'Samsung TV', 'Samsung Galaxy Watch'],
    'mac': ['MacBook Pro', 'MacBook Air', 'Mac Mini', 'Mac Studio'],
    'xia': ['Xiaomi 14', 'Xiaomi Redmi Note', 'Xiaomi TV'],
};

// === ХЕЛПЕРЫ ===

/**
 * Поиск товаров по запросу
 */
export function searchMockProducts(query: string, limit: number = 10): SearchResult {
    const lowerQuery = query.toLowerCase();
    
    // Расширенный поиск с синонимами и переводами
    const searchTerms: Record<string, string[]> = {
        // Русские запросы
        'телефон': ['phone', 'iphone', 'samsung', 'xiaomi', 'смартфон'],
        'смартфон': ['phone', 'iphone', 'samsung', 'xiaomi'],
        'ноутбук': ['macbook', 'laptop', 'ноутбук'],
        'телевизор': ['tv', 'qled', 'телевизор'],
        'часы': ['watch', 'часы'],
        'наушники': ['airpods', 'наушники'],
        'консоль': ['playstation', 'xbox', 'консол'],
        // Английские запросы  
        'phone': ['phone', 'iphone', 'samsung', 'xiaomi'],
        'laptop': ['macbook', 'laptop', 'ноутбук'],
        'tv': ['tv', 'qled', 'телевизор'],
    };
    
    // Находим синонимы для запроса
    const expandedTerms = searchTerms[lowerQuery] || [lowerQuery];
    
    const filtered = mockProducts.filter(p => {
        const title = p.title.toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        
        // Проверяем все расширенные термины
        return expandedTerms.some(term => 
            title.includes(term) ||
            brand.includes(term) ||
            category.includes(term) ||
            title.includes(lowerQuery) ||
            brand.includes(lowerQuery) ||
            category.includes(lowerQuery)
        );
    });

    return {
        products: filtered.slice(0, limit),
        total: filtered.length,
        query,
        page: 1,
        pageSize: limit,
    };
}

/**
 * Получить товары по категории
 */
export function getCategoryMockProducts(categorySlug: string): Product[] {
    const categoryMap: Record<string, string> = {
        'smartphones': 'Smartphones',
        'laptops': 'Laptops',
        'tv': 'TV',
        'gaming': 'Gaming',
        'smartwatches': 'Smartwatches',
        'headphones': 'Headphones',
    };

    const categoryName = categoryMap[categorySlug];
    if (!categoryName) return [];

    return mockProducts
        .filter(p => p.category === categoryName)
        .map(p => ({
            ...p,
            available: p.available ?? true,
            specifications: {},
        }));
}

/**
 * Получить товар по ID
 */
export function getMockProductById(id: string | number): Product | null {
    const product = mockProducts.find(p => String(p.id) === String(id));
    if (!product) return null;

    return {
        ...product,
        available: product.available ?? true,
        description: `Описание товара ${product.title}`,
        specifications: {
            'Бренд': product.brand || 'N/A',
            'Категория': product.category || 'N/A',
        },
    };
}

/**
 * Рассчитать кредит
 */
export function calculateMockCredit(
    amount: number,
    term: number,
    bankId?: string
): CreditCalculation {
    // Простой расчёт для демо
    const baseRate = bankId === 'maib' ? 0 : 12.5;
    const monthlyRate = baseRate / 100 / 12;
    
    let monthlyPayment: number;
    let totalAmount: number;
    
    if (baseRate === 0) {
        monthlyPayment = amount / term;
        totalAmount = amount;
    } else {
        monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                         (Math.pow(1 + monthlyRate, term) - 1);
        totalAmount = monthlyPayment * term;
    }

    return {
        productPrice: amount,
        offers: mockCreditOffers.filter(o => !bankId || o.bankId === bankId),
        availableBanks: mockBanks.map(b => ({ id: b.id, name: b.name, logo: b.logo })),
        availableTerms: [3, 6, 12, 18, 24, 36],
        currency: 'MDL',
    };
}

/**
 * Добавить товар в mock-корзину
 */
export function addToMockCart(
    cart: Cart,
    productId: string | number,
    quantity: number = 1
): AddToCartResult {
    const product = mockProducts.find(p => String(p.id) === String(productId));
    
    if (!product) {
        return {
            success: false,
            cart,
            message: 'Товар не найден',
        };
    }

    if (!product.available) {
        return {
            success: false,
            cart,
            message: 'Товар недоступен',
        };
    }

    // Проверяем, есть ли уже в корзине
    const existingItem = cart.items.find(item => String(item.productId) === String(productId));
    
    let newCart: Cart;
    let addedItem: CartItem;

    if (existingItem) {
        // Увеличиваем количество
        const newQuantity = existingItem.quantity + quantity;
        addedItem = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: product.price * newQuantity,
        };
        
        newCart = {
            ...cart,
            items: cart.items.map(item => 
                String(item.productId) === String(productId) ? addedItem : item
            ),
            totalItems: cart.totalItems + quantity,
            totalPrice: cart.totalPrice + (product.price * quantity),
        };
    } else {
        // Добавляем новый товар
        addedItem = {
            id: `cart-${Date.now()}`,
            productId,
            title: product.title,
            price: product.price,
            quantity,
            totalPrice: product.price * quantity,
            image: product.image,
            available: true,
            maxQuantity: 10,
        };
        
        newCart = {
            ...cart,
            items: [...cart.items, addedItem],
            totalItems: cart.totalItems + quantity,
            totalPrice: cart.totalPrice + (product.price * quantity),
        };
    }

    return {
        success: true,
        cart: newCart,
        addedItem,
        message: 'Товар добавлен в корзину',
    };
}

export default {
    products: mockProducts,
    categories: mockCategories,
    emptyCart: mockEmptyCart,
    cartWithItems: mockCartWithItems,
    banks: mockBanks,
    creditOffers: mockCreditOffers,
    promoCodes: mockPromoCodes,
    searchSuggestions: mockSearchSuggestions,
    // Functions
    searchProducts: searchMockProducts,
    getCategoryProducts: getCategoryMockProducts,
    getProductById: getMockProductById,
    calculateCredit: calculateMockCredit,
    addToCart: addToMockCart,
};

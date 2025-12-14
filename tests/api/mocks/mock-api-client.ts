/**
 * Mock API Client для тестов
 * 
 * Использует mock-данные вместо реальных HTTP запросов.
 * Полезно для unit-тестов и когда API недоступен.
 */

import { ApiClient, ApiResponse, ApiClientConfig } from '../client/apiClient';
import mockData, {
    searchMockProducts,
    getCategoryMockProducts,
    getMockProductById,
    calculateMockCredit,
    addToMockCart,
    mockEmptyCart,
    mockCategories,
    mockBanks,
    mockCreditOffers,
    mockPromoCodes,
    mockSearchSuggestions,
} from './mock-data';
import { Cart } from '../actions/cart.actions';

// Симуляция задержки сети
async function simulateDelay(minMs: number = 50, maxMs: number = 200): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
}

// Текущее состояние mock-сессии
interface MockState {
    cart: Cart;
    appliedPromo: string | null;
}

const mockState: MockState = {
    cart: { ...mockEmptyCart },
    appliedPromo: null,
};

/**
 * Mock API роутер
 */
async function handleMockRequest<T>(
    method: string,
    url: string,
    params?: Record<string, string>,
    data?: unknown
): Promise<ApiResponse<T>> {
    await simulateDelay();

    const path = url.replace(/^\//, '');

    // === SEARCH ===
    if (path === 'api/search' && method === 'GET') {
        const query = params?.q || '';
        const limit = parseInt(params?.limit || '10');
        const minPrice = params?.price_min ? parseInt(params.price_min) : undefined;
        const maxPrice = params?.price_max ? parseInt(params.price_max) : undefined;
        const category = params?.category;
        
        let result = searchMockProducts(query, 100); // Получаем все результаты сначала
        
        // Применяем фильтр по цене
        if (minPrice !== undefined || maxPrice !== undefined) {
            result.products = result.products.filter(p => {
                if (minPrice !== undefined && p.price < minPrice) return false;
                if (maxPrice !== undefined && p.price > maxPrice) return false;
                return true;
            });
            result.total = result.products.length;
        }
        
        // Применяем фильтр по категории
        if (category) {
            result.products = result.products.filter(p => 
                p.category?.toLowerCase().includes(category.toLowerCase())
            );
            result.total = result.products.length;
        }
        
        // Ограничиваем результаты
        result.products = result.products.slice(0, limit);
        
        return createResponse(result as T, 200);
    }

    if (path === 'api/search/suggest' && method === 'GET') {
        const query = params?.q?.toLowerCase() || '';
        const suggestions = Object.entries(mockSearchSuggestions)
            .filter(([key]) => query.startsWith(key))
            .flatMap(([, values]) => values.map(text => ({ text, type: 'product' })));
        return createResponse(suggestions as T, 200);
    }

    // === CATEGORIES ===
    if (path === 'api/categories' && method === 'GET') {
        return createResponse(mockCategories as T, 200);
    }

    if (path.match(/^api\/category\/[\w-]+$/) && method === 'GET') {
        const slug = path.split('/').pop()!;
        const category = mockCategories.find(c => c.slug === slug);
        if (category) {
            return createResponse(category as T, 200);
        }
        return createResponse({ error: 'Not found' } as T, 404);
    }

    if (path.match(/^api\/category\/[\w-]+\/products$/) && method === 'GET') {
        const slug = path.split('/')[2];
        const products = getCategoryMockProducts(slug);
        const page = parseInt(params?.page || '1');
        const limit = parseInt(params?.limit || '20');
        return createResponse({
            products,
            total: products.length,
            page,
            pageSize: limit,
            filters: [],
        } as T, 200);
    }
    
    // Альтернативный путь для категории (smartphone -> smartphones)
    if (path.match(/^api\/category\/\w+$/) && method === 'GET' && params?.products === 'true') {
        const slug = path.split('/').pop()!;
        const normalizedSlug = slug.endsWith('s') ? slug : slug + 's';
        const products = getCategoryMockProducts(normalizedSlug);
        return createResponse({
            products,
            total: products.length,
            page: 1,
            pageSize: 20,
            filters: [],
        } as T, 200);
    }

    // === PRODUCTS ===
    if (path.match(/^api\/product\/[\w-]+$/) && method === 'GET') {
        const id = path.split('/').pop()!;
        const product = getMockProductById(id);
        if (product) {
            return createResponse(product as T, 200);
        }
        return createResponse({ error: 'Not found' } as T, 404);
    }

    // === CART ===
    if (path === 'api/cart' && method === 'GET') {
        return createResponse(mockState.cart as T, 200);
    }
    
    if (path === 'api/cart' && method === 'DELETE') {
        mockState.cart = { ...mockEmptyCart };
        return createResponse(mockState.cart as T, 200);
    }

    if (path === 'api/cart/add' && method === 'POST') {
        const body = data as { product_id: string; quantity?: number };
        const result = addToMockCart(mockState.cart, body.product_id, body.quantity || 1);
        mockState.cart = result.cart;
        return createResponse(result as T, result.success ? 200 : 400);
    }

    if (path === 'api/cart/clear' && method === 'POST') {
        mockState.cart = { ...mockEmptyCart };
        return createResponse(mockState.cart as T, 200);
    }

    if (path.match(/^api\/cart\/item\/[\w-]+$/) && method === 'DELETE') {
        const itemId = path.split('/').pop()!;
        mockState.cart = {
            ...mockState.cart,
            items: mockState.cart.items.filter(item => String(item.id) !== itemId),
        };
        // Пересчитываем totals
        mockState.cart.totalItems = mockState.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        mockState.cart.totalPrice = mockState.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        return createResponse(mockState.cart as T, 200);
    }

    if (path.match(/^api\/cart\/item\/[\w-]+$/) && method === 'PUT') {
        const itemId = path.split('/').pop()!;
        const body = data as { quantity: number };
        mockState.cart = {
            ...mockState.cart,
            items: mockState.cart.items.map(item => {
                if (String(item.id) === itemId) {
                    return {
                        ...item,
                        quantity: body.quantity,
                        totalPrice: item.price * body.quantity,
                    };
                }
                return item;
            }),
        };
        // Пересчитываем totals
        mockState.cart.totalItems = mockState.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        mockState.cart.totalPrice = mockState.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        return createResponse(mockState.cart as T, 200);
    }

    // === PROMO CODES ===
    if (path === 'api/cart/promo' && method === 'POST') {
        const body = data as { code: string };
        const promo = mockPromoCodes[body.code.toUpperCase()];
        if (promo) {
            if (promo.valid) {
                mockState.appliedPromo = body.code;
                // Применяем скидку к корзине
                let discountAmount = 0;
                if (promo.discountType === 'percent' && promo.discount) {
                    discountAmount = Math.round(mockState.cart.totalPrice * promo.discount / 100);
                } else if (promo.discountType === 'fixed' && promo.discount) {
                    discountAmount = promo.discount;
                }
                mockState.cart = {
                    ...mockState.cart,
                    discount: discountAmount,
                    promoCode: body.code,
                };
            }
            return createResponse(promo as T, promo.valid ? 200 : 400);
        }
        return createResponse({
            valid: false,
            message: 'Промокод не найден',
        } as T, 404);
    }

    // === CREDIT ===
    if (path === 'api/credit/banks' && method === 'GET') {
        return createResponse(mockBanks as T, 200);
    }

    if (path === 'api/credit/offers' && method === 'GET') {
        const productId = params?.product_id;
        const productPrice = params?.price ? parseInt(params.price) : undefined;
        
        let price = productPrice;
        if (!price && productId) {
            const product = getMockProductById(productId);
            price = product?.price;
        }
        price = price || 10000; // default
        
        // Генерируем офферы для конкретной цены
        const offers = mockBanks.map((bank, idx) => {
            const terms = [12, 24, 36];
            const term = terms[idx % terms.length];
            const rate = idx === 0 ? 0 : (12 + idx * 2); // MAIB = 0%, остальные с процентами
            const monthlyPayment = rate === 0 
                ? Math.round(price! / term) 
                : Math.round(price! * (1 + rate / 100) / term);
            
            return {
                bankId: bank.id,
                bankName: bank.name,
                monthlyPayment,
                interestRate: rate,
                totalAmount: monthlyPayment * term,
                termMonths: term,
                currency: 'MDL',
            };
        });
        
        return createResponse(offers as T, 200);
    }

    if (path === 'api/credit/calculate' && method === 'POST') {
        const body = data as { amount: number; term: number; bank_id?: string };
        const calculation = calculateMockCredit(body.amount, body.term, body.bank_id);
        return createResponse(calculation as T, 200);
    }
    
    if ((path === 'api/credit/calculate' || path.startsWith('api/credit/calculate')) && method === 'GET') {
        const amount = parseInt(params?.amount || params?.product_price || '10000');
        const term = parseInt(params?.term || '12');
        const bankId = params?.bank_id;
        
        // Минимальная сумма кредита
        const MIN_CREDIT_AMOUNT = 1000;
        
        if (amount < MIN_CREDIT_AMOUNT) {
            // Кредит недоступен для малых сумм
            const calculation = {
                productPrice: amount,
                offers: [],
                availableBanks: [],
                availableTerms: [],
                currency: 'MDL',
                error: `Минимальная сумма кредита ${MIN_CREDIT_AMOUNT} MDL`,
            };
            return createResponse(calculation as T, 200);
        }
        
        // Генерируем офферы для конкретной суммы
        const offers = mockBanks
            .filter(bank => !bankId || bank.id === bankId)
            .map((bank, idx) => {
                const rate = bank.id === 'maib' ? 0 : (12 + idx * 2);
                const monthlyPayment = rate === 0 
                    ? Math.round(amount / term) 
                    : Math.round(amount * (1 + rate / 100) / term);
                
                return {
                    bankId: bank.id,
                    bankName: bank.name,
                    monthlyPayment,
                    interestRate: rate,
                    totalAmount: monthlyPayment * term,
                    termMonths: term,
                    currency: 'MDL',
                };
            });
        
        const calculation = {
            productPrice: amount,
            offers,
            availableBanks: mockBanks.map(b => ({ id: b.id, name: b.name, logo: b.logo })),
            availableTerms: [3, 6, 12, 18, 24, 36],
            currency: 'MDL',
        };
        
        return createResponse(calculation as T, 200);
    }

    // === DEFAULT: 404 ===
    console.warn(`[MockApi] Unknown route: ${method} ${path}`);
    return createResponse({ error: 'Not found', path } as T, 404);
}

function createResponse<T>(data: T, status: number): ApiResponse<T> {
    return {
        data,
        status,
        headers: {
            'content-type': 'application/json',
            'x-mock': 'true',
        },
        config: { url: '', method: 'GET' },
    };
}

/**
 * Создаёт Mock API Client
 */
export class MockApiClient extends ApiClient {
    constructor(config: Partial<ApiClientConfig> = {}) {
        super({
            baseURL: 'https://smart.md',
            timeout: 5000,
            humanLike: false,
            ...config,
        });
    }

    async get<T>(url: string, options?: { params?: Record<string, string> }): Promise<ApiResponse<T>> {
        return handleMockRequest<T>('GET', url, options?.params);
    }

    async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        return handleMockRequest<T>('POST', url, undefined, data);
    }

    async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        return handleMockRequest<T>('PUT', url, undefined, data);
    }

    async delete<T>(url: string): Promise<ApiResponse<T>> {
        return handleMockRequest<T>('DELETE', url);
    }
}

/**
 * Сброс состояния mock-сессии
 */
export function resetMockState(): void {
    mockState.cart = { ...mockEmptyCart };
    mockState.appliedPromo = null;
}

/**
 * Установить начальное состояние корзины
 */
export function setMockCart(cart: Cart): void {
    mockState.cart = { ...cart };
}

/**
 * Получить текущее состояние mock
 */
export function getMockState(): MockState {
    return { ...mockState };
}

export default MockApiClient;

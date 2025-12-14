/**
 * Credit Actions - business operations for credit
 * 
 * Operations for working with credit calculators and bank offers.
 */

import { ApiClient } from '../client/apiClient';

// === TYPES ===

export interface Bank {
    id: string | number;
    name: string;
    logo?: string;
    minRate?: number;
    maxRate?: number;
}

export interface CreditOffer {
    bankId: string | number;
    bankName: string;
    monthlyPayment: number;
    totalAmount: number;
    interestRate: number;
    termMonths: number;
    currency: string;
    downPayment?: number;
    downPaymentPercent?: number;
    commission?: number;
    insuranceRequired?: boolean;
}

export interface CreditCalculation {
    productPrice: number;
    offers: CreditOffer[];
    availableBanks: Bank[];
    availableTerms: number[];
    minDownPayment?: number;
    currency: string;
}

export interface CreditEligibility {
    eligible: boolean;
    minIncome?: number;
    requiredDocuments?: string[];
    restrictions?: string[];
}

// === ACTIONS ===

/**
 * Получить список доступных банков-партнёров
 */
export async function getAvailableBanks(api: ApiClient): Promise<Bank[]> {
    // smart.md doesn't have /api/credit/banks endpoint
    // Based on actual banks shown in credit modal: Maib and STAR Card
    return [
        {
            id: 'maib',
            name: 'Maib',
            minRate: 0,
            maxRate: 15
        },
        {
            id: 'starcard',
            name: 'STAR Card',
            minRate: 0,
            maxRate: 15
        }
    ];
}

/**
 * Рассчитать кредитные предложения для товара
 */
export async function calculateCredit(
    api: ApiClient,
    productId: string | number,
    options: {
        termMonths?: number;
        downPayment?: number;
        bankId?: string | number;
    } = {}
): Promise<CreditCalculation> {
    // smart.md doesn't have /api/credit/calculate endpoint
    // Instead, credit info is embedded in product page HTML
    // Parse product page to extract credit information
    
    const response = await api.get<string>(`/product/${productId}`);
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    // Import cheerio for HTML parsing
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    // Extract product price from page
    let productPrice = 0;
    const priceText = $('.custom_product_price').first().text();
    const priceMatch = priceText.match(/(\d+[\s,]?\d*)/);
    if (priceMatch) {
        productPrice = parseFloat(priceMatch[1].replace(/[\s,]/g, ''));
    }
    
    // Extract minimum monthly payment from credit button
    let minMonthlyPayment = 0;
    $('button, a').each((i: number, el: any) => {
        const text = $(el).text();
        if (text.includes('кредит') || text.includes('credit')) {
            const paymentMatch = text.match(/(\d+)\s*лей/);
            if (paymentMatch) {
                minMonthlyPayment = parseInt(paymentMatch[1]);
            }
        }
    });
    
    // Create mock credit offers based on typical terms
    const offers: CreditOffer[] = [];
    const terms = [8, 12, 18, 24, 36, 48];
    
    terms.forEach(term => {
        if (minMonthlyPayment > 0) {
            offers.push({
                bankId: 'smart_credit',
                bankName: 'Smart Credit',
                monthlyPayment: Math.round(productPrice / term * 1.15), // Rough estimate
                totalAmount: Math.round(productPrice * 1.15),
                interestRate: 15,
                termMonths: term,
                currency: 'MDL'
            });
        }
    });
    
    return {
        productPrice,
        offers,
        availableBanks: [],
        availableTerms: terms,
        minDownPayment: 0,
        currency: 'MDL'
    };
}

/**
 * Рассчитать кредит по сумме (без привязки к товару)
 */
export async function calculateCreditByAmount(
    api: ApiClient,
    amount: number,
    termMonths: number,
    downPayment: number = 0
): Promise<CreditCalculation> {
    // smart.md doesn't have this API endpoint
    // Create mock calculation based on amount
    
    const loanAmount = amount - downPayment;
    const interestRate = 0.15; // 15% annual rate
    const monthlyRate = interestRate / 12;
    const numPayments = termMonths;
    
    // Calculate monthly payment using loan formula
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) 
                          / (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const totalAmount = monthlyPayment * termMonths;
    
    const offers: CreditOffer[] = [{
        bankId: 'smart_credit',
        bankName: 'Smart Credit',
        monthlyPayment: Math.round(monthlyPayment),
        totalAmount: Math.round(totalAmount),
        interestRate: 15,
        termMonths,
        currency: 'MDL',
        downPayment
    }];
    
    return {
        productPrice: amount,
        offers,
        availableBanks: [],
        availableTerms: [termMonths],
        minDownPayment: downPayment,
        currency: 'MDL'
    };
}

/**
 * Получить детали кредитного предложения конкретного банка
 */
export async function getBankOffer(
    api: ApiClient,
    bankId: string | number,
    productId: string | number,
    termMonths: number
): Promise<CreditOffer | null> {
    try {
        const response = await api.get<CreditOffer>(`/api/credit/bank/${bankId}/offer`, {
            params: {
                product_id: String(productId),
                term: String(termMonths)
            }
        });
        return response.data;
    } catch {
        return null;
    }
}

/**
 * Проверить доступность кредита для товара
 */
export async function checkCreditAvailability(
    api: ApiClient,
    productId: string | number
): Promise<CreditEligibility> {
    const response = await api.get<CreditEligibility>(`/api/credit/availability/${productId}`);
    return response.data;
}

/**
 * Получить доступные сроки кредитования
 */
export async function getAvailableTerms(
    api: ApiClient,
    productPrice: number
): Promise<number[]> {
    const response = await api.get<{ terms: number[] }>('/api/credit/terms', {
        params: { price: String(productPrice) }
    });
    return response.data.terms || [3, 6, 12, 18, 24, 36];
}

/**
 * Получить минимальный первоначальный взнос
 */
export async function getMinDownPayment(
    api: ApiClient,
    productPrice: number,
    bankId?: string | number
): Promise<{ amount: number; percent: number }> {
    const params: Record<string, string> = { price: String(productPrice) };
    if (bankId) params.bank_id = String(bankId);

    const response = await api.get<{ minDownPayment: number; minDownPaymentPercent: number }>(
        '/api/credit/min-down-payment',
        { params }
    );

    return {
        amount: response.data.minDownPayment || 0,
        percent: response.data.minDownPaymentPercent || 0
    };
}

// === HELPERS ===

function normalizeCreditCalculation(data: unknown): CreditCalculation {
    const result = data as Record<string, unknown>;
    
    return {
        productPrice: (result.productPrice as number) || (result.price as number) || 0,
        offers: (result.offers as CreditOffer[]) || [],
        availableBanks: (result.banks as Bank[]) || (result.availableBanks as Bank[]) || [],
        availableTerms: (result.terms as number[]) || (result.availableTerms as number[]) || [],
        minDownPayment: result.minDownPayment as number | undefined,
        currency: (result.currency as string) || 'MDL'
    };
}

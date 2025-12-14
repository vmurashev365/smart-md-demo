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
    const response = await api.get<{ banks: Bank[] } | Bank[]>('/api/credit/banks');
    
    if (Array.isArray(response.data)) {
        return response.data;
    }
    return response.data.banks || [];
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
    const params: Record<string, string> = {
        product_id: String(productId)
    };
    
    if (options.termMonths) params.term = String(options.termMonths);
    if (options.downPayment) params.down_payment = String(options.downPayment);
    if (options.bankId) params.bank_id = String(options.bankId);

    const response = await api.get<CreditCalculation>('/api/credit/calculate', { params });
    return normalizeCreditCalculation(response.data);
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
    const response = await api.get<CreditCalculation>('/api/credit/calculate', {
        params: {
            amount: String(amount),
            term: String(termMonths),
            down_payment: String(downPayment)
        }
    });
    return normalizeCreditCalculation(response.data);
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

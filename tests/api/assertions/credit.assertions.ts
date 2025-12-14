/**
 * Credit Assertions - business invariants for credit
 */

import { expect } from '@playwright/test';
import { Bank, CreditOffer, CreditCalculation, CreditEligibility } from '../actions/credit.actions';

// === BANKS ===

/**
 * Проверить, что банки-партнёры доступны
 */
export function expectBanksAvailable(banks: Bank[]): void {
    expect(banks.length, 'Должны быть доступны банки-партнёры').toBeGreaterThan(0);
}

/**
 * Проверить структуру данных банка
 */
export function expectBankStructureValid(bank: Bank): void {
    expect(bank.id, 'Банк должен иметь ID').toBeDefined();
    expect(bank.name, 'Банк должен иметь название').toBeTruthy();
}

/**
 * Проверить, что конкретный банк присутствует
 */
export function expectBankExists(banks: Bank[], bankName: string): void {
    const bank = banks.find(b => 
        b.name.toLowerCase().includes(bankName.toLowerCase())
    );
    expect(bank, `Банк "${bankName}" должен быть в списке`).toBeDefined();
}

// === CREDIT OFFERS ===

/**
 * Проверить, что есть кредитные предложения
 */
export function expectCreditOffersAvailable(calculation: CreditCalculation): void {
    expect(
        calculation.offers.length,
        'Должны быть кредитные предложения'
    ).toBeGreaterThan(0);
}

/**
 * Проверить структуру кредитного предложения
 */
export function expectCreditOfferStructureValid(offer: CreditOffer): void {
    expect(offer.bankId, 'Предложение должно иметь ID банка').toBeDefined();
    expect(offer.bankName, 'Предложение должно иметь название банка').toBeTruthy();
    expect(typeof offer.monthlyPayment, 'Ежемесячный платёж должен быть числом').toBe('number');
    expect(offer.monthlyPayment, 'Ежемесячный платёж должен быть > 0').toBeGreaterThan(0);
    expect(typeof offer.termMonths, 'Срок должен быть числом').toBe('number');
    expect(offer.termMonths, 'Срок должен быть > 0').toBeGreaterThan(0);
}

/**
 * Проверить математику кредита (базовая проверка)
 */
export function expectCreditMathValid(offer: CreditOffer, productPrice: number): void {
    // Total payment amount = monthly payment * term
    const totalPayments = offer.monthlyPayment * offer.termMonths;
    
    // Minimum amount (without interest) = price - down payment
    const principalAmount = productPrice - (offer.downPayment || 0);
    
    // Total amount should be >= principal amount (interest cannot be negative)
    expect(
        totalPayments,
        'Общая сумма выплат должна быть >= суммы кредита'
    ).toBeGreaterThanOrEqual(principalAmount * 0.99); // 1% tolerance
    
    // Overpayment should not be too large (reasonable limit)
    const overpayment = totalPayments - principalAmount;
    const overpaymentPercent = (overpayment / principalAmount) * 100;
    
    expect(
        overpaymentPercent,
        'Переплата не должна превышать 100% от суммы'
    ).toBeLessThanOrEqual(100);
}

/**
 * Проверить, что процентная ставка в разумных пределах
 */
export function expectInterestRateReasonable(offer: CreditOffer): void {
    expect(offer.interestRate, 'Ставка должна быть >= 0').toBeGreaterThanOrEqual(0);
    expect(offer.interestRate, 'Ставка не должна превышать 50%').toBeLessThanOrEqual(50);
}

/**
 * Проверить, что срок кредита стандартный
 */
export function expectTermMonthsStandard(termMonths: number): void {
    const standardTerms = [3, 6, 9, 12, 18, 24, 36, 48, 60];
    expect(
        standardTerms.includes(termMonths),
        `Срок ${termMonths} должен быть стандартным`
    ).toBe(true);
}

// === CALCULATOR ===

/**
 * Проверить структуру расчёта кредита
 */
export function expectCreditCalculationStructureValid(calc: CreditCalculation): void {
    expect(calc).toHaveProperty('offers');
    expect(calc).toHaveProperty('productPrice');
    expect(calc).toHaveProperty('currency');
    expect(Array.isArray(calc.offers)).toBe(true);
    expect(typeof calc.productPrice).toBe('number');
}

/**
 * Проверить, что доступны разные сроки
 */
export function expectMultipleTermsAvailable(calc: CreditCalculation): void {
    expect(
        calc.availableTerms.length,
        'Должны быть доступны разные сроки кредитования'
    ).toBeGreaterThan(1);
}

/**
 * Проверить, что предложения отсортированы по ежемесячному платежу
 */
export function expectOffersSortedByMonthlyPayment(offers: CreditOffer[]): void {
    for (let i = 1; i < offers.length; i++) {
        expect(
            offers[i].monthlyPayment,
            'Предложения должны быть отсортированы по платежу'
        ).toBeGreaterThanOrEqual(offers[i - 1].monthlyPayment);
    }
}

/**
 * Проверить, что есть предложение от конкретного банка
 */
export function expectOfferFromBank(offers: CreditOffer[], bankName: string): void {
    const offer = offers.find(o => 
        o.bankName.toLowerCase().includes(bankName.toLowerCase())
    );
    expect(offer, `Должно быть предложение от "${bankName}"`).toBeDefined();
}

// === CREDIT AVAILABILITY ===

/**
 * Проверить, что кредит доступен для товара
 */
export function expectCreditEligible(eligibility: CreditEligibility): void {
    expect(eligibility.eligible, 'Кредит должен быть доступен').toBe(true);
}

/**
 * Проверить, что кредит НЕ доступен
 */
export function expectCreditNotEligible(eligibility: CreditEligibility): void {
    expect(eligibility.eligible, 'Кредит не должен быть доступен').toBe(false);
    expect(
        eligibility.restrictions?.length || eligibility.minIncome,
        'Должны быть указаны причины недоступности'
    ).toBeTruthy();
}

/**
 * Проверить минимальный первоначальный взнос
 */
export function expectMinDownPaymentReasonable(
    minDownPayment: { amount: number; percent: number },
    productPrice: number
): void {
    // Down payment should not exceed 50% of the price
    expect(
        minDownPayment.percent,
        'Минимальный взнос не должен превышать 50%'
    ).toBeLessThanOrEqual(50);
    
    // Check amount and percentage correspondence
    const expectedAmount = productPrice * (minDownPayment.percent / 100);
    expect(
        Math.abs(minDownPayment.amount - expectedAmount),
        'Сумма взноса должна соответствовать проценту'
    ).toBeLessThan(1); // tolerance
}

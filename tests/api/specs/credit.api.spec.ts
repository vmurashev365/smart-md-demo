/**
 * Credit API Spec - регрессионные тесты кредитного калькулятора
 */

import { test, expect } from '@playwright/test';
import { createApiClient, ApiClient } from '../client/apiClient';

// Actions
import {
    getAvailableBanks,
    calculateCredit,
    calculateCreditByAmount,
    getBankOffer,
    checkCreditAvailability,
    getAvailableTerms,
    getMinDownPayment
} from '../actions/credit.actions';

import { getCategoryProducts } from '../actions/catalog.actions';

// Assertions
import {
    expectBanksAvailable,
    expectBankStructureValid,
    expectBankExists,
    expectCreditOffersAvailable,
    expectCreditOfferStructureValid,
    expectCreditMathValid,
    expectInterestRateReasonable,
    expectTermMonthsStandard,
    expectCreditCalculationStructureValid,
    expectMultipleTermsAvailable,
    expectCreditEligible,
    expectMinDownPaymentReasonable
} from '../assertions/credit.assertions';

test.describe('Credit API', () => {
    let api: ApiClient;
    let testProductId: string | number;
    let testProductPrice: number;

    test.beforeAll(async () => {
        api = await createApiClient();
        
        // Get a real product for tests
        const catalog = await getCategoryProducts(api, 'smartphone', { limit: 1 });
        if (catalog.products.length > 0) {
            testProductId = catalog.products[0].id;
            testProductPrice = catalog.products[0].price;
        }
    });

    test.afterAll(async () => {
        await api.dispose();
    });

    test.describe('Banks', () => {
        test('should return list of partner banks', async () => {
            const banks = await getAvailableBanks(api);
            
            expectBanksAvailable(banks);
            
            for (const bank of banks) {
                expectBankStructureValid(bank);
            }
        });

        test('should include major Moldovan banks', async () => {
            const banks = await getAvailableBanks(api);
            
            // Check presence of Maib or STAR Card (actual banks on smart.md)
            const knownBanks = ['maib', 'star card', 'starcard'];
            const hasKnownBank = banks.some(b => 
                knownBanks.some(kb => b.name.toLowerCase().includes(kb))
            );
            
            expect(hasKnownBank, 'Должен быть хотя бы один известный банк (Maib или STAR Card)').toBe(true);
        });
    });

    test.describe('Credit Calculator', () => {
        test('should calculate credit offers for product', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const calculation = await calculateCredit(api, testProductId);
            
            expectCreditCalculationStructureValid(calculation);
            expectCreditOffersAvailable(calculation);
        });

        test('should return valid credit offers structure', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const calculation = await calculateCredit(api, testProductId);
            
            for (const offer of calculation.offers) {
                expectCreditOfferStructureValid(offer);
                expectInterestRateReasonable(offer);
            }
        });

        test('should calculate credit math correctly', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const calculation = await calculateCredit(api, testProductId);
            
            for (const offer of calculation.offers) {
                expectCreditMathValid(offer, calculation.productPrice);
            }
        });

        test('should support different terms', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const calc12 = await calculateCredit(api, testProductId, { termMonths: 12 });
            const calc24 = await calculateCredit(api, testProductId, { termMonths: 24 });
            
            // With a longer term, monthly payment should be smaller
            if (calc12.offers.length > 0 && calc24.offers.length > 0) {
                expect(
                    calc24.offers[0].monthlyPayment,
                    'Платёж на 24 мес. должен быть меньше чем на 12 мес.'
                ).toBeLessThan(calc12.offers[0].monthlyPayment);
            }
        });
    });

    test.describe('Credit by Amount', () => {
        test('should calculate credit for arbitrary amount', async () => {
            const amount = 10000;
            const termMonths = 12;
            
            const calculation = await calculateCreditByAmount(api, amount, termMonths);
            
            expectCreditCalculationStructureValid(calculation);
            expect(calculation.productPrice).toBe(amount);
        });

        test('should respect down payment', async () => {
            const amount = 10000;
            const downPayment = 2000;
            const termMonths = 12;
            
            const withoutDown = await calculateCreditByAmount(api, amount, termMonths, 0);
            const withDown = await calculateCreditByAmount(api, amount, termMonths, downPayment);
            
            // With down payment, payment should be smaller
            if (withoutDown.offers.length > 0 && withDown.offers.length > 0) {
                expect(
                    withDown.offers[0].monthlyPayment,
                    'Платёж с первоначальным взносом должен быть меньше'
                ).toBeLessThan(withoutDown.offers[0].monthlyPayment);
            }
        });
    });

    test.describe('Credit Availability', () => {
        test('should check credit availability for product', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const eligibility = await checkCreditAvailability(api, testProductId);
            
            expect(eligibility).toHaveProperty('eligible');
            expect(typeof eligibility.eligible).toBe('boolean');
        });

        test('should return available terms', async () => {
            const terms = await getAvailableTerms(api, 10000);
            
            expect(terms.length).toBeGreaterThan(0);
            
            for (const term of terms) {
                expectTermMonthsStandard(term);
            }
        });
    });

    test.describe('Down Payment', () => {
        test('should return minimum down payment', async () => {
            const minDown = await getMinDownPayment(api, 10000);
            
            expect(minDown).toHaveProperty('amount');
            expect(minDown).toHaveProperty('percent');
            expect(typeof minDown.amount).toBe('number');
            expect(typeof minDown.percent).toBe('number');
        });

        test('should have reasonable min down payment', async () => {
            const productPrice = 10000;
            const minDown = await getMinDownPayment(api, productPrice);
            
            expectMinDownPaymentReasonable(minDown, productPrice);
        });
    });

    test.describe('Bank Specific Offers', () => {
        test('should get offer from specific bank', async () => {
            test.skip(!testProductId, 'No test product available');
            
            const banks = await getAvailableBanks(api);
            test.skip(banks.length === 0, 'No banks available');
            
            const offer = await getBankOffer(api, banks[0].id, testProductId, 12);
            
            if (offer) {
                expectCreditOfferStructureValid(offer);
                expect(offer.bankId).toBe(banks[0].id);
            }
        });
    });
});

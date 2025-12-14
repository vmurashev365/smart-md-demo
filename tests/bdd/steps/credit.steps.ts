/**
 * Credit BDD Steps
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { ApiWorld } from '../world';

// Actions
import {
    getAvailableBanks,
    calculateCredit,
    calculateCreditByAmount,
    getAvailableTerms
} from '../../api/actions/credit.actions';

import { getCategoryProducts } from '../../api/actions/catalog.actions';

// Assertions
import {
    expectBanksAvailable,
    expectCreditOffersAvailable,
    expectCreditOfferStructureValid,
    expectCreditMathValid,
    expectInterestRateReasonable,
    expectMultipleTermsAvailable,
    expectOfferFromBank
} from '../../api/assertions/credit.assertions';

// === GIVEN ===

Given('product costs {int} MDL', async function (this: ApiWorld, amount: number) {
    this.productPrice = amount;
    this.creditCalculation = await calculateCreditByAmount(this.api, amount, 12);
});

Given('partner banks are available', async function (this: ApiWorld) {
    const banks = await getAvailableBanks(this.api);
    expectBanksAvailable(banks);
});

Given('user selected product from catalog', async function (this: ApiWorld) {
    const catalog = await getCategoryProducts(this.api, 'smartphone', { limit: 1 });
    if (catalog.products.length === 0) {
        throw new Error('No products in catalog for testing');
    }
    this.currentProduct = catalog.products[0];
    this.productPrice = this.currentProduct.price;
});

// === WHEN ===

When('user opens credit calculator', async function (this: ApiWorld) {
    if (this.productPrice) {
        this.creditCalculation = await calculateCreditByAmount(this.api, this.productPrice, 12);
    } else if (this.currentProduct) {
        this.creditCalculation = await calculateCredit(this.api, this.currentProduct.id);
    } else {
        throw new Error('No product or price specified');
    }
});

When('user selects credit for {int} months', async function (this: ApiWorld, termMonths: number) {
    this.selectedTermMonths = termMonths;
    const amount = this.productPrice || (this.currentProduct?.price ?? 10000);
    this.creditCalculation = await calculateCreditByAmount(this.api, amount, termMonths);
});

When('user compares credit conditions', async function (this: ApiWorld) {
    const amount = this.productPrice || 20000;
    this.creditCalculation = await calculateCreditByAmount(this.api, amount, 12);
});

When('user tries to apply for credit', async function (this: ApiWorld) {
    const amount = this.productPrice || 500;
    this.creditCalculation = await calculateCreditByAmount(this.api, amount, 12);
});

When('user makes down payment {int}', async function (this: ApiWorld, downPayment: number) {
    if (!this.currentProduct) {
        throw new Error('First select a product');
    }
    this.creditCalculation = await calculateCredit(this.api, this.currentProduct.id, {
        downPayment,
        termMonths: this.selectedTermMonths
    });
});

// === THEN ===

Then('calculator shows monthly payment', function (this: ApiWorld) {
    expectCreditOffersAvailable(this.creditCalculation!);
    for (const offer of this.creditCalculation!.offers) {
        if (typeof offer.monthlyPayment !== 'number' || offer.monthlyPayment <= 0) {
            throw new Error('Monthly payment not displayed correctly');
        }
    }
});

Then('credit math is correct', function (this: ApiWorld) {
    const price = this.productPrice || this.creditCalculation!.productPrice;
    for (const offer of this.creditCalculation!.offers) {
        expectCreditMathValid(offer, price);
    }
});

Then('available banks are displayed', function (this: ApiWorld) {
    expectCreditOffersAvailable(this.creditCalculation!);
});

Then('each bank has its own terms', function (this: ApiWorld) {
    for (const offer of this.creditCalculation!.offers) {
        expectCreditOfferStructureValid(offer);
    }
});

Then('monthly payment is less than total amount', function (this: ApiWorld) {
    const price = this.productPrice || this.creditCalculation!.productPrice;
    for (const offer of this.creditCalculation!.offers) {
        if (offer.monthlyPayment >= price) {
            throw new Error(`Monthly payment ${offer.monthlyPayment} should be less than ${price}`);
        }
    }
});

Then('offers from different banks are displayed', function (this: ApiWorld) {
    expectCreditOffersAvailable(this.creditCalculation!);
    const banks = new Set(this.creditCalculation!.offers.map(o => o.bankName));
    if (banks.size < 2) {
        throw new Error('Expected offers from multiple banks');
    }
});

Then('user can select the best one', function (this: ApiWorld) {
    expectCreditOffersAvailable(this.creditCalculation!);
});

Then('credit is unavailable for small amounts', function (this: ApiWorld) {
    // For small amounts, either no offers or minimum amount validation
    if (this.creditCalculation!.offers.length > 0) {
        // Check if there's a minimum amount requirement
        const minAmount = 1000; // Typical minimum
        if (this.productPrice && this.productPrice < minAmount) {
            throw new Error(`Credit should be unavailable for amounts below ${minAmount} MDL`);
        }
    }
});

Then('total payment exceeds product price', function (this: ApiWorld) {
    const price = this.productPrice || this.creditCalculation!.productPrice;
    for (const offer of this.creditCalculation!.offers) {
        if (offer.totalPayment <= price) {
            throw new Error(`Total payment ${offer.totalPayment} should exceed product price ${price}`);
        }
    }
});

Then('overpayment matches interest rate', function (this: ApiWorld) {
    for (const offer of this.creditCalculation!.offers) {
        expectInterestRateReasonable(offer);
    }
});

Then('overpayment is within normal range', function (this: ApiWorld) {
    for (const offer of this.creditCalculation!.offers) {
        expectInterestRateReasonable(offer);
    }
});

Then('at least {int} credit terms available', async function (this: ApiWorld, count: number) {
    const terms = await getAvailableTerms(this.api, this.creditCalculation!.productPrice);
    if (terms.length < count) {
        throw new Error(`Expected at least ${count} terms, got ${terms.length}`);
    }
});

Then('offer from bank {string} exists', function (this: ApiWorld, bankName: string) {
    expectOfferFromBank(this.creditCalculation!.offers, bankName);
});

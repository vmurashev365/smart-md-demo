# API Testing Framework Documentation

## Comprehensive Guide for Smart.md API Test Automation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Writing API Tests](#writing-api-tests)
6. [Writing BDD Tests](#writing-bdd-tests)
7. [Running Tests](#running-tests)
8. [API Recorder Tool](#api-recorder-tool)
9. [Human-Like Behavior](#human-like-behavior)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This framework provides a layered architecture for API testing of the Smart.md e-commerce platform. It combines:

- **Playwright Test** for API testing with built-in assertions
- **Cucumber/Gherkin** for BDD (Behavior-Driven Development) scenarios
- **Actions/Assertions Pattern** for code reuse and maintainability

### Key Features

| Feature | Description |
|---------|-------------|
| **Dual Test Layers** | API specs (Playwright) + BDD scenarios (Cucumber) |
| **Code Reuse** | Actions & Assertions shared between both layers |
| **Localization Support** | Russian (RU) and Romanian (RO) language testing |
| **Credit Calculator** | Full coverage of bank credit offers |
| **Cart Operations** | Add, remove, update, promo codes |
| **Search & Catalog** | Product search, filtering, categories |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEST LAYERS                              │
├─────────────────────────────┬───────────────────────────────────┤
│     Playwright API Specs    │      Cucumber BDD Scenarios       │
│   (tests/api/specs/*.ts)    │   (tests/bdd/features/*.feature)  │
└──────────────┬──────────────┴──────────────┬────────────────────┘
               │                             │
               │         ┌───────────────────┤
               │         │                   │
               ▼         ▼                   ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│          ACTIONS            │   │       STEP DEFINITIONS      │
│  (tests/api/actions/*.ts)   │   │   (tests/bdd/steps/*.ts)    │
│                             │   │                             │
│  • searchProducts()         │◄──│  When('user searches...')   │
│  • addToCart()              │   │  Given('cart contains...')  │
│  • calculateCredit()        │   │  Then('results contain...') │
└──────────────┬──────────────┘   └─────────────────────────────┘
               │
               ▼
┌─────────────────────────────┐
│        ASSERTIONS           │
│ (tests/api/assertions/*.ts) │
│                             │
│  • expectSearchHasResults() │
│  • expectCartTotalCorrect() │
│  • expectCreditMathValid()  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│         API CLIENT          │
│  (tests/api/client/         │
│       apiClient.ts)         │
│                             │
│  • get(), post(), put()     │
│  • setLanguage('ru'/'ro')   │
│  • Request/Response typing  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     Playwright Request      │
│        Context              │
└─────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Contains |
|-------|---------------|----------|
| **API Client** | HTTP communication | `get()`, `post()`, headers, auth |
| **Actions** | Business operations | `searchProducts()`, `addToCart()` |
| **Assertions** | Business validations | `expectCartTotalCorrect()` |
| **API Specs** | Test orchestration | Playwright `test()` blocks |
| **BDD Steps** | Gherkin step mapping | `Given/When/Then` definitions |
| **Features** | Business scenarios | Gherkin `.feature` files |

---

## Project Structure

```
tests/
├── api/
│   ├── client/
│   │   └── apiClient.ts          # Centralized HTTP client
│   │
│   ├── actions/                   # Business operations (no assertions!)
│   │   ├── search.actions.ts      # searchProducts(), getSearchSuggestions()
│   │   ├── catalog.actions.ts     # getCategories(), getCategoryProducts()
│   │   ├── credit.actions.ts      # calculateCredit(), getAvailableBanks()
│   │   ├── cart.actions.ts        # addToCart(), removeFromCart()
│   │   └── product.actions.ts     # getProductReviews(), checkAvailability()
│   │
│   ├── assertions/                # Business validations (no HTTP!)
│   │   ├── search.assertions.ts   # expectSearchHasResults()
│   │   ├── catalog.assertions.ts  # expectCategoryHasProducts()
│   │   ├── credit.assertions.ts   # expectCreditMathValid()
│   │   ├── cart.assertions.ts     # expectCartTotalCorrect()
│   │   └── localization.assertions.ts  # expectTextInRussian()
│   │
│   └── specs/                     # Playwright API test files
│       ├── catalog.api.spec.ts
│       ├── credit.api.spec.ts
│       ├── cart.api.spec.ts
│       └── localization.api.spec.ts
│
├── bdd/
│   ├── world.ts                   # Cucumber World (shared state)
│   ├── hooks.ts                   # Before/After hooks
│   │
│   ├── steps/                     # Step definitions
│   │   ├── search.steps.ts
│   │   ├── credit.steps.ts
│   │   ├── cart.steps.ts
│   │   └── localization.steps.ts
│   │
│   └── features/                  # Gherkin scenarios
│       ├── search.feature
│       ├── credit.feature
│       ├── cart.feature
│       └── localization.feature
│
└── shared/                        # Shared utilities
    ├── config/
    ├── fixtures/
    └── utils/
```

---

## Getting Started

### Prerequisites

```bash
# Node.js 18+
node --version  # v18.0.0 or higher

# Install dependencies
npm install
```

### Quick Start

```bash
# Run all API tests
npm run test:api

# Run BDD tests
npm run test:bdd:api

# Run smoke tests only
npm run test:api:smoke
npm run test:bdd:api:smoke
```

---

## Writing API Tests

### 1. Create an Action

Actions perform business operations. They call the API and return typed data.

```typescript
// tests/api/actions/wishlist.actions.ts

import { ApiClient } from '../client/apiClient';

export interface WishlistItem {
    id: string;
    productId: string;
    productTitle: string;
    price: number;
    addedAt: string;
}

export interface Wishlist {
    items: WishlistItem[];
    totalItems: number;
}

/**
 * Get user's wishlist
 */
export async function getWishlist(api: ApiClient): Promise<Wishlist> {
    const response = await api.get<Wishlist>('/api/wishlist');
    
    return response.data ?? { items: [], totalItems: 0 };
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(
    api: ApiClient, 
    productId: string
): Promise<{ success: boolean; wishlist: Wishlist }> {
    const response = await api.post<{ success: boolean; wishlist: Wishlist }>(
        '/api/wishlist/add',
        { productId }
    );
    
    return response.data!;
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(
    api: ApiClient, 
    productId: string
): Promise<Wishlist> {
    const response = await api.delete<Wishlist>(`/api/wishlist/${productId}`);
    
    return response.data!;
}
```

**Key Rules for Actions:**
- ✅ Call API endpoints
- ✅ Parse and return typed data
- ✅ Handle errors gracefully
- ❌ No assertions inside actions
- ❌ No business logic validation

### 2. Create Assertions

Assertions validate business rules. They use Playwright's `expect()`.

```typescript
// tests/api/assertions/wishlist.assertions.ts

import { expect } from '@playwright/test';
import { Wishlist, WishlistItem } from '../actions/wishlist.actions';

/**
 * Wishlist is empty
 */
export function expectWishlistEmpty(wishlist: Wishlist): void {
    expect(wishlist.items).toHaveLength(0);
    expect(wishlist.totalItems).toBe(0);
}

/**
 * Wishlist contains items
 */
export function expectWishlistNotEmpty(wishlist: Wishlist): void {
    expect(wishlist.items.length).toBeGreaterThan(0);
    expect(wishlist.totalItems).toBeGreaterThan(0);
}

/**
 * Product is in wishlist
 */
export function expectProductInWishlist(
    wishlist: Wishlist, 
    productId: string
): void {
    const found = wishlist.items.find(item => item.productId === productId);
    expect(found, `Product ${productId} should be in wishlist`).toBeDefined();
}

/**
 * Product is NOT in wishlist
 */
export function expectProductNotInWishlist(
    wishlist: Wishlist, 
    productId: string
): void {
    const found = wishlist.items.find(item => item.productId === productId);
    expect(found, `Product ${productId} should NOT be in wishlist`).toBeUndefined();
}

/**
 * All wishlist items have required fields
 */
export function expectWishlistItemsValid(wishlist: Wishlist): void {
    for (const item of wishlist.items) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('productId');
        expect(item).toHaveProperty('productTitle');
        expect(item).toHaveProperty('price');
        expect(typeof item.price).toBe('number');
        expect(item.price).toBeGreaterThan(0);
    }
}
```

**Key Rules for Assertions:**
- ✅ Use `expect()` from Playwright
- ✅ Express business rules
- ✅ Provide descriptive error messages
- ❌ No HTTP calls
- ❌ No side effects

### 3. Create API Spec

Specs orchestrate Actions + Assertions into test scenarios.

```typescript
// tests/api/specs/wishlist.api.spec.ts

import { test, expect } from '@playwright/test';
import { ApiClient } from '../client/apiClient';

// Actions
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} from '../actions/wishlist.actions';

// Assertions
import {
    expectWishlistEmpty,
    expectWishlistNotEmpty,
    expectProductInWishlist,
    expectProductNotInWishlist,
    expectWishlistItemsValid
} from '../assertions/wishlist.assertions';

test.describe('Wishlist API', () => {
    let api: ApiClient;
    
    test.beforeAll(async ({ playwright }) => {
        api = new ApiClient();
        await api.init(playwright);
    });
    
    test.afterAll(async () => {
        await api.dispose();
    });
    
    test.beforeEach(async () => {
        // Clear wishlist before each test
        const wishlist = await getWishlist(api);
        for (const item of wishlist.items) {
            await removeFromWishlist(api, item.productId);
        }
    });
    
    test('@smoke add product to wishlist', async () => {
        // Arrange
        const productId = '12345';
        
        // Act
        const result = await addToWishlist(api, productId);
        
        // Assert
        expect(result.success).toBe(true);
        expectProductInWishlist(result.wishlist, productId);
    });
    
    test('remove product from wishlist', async () => {
        // Arrange
        const productId = '12345';
        await addToWishlist(api, productId);
        
        // Act
        const wishlist = await removeFromWishlist(api, productId);
        
        // Assert
        expectProductNotInWishlist(wishlist, productId);
    });
    
    test('wishlist items have valid structure', async () => {
        // Arrange
        await addToWishlist(api, '12345');
        await addToWishlist(api, '67890');
        
        // Act
        const wishlist = await getWishlist(api);
        
        // Assert
        expectWishlistNotEmpty(wishlist);
        expectWishlistItemsValid(wishlist);
    });
});
```

---

## Writing BDD Tests

### 1. Create Feature File

Feature files describe scenarios in business language.

```gherkin
# tests/bdd/features/wishlist.feature

@wishlist @smoke
Feature: Product Wishlist
  As a customer
  I want to save products to my wishlist
  So that I can purchase them later

  Background:
    Given the site is in Russian
    And wishlist is empty

  @smoke @wishlist-add
  Scenario: Add product to wishlist
    When user adds product 12345 to wishlist
    Then product appears in wishlist
    And wishlist counter shows 1

  @wishlist-remove
  Scenario: Remove product from wishlist
    Given wishlist contains product 12345
    When user removes product from wishlist
    Then wishlist is empty

  @wishlist-multiple
  Scenario: Add multiple products to wishlist
    When user adds product 12345 to wishlist
    And user adds product 67890 to wishlist
    Then wishlist contains 2 items

  @wishlist-persistence
  Scenario: Wishlist persists across sessions
    When user adds product 12345 to wishlist
    And user refreshes page
    Then product remains in wishlist
```

**Feature File Guidelines:**
- ✅ Use business language
- ✅ No technical terms (HTTP, JSON, status codes)
- ✅ Tag scenarios with `@smoke`, `@feature-name`
- ✅ Use Background for common setup
- ❌ No implementation details

### 2. Create Step Definitions

Step definitions map Gherkin to Actions + Assertions.

```typescript
// tests/bdd/steps/wishlist.steps.ts

import { Given, When, Then } from '@cucumber/cucumber';
import { ApiWorld } from '../world';

// Actions
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} from '../../api/actions/wishlist.actions';

// Assertions
import {
    expectWishlistEmpty,
    expectWishlistNotEmpty,
    expectProductInWishlist
} from '../../api/assertions/wishlist.assertions';

// === GIVEN ===

Given('wishlist is empty', async function (this: ApiWorld) {
    const wishlist = await getWishlist(this.api);
    for (const item of wishlist.items) {
        await removeFromWishlist(this.api, item.productId);
    }
    this.wishlist = await getWishlist(this.api);
    expectWishlistEmpty(this.wishlist);
});

Given('wishlist contains product {int}', async function (
    this: ApiWorld, 
    productId: number
) {
    const result = await addToWishlist(this.api, String(productId));
    this.wishlist = result.wishlist;
    this.lastAddedProductId = String(productId);
});

// === WHEN ===

When('user adds product {int} to wishlist', async function (
    this: ApiWorld, 
    productId: number
) {
    const result = await addToWishlist(this.api, String(productId));
    this.wishlist = result.wishlist;
    this.lastAddedProductId = String(productId);
});

When('user removes product from wishlist', async function (this: ApiWorld) {
    if (!this.lastAddedProductId) {
        throw new Error('No product to remove');
    }
    this.wishlist = await removeFromWishlist(this.api, this.lastAddedProductId);
});

When('user refreshes page', async function (this: ApiWorld) {
    // Simulate refresh by re-fetching
    this.wishlist = await getWishlist(this.api);
});

// === THEN ===

Then('product appears in wishlist', function (this: ApiWorld) {
    expectWishlistNotEmpty(this.wishlist!);
    expectProductInWishlist(this.wishlist!, this.lastAddedProductId!);
});

Then('wishlist is empty', function (this: ApiWorld) {
    expectWishlistEmpty(this.wishlist!);
});

Then('wishlist counter shows {int}', function (this: ApiWorld, count: number) {
    if (this.wishlist!.totalItems !== count) {
        throw new Error(`Expected ${count}, got ${this.wishlist!.totalItems}`);
    }
});

Then('wishlist contains {int} items', function (this: ApiWorld, count: number) {
    if (this.wishlist!.items.length !== count) {
        throw new Error(`Expected ${count} items, got ${this.wishlist!.items.length}`);
    }
});

Then('product remains in wishlist', function (this: ApiWorld) {
    expectProductInWishlist(this.wishlist!, this.lastAddedProductId!);
});
```

### 3. Update World (if needed)

Add new state properties to the World class.

```typescript
// tests/bdd/world.ts (add to existing)

import { Wishlist } from '../api/actions/wishlist.actions';

export class ApiWorld extends World {
    // ... existing properties ...
    
    // Wishlist state
    wishlist?: Wishlist;
    lastAddedProductId?: string;
}
```

---

## Running Tests

### NPM Scripts

```bash
# === Playwright API Tests ===
npm run test:api                    # All API tests
npm run test:api:smoke              # Only @smoke tagged tests

# === Cucumber BDD Tests ===
npm run test:bdd:api                # All BDD scenarios
npm run test:bdd:api:smoke          # Only @smoke scenarios
npm run test:bdd:api:ci             # CI/CD profile (retries, reports)

# === Direct Commands ===
npx playwright test tests/api/specs --project=api
npx cucumber-js --config cucumber-api.config.js
```

### Running Specific Tests

```bash
# By file
npx playwright test tests/api/specs/cart.api.spec.ts --project=api

# By test name
npx playwright test --grep "add product to cart" --project=api

# By tag (Cucumber)
npx cucumber-js --config cucumber-api.config.js --tags "@cart"
npx cucumber-js --config cucumber-api.config.js --tags "@smoke and @credit"
npx cucumber-js --config cucumber-api.config.js --tags "not @slow"
```

### Configuration Options

#### Playwright Config (`playwright.config.ts`)

```typescript
{
  name: 'api',
  testMatch: /.*\.api\.spec\.ts$/,
  use: {
    baseURL: process.env.API_BASE_URL || 'https://smart.md',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Accept-Language': 'ru,ro;q=0.9',
    },
  },
}
```

#### Cucumber Config (`cucumber-api.config.js`)

```javascript
module.exports = {
    default: {
        paths: ['tests/bdd/features/**/*.feature'],
        require: [
            'tests/bdd/steps/**/*.ts',
            'tests/bdd/world.ts',
            'tests/bdd/hooks.ts'
        ],
        requireModule: ['ts-node/register'],
        format: ['progress-bar', 'html:reports/bdd-report.html'],
        timeout: 30000,
        worldParameters: {
            baseUrl: 'https://smart.md',
            defaultLanguage: 'ru'
        }
    },
    smoke: {
        // ... same as default ...
        tags: '@smoke'
    },
    ci: {
        // ... same as default ...
        format: ['json:reports/bdd-report.json', 'junit:reports/bdd-junit.xml'],
        retry: 2
    }
};
```

---

## API Recorder Tool

The framework includes an API recorder for black-box testing.

### Usage

```bash
cd codegen_smart_recorder
node api-recorder.js "https://smart.md/smartphone"
```

### Output

The recorder generates:
- `recorded_api/requests.json` — Raw request/response data
- `recorded_api/api-tests.spec.ts` — Generated Playwright tests
- `recorded_api/endpoints-summary.md` — API documentation

### Features

| Feature | Description |
|---------|-------------|
| **Endpoint Normalization** | `/product/123` → `/product/{id}` |
| **Deduplication** | One success + one error per endpoint |
| **Language Detection** | Detects RU/RO from URLs, headers, cookies |
| **Response Size Limit** | 500KB max (prevents huge payloads) |
| **Categorization** | search, catalog, credit, cart, checkout |

---

## Human-Like Behavior

The framework includes human-like behavior simulation to avoid bot detection and create realistic API traffic patterns.

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   HUMAN-LIKE BEHAVIOR                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Timing    │  │   Headers   │  │   Session Tracking  │ │
│  │  Utilities  │  │  Rotation   │  │                     │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────┤ │
│  │ humanDelay  │  │ User-Agent  │  │ pagesViewed[]       │ │
│  │ typingDelay │  │ Accept-Lang │  │ productsViewed[]    │ │
│  │ pageView    │  │ Sec-Fetch-* │  │ searchQueries[]     │ │
│  │ throttle    │  │ Cache-Ctrl  │  │ requestCount        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Configuration

#### Environment Variables

```bash
# Enable/disable human-like behavior (default: true)
HUMAN_BEHAVIOR=true

# Speed multiplier (1.0 = normal, 0.5 = 2x faster, 2.0 = 2x slower)
HUMAN_SPEED=1.0

# Fast CI mode (disables all delays)
HUMAN_BEHAVIOR=false npm run test:api
```

#### Programmatic Configuration

```typescript
import { ApiClient } from './tests/api/client/apiClient';

// Enable human-like behavior
const api = new ApiClient({
    humanLike: true,
    humanSpeed: 1.0
});

// Disable for fast tests
api.setHumanLike(false);

// Slow down for debugging
api.setHumanLike(true, 2.0);
```

### Action Types & Delays

The framework applies different delays based on action type:

| Action Type | Delay Range | Description |
|-------------|-------------|-------------|
| `search` | 300-800ms | User types search query |
| `browse` | 100-300ms | Quick navigation |
| `view_product` | 500-1500ms | User reads product info |
| `add_to_cart` | 200-500ms | Decision to add |
| `checkout` | 1000-3000ms | Important decision |
| `filter` | 150-400ms | Applying filters |
| `pagination` | 200-600ms | Scrolling pages |

### Usage in Actions

```typescript
// tests/api/actions/search.actions.ts

export async function searchProducts(
    api: ApiClient,
    query: string
): Promise<SearchResult> {
    // API client automatically applies human-like delays
    // based on the actionType parameter
    const response = await api.get<SearchResult>(
        '/api/search',
        { 
            params: { q: query },
            actionType: 'search'  // Applies 300-800ms delay
        }
    );
    return response.data;
}

export async function addToCart(
    api: ApiClient,
    productId: string,
    quantity: number
): Promise<CartResult> {
    const response = await api.post<CartResult>(
        '/api/cart/add',
        { productId, quantity },
        { actionType: 'add_to_cart' }  // Applies 200-500ms delay
    );
    return response.data;
}
```

### Realistic Headers

The framework automatically rotates User-Agent and sets realistic browser headers:

```typescript
// Automatically applied headers when humanLike: true
{
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ru-RU,ru;q=0.9,ro;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
}
```

### User-Agent Rotation

```typescript
import { 
    getRandomUserAgent, 
    getUserAgentForPlatform 
} from './tests/api/utils/human-like';

// Random from pool
const ua = getRandomUserAgent();
// "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."

// Platform-specific
const mobileUA = getUserAgentForPlatform('mobile');
const desktopUA = getUserAgentForPlatform('desktop');
const tabletUA = getUserAgentForPlatform('tablet');
```

### Session Simulation

Track user session behavior for realistic patterns:

```typescript
import {
    createSessionBehavior,
    trackPageView,
    trackProductView,
    trackSearch,
    getSessionDuration
} from './tests/api/utils/human-like';

// Create session tracker
const session = createSessionBehavior();

// Track actions
trackPageView(session, '/catalog/smartphones');
trackSearch(session, 'iPhone');
trackProductView(session, 'product-123');

// Get session stats
console.log(`Session duration: ${getSessionDuration(session)}s`);
console.log(`Pages viewed: ${session.pagesViewed.length}`);
console.log(`Products viewed: ${session.productsViewed.length}`);
```

### Rate Limiting Protection

The framework automatically:
- Enforces minimum 100ms between requests
- Adds random jitter (0-100ms) to avoid patterns
- Throttles burst requests

```typescript
import { throttleRequest, addJitter } from './tests/api/utils/human-like';

// Manual throttling (automatic in ApiClient)
await throttleRequest();  // Ensures 100ms since last request
await addJitter();        // Adds 0-100ms random delay
```

### Realistic Test Data

Generate realistic user inputs:

```typescript
import {
    getRealisticSearchQuery,
    getRealisticPriceRange,
    getRealisticQuantity
} from './tests/api/utils/human-like';

// Random search query (iPhone, Samsung, телефон, etc.)
const query = getRealisticSearchQuery();

// Realistic price range
const { min, max } = getRealisticPriceRange();
// e.g., { min: 5000, max: 10000 }

// Realistic quantity (weighted: 70% buy 1, 20% buy 2, etc.)
const qty = getRealisticQuantity();
// Usually 1-2, rarely more
```

### Speed Profiles

```bash
# Normal speed (production-like)
HUMAN_SPEED=1.0 npm run test:api

# Fast mode (CI/CD)
HUMAN_BEHAVIOR=false npm run test:api

# Slow mode (debugging, demos)
HUMAN_SPEED=2.0 npm run test:api

# Very fast (still with some delays)
HUMAN_SPEED=0.3 npm run test:api
```

### BDD Integration

Human-like behavior works automatically with BDD tests:

```typescript
// tests/bdd/hooks.ts
Before(async function (this: ApiWorld) {
    // Human-like is enabled by default
    await this.initApi();
});

// For fast CI runs:
Before({ tags: '@fast' }, async function (this: ApiWorld) {
    await this.initApi();
    this.api.setHumanLike(false);
});
```

```gherkin
@cart @fast
Scenario: Quick cart test (no delays)
  When user adds product 12345 to cart
  Then product appears in cart

@cart @realistic
Scenario: Realistic cart flow (with delays)
  When user adds product 12345 to cart
  Then product appears in cart
```

---

## Best Practices

### 1. Actions Should Be Pure

```typescript
// ✅ Good — returns data, no assertions
export async function getProduct(api: ApiClient, id: string): Promise<Product> {
    const response = await api.get<Product>(`/api/product/${id}`);
    return response.data!;
}

// ❌ Bad — contains assertion
export async function getProduct(api: ApiClient, id: string): Promise<Product> {
    const response = await api.get<Product>(`/api/product/${id}`);
    expect(response.status).toBe(200);  // Don't do this!
    return response.data!;
}
```

### 2. Assertions Should Express Business Rules

```typescript
// ✅ Good — business rule
export function expectCreditMathValid(offer: CreditOffer, price: number): void {
    const expectedTotal = offer.monthlyPayment * offer.termMonths;
    expect(Math.abs(offer.totalPayment - expectedTotal)).toBeLessThan(1);
    expect(offer.totalPayment).toBeGreaterThan(price);
}

// ❌ Bad — technical detail
export function expectStatus200(response: any): void {
    expect(response.status).toBe(200);
}
```

### 3. Step Definitions Should Be Thin

```typescript
// ✅ Good — thin wrapper
When('user adds product to cart', async function (this: ApiWorld) {
    const result = await addToCart(this.api, this.currentProduct!.id, 1);
    this.cart = result.cart;
});

// ❌ Bad — contains business logic
When('user adds product to cart', async function (this: ApiWorld) {
    const response = await this.api.post('/cart/add', {
        productId: this.currentProduct!.id,
        quantity: 1
    });
    // Parsing, validation, etc. should be in actions
    this.cart = JSON.parse(response.body);
    if (this.cart.items.length === 0) {
        throw new Error('Failed to add');
    }
});
```

### 4. Feature Files Should Use Business Language

```gherkin
# ✅ Good — business language
Scenario: Credit unavailable for cheap products
  Given product costs 500 MDL
  When user tries to apply for credit
  Then credit is unavailable for small amounts

# ❌ Bad — technical language
Scenario: Credit API returns 400 for low amounts
  Given product price is 500
  When POST /api/credit/calculate with {"amount": 500}
  Then response status is 400
  And response body contains "min_amount"
```

### 5. Use Tags Effectively

```gherkin
@smoke           # Critical path tests (run on every commit)
@credit          # Feature-specific tag
@slow            # Long-running tests (exclude from CI)
@flaky           # Known flaky tests
@skip            # Temporarily disabled

# Combine tags
npx cucumber-js --tags "@smoke and not @flaky"
npx cucumber-js --tags "@credit or @cart"
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" Error

```bash
# Ensure ts-node is installed
npm install -D ts-node

# Check tsconfig.json has correct settings
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true
  }
}
```

#### 2. Cucumber Steps Not Found

```bash
# Verify step definitions are in correct path
tests/bdd/steps/*.ts

# Check cucumber config require paths
require: ['tests/bdd/steps/**/*.ts']
```

#### 3. API Client Not Initialized

```typescript
// Ensure init() is called in hooks
Before(async function (this: ApiWorld) {
    await this.initApi();
});

After(async function (this: ApiWorld) {
    await this.disposeApi();
});
```

#### 4. Timeout Errors

```javascript
// Increase timeout in cucumber config
timeout: 60000,  // 60 seconds

// Or per-step
When('slow operation', { timeout: 120000 }, async function () {
    // ...
});
```

#### 5. Language/Localization Issues

```typescript
// Ensure language is set before requests
await api.setLanguage('ru');  // or 'ro'

// Check Accept-Language header
extraHTTPHeaders: {
    'Accept-Language': 'ru,ro;q=0.9'
}
```

### Debug Mode

```bash
# Playwright debug
DEBUG=pw:api npx playwright test --project=api

# Cucumber debug
DEBUG=cucumber* npx cucumber-js --config cucumber-api.config.js

# Verbose output
npx cucumber-js --config cucumber-api.config.js --format progress-bar --format @cucumber/pretty-formatter
```

---

## Summary

| What | Where | Example |
|------|-------|---------|
| HTTP calls | `actions/*.ts` | `searchProducts()` |
| Business rules | `assertions/*.ts` | `expectCartTotalCorrect()` |
| Test scenarios | `specs/*.api.spec.ts` | `test('add to cart')` |
| BDD scenarios | `features/*.feature` | `Scenario: Add to cart` |
| Step mapping | `steps/*.steps.ts` | `When('user adds...')` |
| Shared state | `world.ts` | `this.cart`, `this.api` |
| Configuration | `cucumber-api.config.js` | tags, timeout, format |

---

## Contact & Support

- **Framework Author**: QA Automation Team
- **Target Site**: [Smart.md](https://smart.md)
- **Languages**: Russian (RU), Romanian (RO)
- **Currency**: Moldovan Lei (MDL)

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
| **BaseApiClient** | Throttled HTTP requests | Semaphore, jitter, backoff, retries |
| **ApiClient** | Legacy wrapper | Backward compatibility, extends BaseApiClient |
| **Throttle Utils** | Rate limiting | Profiles, delays, concurrency control |
| **Session Manager** | Cookie persistence | Singleton, cross-request state |
| **Rate Tracker** | Statistics | Response times, error rates, 429 detection |
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
│   │   └── apiClient.ts          # Legacy wrapper for backward compatibility
│   │
│   ├── clients/                   # NEW: Core client architecture
│   │   └── base.client.ts         # Abstract throttled client (extend this)
│   │
│   ├── utils/                     # NEW: Throttling infrastructure
│   │   ├── profiles.ts            # 4 throttling profiles (stealth/normal/fast/burst)
│   │   ├── throttle.ts            # Semaphore, jitter, backoff utilities
│   │   ├── session-manager.ts    # Cookie persistence (singleton)
│   │   └── rate-limit-tracker.ts # Response stats & rate limit detection
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
# Run all API tests (stealth mode by default)
npm run test:api

# Run smoke tests with stealth profile
npm run test:api:smoke

# Run BDD tests
npm run test:bdd:api
npm run test:bdd:api:smoke

# Fast mode for development
npm run test:api:fast

# CI/CD mode (burst profile with mocks)
npm run test:api:ci
```

---

## Writing API Tests

### 1. Create an Action

Actions perform business operations. They call the API and return typed data. **All requests are automatically throttled** based on the `API_PROFILE` setting.

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
 * 
 * NOTE: Request is automatically throttled by ApiClient based on API_PROFILE:
 * - stealth: 2-5s delay, sequential
 * - normal: 0.5-1.5s delay, up to 2 parallel
 * - fast: 0-100ms delay, up to 10 parallel
 * - burst: 0ms delay, up to 20 parallel
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
- ✅ Call API endpoints (automatically throttled)
- ✅ Parse and return typed data
- ✅ Handle errors gracefully
- ✅ Throttling is transparent (no code changes needed)
- ❌ No assertions inside actions
- ❌ No business logic validation
- ❌ No manual delays (handled by throttling system)

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
    
    test.beforeAll(async () => {
        // ApiClient automatically uses API_PROFILE from environment
        // No need to call init() - it's deprecated but still works
        api = new ApiClient();
    });
    
    test.afterAll(async () => {
        // Log throttling statistics
        const stats = api.getStats();
        console.log(`📊 Total requests: ${stats.totalRequests}`);
        console.log(`📊 Avg response time: ${stats.averageResponseTime}ms`);
        console.log(`📊 Errors: ${stats.errors.total}`);
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
npm run test:api                    # All tests (stealth profile)
npm run test:api:smoke              # Smoke tests (stealth profile)
npm run test:api:normal             # Balanced profile (staging)
npm run test:api:fast               # Fast profile (development)
npm run test:api:ci                 # Burst profile (CI/CD, mocks enabled)

# === Cucumber BDD Tests ===
npm run test:bdd:api                # All BDD scenarios
npm run test:bdd:api:smoke          # Only @smoke scenarios
npm run test:bdd:api:ci             # CI/CD profile (retries, reports)

# === Direct Commands with Profiles ===

# Linux/macOS
API_PROFILE=stealth npx playwright test tests/api/specs --project=api
API_PROFILE=fast npx playwright test tests/api/specs --project=api
API_PROFILE=burst npx cucumber-js --config cucumber-api.config.js

# Windows PowerShell
$env:API_PROFILE="stealth"; npx playwright test tests/api/specs --project=api
$env:API_PROFILE="fast"; npx playwright test tests/api/specs --project=api

# Windows CMD
set API_PROFILE=stealth && npx playwright test tests/api/specs --project=api
set API_PROFILE=fast && npx playwright test tests/api/specs --project=api
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
// Worker count auto-adjusts based on API_PROFILE
function getWorkerCount(): number {
  const profile = process.env.API_PROFILE?.toLowerCase();
  if (process.env.CI) return 1;
  if (profile === 'stealth') return 1;  // Sequential only
  if (profile === 'normal') return 2;    // Limited parallel
  return 4;  // Fast/burst allow default
}

export default defineConfig({
  workers: getWorkerCount(),  // ⚠️ Critical for throttling
  
  projects: [
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
    },
  ],
});
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

## Advanced Throttling System

The framework includes an enterprise-grade throttling engine to avoid bot detection, respect rate limits, and create realistic API traffic patterns. The system uses **profile-based configuration** for different testing scenarios.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    THROTTLING ARCHITECTURE                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐      ┌──────────────────┐                 │
│  │  ApiClient      │─────►│  BaseApiClient   │                 │
│  │  (Legacy Wrap)  │      │  (Throttled)     │                 │
│  └─────────────────┘      └────────┬─────────┘                 │
│                                     │                           │
│         ┌───────────────────────────┼───────────────────┐       │
│         │                           │                   │       │
│         ▼                           ▼                   ▼       │
│  ┌──────────────┐          ┌───────────────┐  ┌──────────────┐ │
│  │  Semaphore   │          │    Profiles   │  │   Throttle   │ │
│  │  (Concurr.)  │          │  (4 Modes)    │  │   (Delays)   │ │
│  └──────────────┘          └───────────────┘  └──────────────┘ │
│         │                           │                   │       │
│         └───────────────────────────┼───────────────────┘       │
│                                     │                           │
│         ┌───────────────────────────┼───────────────────┐       │
│         │                           │                   │       │
│         ▼                           ▼                   ▼       │
│  ┌──────────────┐          ┌───────────────┐  ┌──────────────┐ │
│  │   Session    │          │  Rate Limit   │  │   Backoff    │ │
│  │   Manager    │          │   Tracker     │  │  (Retry)     │ │
│  └──────────────┘          └───────────────┘  └──────────────┘ │
│         │                           │                   │       │
│         └───────────────────────────┴───────────────────┘       │
│                                     │                           │
│                                     ▼                           │
│                            ┌────────────────┐                   │
│                            │  Fetch API     │                   │
│                            └────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Profiles** | `tests/api/utils/profiles.ts` | 4 preset throttling modes (stealth, normal, fast, burst) |
| **BaseApiClient** | `tests/api/clients/base.client.ts` | Abstract class with throttling logic |
| **Throttle Utils** | `tests/api/utils/throttle.ts` | Semaphore, jitter, backoff, rate limiting |
| **SessionManager** | `tests/api/utils/session-manager.ts` | Cookie persistence (singleton) |
| **RateLimitTracker** | `tests/api/utils/rate-limit-tracker.ts` | Response time tracking & reporting |
| **ApiClient** | `tests/api/client/apiClient.ts` | Legacy wrapper for backward compatibility |

---

### Throttling Profiles

The framework provides **4 built-in profiles** controlled by the `API_PROFILE` environment variable.

#### 🎭 **STEALTH** - Maximum Caution

**Use for:** External APIs with aggressive bot detection (Cloudflare, rate limits)

```bash
# Linux/macOS
API_PROFILE=stealth npm run test:api

# Windows PowerShell
$env:API_PROFILE="stealth"; npm run test:api

# Windows CMD
set API_PROFILE=stealth && npm run test:api

# Or use the pre-configured npm script (works everywhere)
npm run test:api
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| Request Delay | 2-5 seconds | Mimics slow human reading |
| Session Gap | 10-30 seconds | Coffee breaks between test suites |
| Jitter | 40% | High unpredictability |
| Max Parallel | **1** | Strictly sequential |
| Backoff | Progressive | Exponential on errors |
| Cookies | Persistent | Session continuity |

**Perfect for:**
- Production API testing
# Linux/macOS
API_PROFILE=normal npm run test:api

# Windows PowerShell
$env:API_PROFILE="normal"; npm run test:api

# Windows CMD
set API_PROFILE=normal && npm run test:api

# Or use the pre-configured npm script (works everywhere)
npm run test:api:normal
---

#### 🚶 **NORMAL** - Balanced Speed

**Use for:** Staging environments, moderate rate limits

```bash
API_PROFILE=normal npm run test:api
# OR omit (default)
npm run test:api
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| Request Delay | 0.5-1.5 seconds | Natural browsing pace |
# Use the pre-configured npm script (works on all platforms)
npm run test:api:fast

# Or set manually:
# Linux/macOS: API_PROFILE=fast npm run test:api
# Windows PowerShell: $env:API_PROFILE="fast"; npm run test:api
# Windows CMD: set API_PROFILE=fast && npm run test:apiuses between suites |
| Jitter | 25% | Moderate randomization |
| Max Parallel | **2** | Limited concurrency |
| Backoff | Progressive | Exponential on errors |
| Cookies | Persistent | Session aware |

**Perfect for:**
- Staging/test environments
- Daily regression runs
- APIs with 50-100 req/min limits

---

#### ⚡ **FAST** - Quick Execution

**Use for:** Internal APIs, developer testing

```bash
# Use the pre-configured npm script (works on all platforms)
npm run test:api:ci

# Or set manually:
# Linux/macOS: API_PROFILE=burst npm run test:api
# Windows PowerShell: $env:API_PROFILE="burst"; npm run test:api
# Windows CMD: set API_PROFILE=burst && npm run test:apst
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| Request Delay | 0-100ms | Minimal throttling |
| Session Gap | 0ms | No suite delays |
| Jitter | 10% | Small randomization |
| Max Parallel | **10** | High concurrency |
| Backoff | None | Quick retries |
| Cookies | Disabled | Stateless |

**Perfect for:**
- Developer smoke tests
- Internal APIs (no rate limits)
- Quick debugging runs

---

#### 🚀 **BURST** - CI/CD Mode

**Use for:** Continuous integration pipelines, mock servers

```bash
API_PROFILE=burst npm run test:api:ci
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| Request Delay | **0ms** | Zero throttling |
| Session Gap | **0ms** | No delays |
| Jitter | **0%** | Deterministic |
| Max Parallel | **20** | Maximum speed |
| Backoff | Minimal | Fast retries (100-300ms) |
| Mocks | **Enabled** | Use mock server |

**Perfect for:**
- CI/CD pipelines (GitHub Actions, Jenkins)
- Mock API testing
- Unit-level API tests

---

### Configuration

#### Environment Variables

The framework now includes `cross-env` to support cross-platform environment variables.

**Universal Syntax (Recommended):**
```bash
# Select throttling profile (default: stealth)
npx cross-env API_PROFILE=stealth npm run test:api    # Maximum caution
npx cross-env API_PROFILE=normal npm run test:api     # Balanced
npx cross-env API_PROFILE=fast npm run test:api       # Quick execution
npx cross-env API_PROFILE=burst npm run test:api      # CI/CD mode

# Base URL (defaults to https://smart.md)
npx cross-env API_BASE_URL=https://staging.smart.md npm run test:api
```

**Linux/macOS (Bash/Zsh):**
```bash
# Select throttling profile (default: stealth)
API_PROFILE=stealth npm run test:api        # Maximum caution
API_PROFILE=normal npm run test:api         # Balanced
API_PROFILE=fast npm run test:api           # Quick execution
API_PROFILE=burst npm run test:api          # CI/CD mode
```

**Windows PowerShell:**
```powershell
# Select throttling profile (default: stealth)
$env:API_PROFILE="stealth"; npm run test:api    # Maximum caution
$env:API_PROFILE="normal"; npm run test:api     # Balanced
$env:API_PROFILE="fast"; npm run test:api       # Quick execution
$env:API_PROFILE="burst"; npm run test:api      # CI/CD mode
```

**Windows CMD:**
```cmd
# Select throttling profile (default: stealth)
set API_PROFILE=stealth && npm run test:api     # Maximum caution
set API_PROFILE=normal && npm run test:api      # Balanced
set API_PROFILE=fast && npm run test:api        # Quick execution
set API_PROFILE=burst && npm run test:api       # CI/CD mode
```

# Request timeout
set API_REQUEST_TIMEOUT=30000 && npm run test:api

# Maximum retry attempts
set API_MAX_RETRIES=3 && npm run test:api
```

#### NPM Scripts (Pre-configured)

```bash
# Stealth mode (production testing)
npm run test:api            # Uses stealth profile
npm run test:api:smoke      # Smoke tests with stealth

# Normal mode (staging)
npm run test:api:normal     # Balanced profile

# Fast mode (development)
npm run test:api:fast       # Quick execution

# Burst mode (CI/CD)
npm run test:api:ci         # Zero delays, mocks enabled
```

---

### How It Works

#### 1. **Request Flow**

When you call `api.get('/endpoint')`, the system:

```
1. Acquire semaphore slot      (limits concurrency)
2. Wait for rate limit window  (prevents 429 errors)
3. Apply jitter delay          (randomization)
4. Apply session cookies       (persistence)
5. Execute fetch with timeout  (30s default)
6. Track response time         (statistics)
7. Handle errors with backoff  (retry logic)
8. Release semaphore slot      (allow next request)
```

#### 2. **Semaphore (Concurrency Control)**

Prevents too many parallel requests:

```typescript
// STEALTH: maxParallel = 1
// Only 1 request at a time across ALL tests

// NORMAL: maxParallel = 2
// Up to 2 requests simultaneously

// FAST: maxParallel = 10
// Up to 10 requests in parallel
```

**Important:** Playwright's `workers` setting is automatically limited based on profile (see `playwright.config.ts`).

#### 3. **Jitter (Unpredictability)**

Adds random variance to delays to avoid patterns:

```typescript
// Base delay: 1000ms
// Jitter 25%: actual delay = 750ms - 1250ms
```

#### 4. **Progressive Backoff**

On consecutive errors, delays increase exponentially:

```
Error 1: Wait 2s
Error 2: Wait 4s
Error 3: Wait 8s
Error 4: Wait 16s
```

#### 5. **Session Management**

Persists cookies across requests (for profiles with `cookiePersistence: true`):

```typescript
// Automatic cookie handling
await api.get('/login');           // Sets auth cookie
await api.get('/profile');         // Uses same cookie
await api.get('/cart');            // Session maintained
```

---

### Usage in Tests

#### Automatic Throttling

All API calls through `ApiClient` are automatically throttled:

```typescript
// tests/api/specs/catalog.api.spec.ts
import { ApiClient } from '../client/apiClient';

test('search products', async () => {
    const api = new ApiClient();
    
    // Automatically throttled based on API_PROFILE
    const result = await api.get('/api/search', { 
        params: { q: 'iPhone' } 
    });
    
    expect(result.data.results.length).toBeGreaterThan(0);
});
```

#### Manual Profile Selection

Override the default profile in code:

```typescript
// For urgent debugging (skip delays)
process.env.API_PROFILE = 'fast';
const api = new ApiClient();

// For production testing
process.env.API_PROFILE = 'stealth';
const api = new ApiClient();
```

#### Rate Limit Statistics

Get request statistics after tests:

```typescript
import { RateLimitTracker } from '../utils/rate-limit-tracker';

test.afterAll(() => {
    const tracker = RateLimitTracker.getInstance();
    const stats = tracker.getStats();
    
    console.log(`Total requests: ${stats.totalRequests}`);
    console.log(`Average response: ${stats.averageResponseTime}ms`);
    console.log(`Errors: ${stats.errors.total}`);
    console.log(`429 rate limits: ${stats.errors['429'] || 0}`);
});
```

---

### BDD Integration

Throttling works seamlessly with Cucumber/BDD tests:

```typescript
// tests/bdd/hooks.ts
import { ApiWorld } from './world';

Before(async function (this: ApiWorld) {
    // ApiClient inherits throttling from API_PROFILE
    this.api = new ApiClient();
});
**Linux/macOS:**
```bash
# Stealth mode
API_PROFILE=stealth npm run test:bdd:api:smoke

# Fast mode for development
API_PROFILE=fast npm run test:bdd:api

# CI/CD with mocks
API_PROFILE=burst npm run test:bdd:api:ci
```

**Windows PowerShell:**
```powershell
# Stealth mode
$env:API_PROFILE="stealth"; npm run test:bdd:api:smoke

# Fast mode for development
$env:API_PROFILE="fast"; npm run test:bdd:api

# CI/CD with mocks
$env:API_PROFILE="burst"; npm run test:bdd:api:ci
```

**Windows CMD:**
```cmd
# Stealth mode
set API_PROFILE=stealth && npm run test:bdd:api:smoke

# Fast mode for development
set API_PROFILE=fast && npm run test:bdd:api

# CI/CD with mocks
set API_PROFILE=burst &&h profiles:

```bash
# Stealth mode
API_PROFILE=stealth npm run test:bdd:api:smoke

# Fast mode for development
API_PROFILE=fast npm run test:bdd:api

# CI/CD with mocks
API_PROFILE=burst npm run test:bdd:api:ci
```

---

### Best Practices

#### ✅ **DO**

- Use `stealth` for production API testing
- Use `normal` for staging regression
- Use `fast` for local development
- Use `burst` for CI/CD with mocks
- Monitor `RateLimitTracker` stats to detect rate limiting
- Set `workers: 1` in Playwright config for stealth/normal profiles (auto-configured)

#### ❌ **DON'T**

- Don't use `burst` against production APIs
- Don't mix profiles in same test run
- Don't disable throttling for external APIs
- Don't forget to check `429` errors in stats
- Don't run parallel workers with `stealth` profile (breaks semaphore)

---

### Troubleshooting

#### Issue: "Too Many Requests (429)"

**Solution:** Switch to slower profile:

**Linux/macOS:**
``Linux/macOS
API_PROFILE=stealth npm run test:api

# Windows PowerShell
$env:API_PROFILE="stealth"; npm run test:api

# Windows CMD
set API_PROFILE=stealth &&
API_PROFILE=stealth npm run test:api
Linux/macOS
API_PROFILE=fast npm run test:api:fast

# Windows PowerShell
$env:API_PROFILE="fast"; npm run test:api:fast

# Windows CMD
set API_PROFILE=fast &&le ignored)
npm run test:api API_PROFILE=stealth
```

**Windows PowerShell:**
```powershell
# ✅ Correct
$env:API_PROFILE="stealth"; npm run test:api

# ❌ Wrong (syntax error)
API_PROFILE=stealth npm run test:api
```

**Windows CMD:**
```cmd
# ✅ Correct
set API_PROFILE=stealth && npm run test:api

# ❌ Wrong (syntax error)
API_PROFILE=stealth npm run test:api

**Solution:** Use faster profile for internal APIs:

```bash
# Safe for staging/dev environments
API_PROFILE=fast npm run test:api:fast
```

#### Issue: "Semaphore not working (parallel requests)"

**Solution:** Check Playwright workers config:

```typescript
// playwright.config.ts
workers: getWorkerCount(),  // Auto-limits for stealth/normal
```

Ensure `API_PROFILE` is set **before** running tests:

```bash
# ✅ Correct
API_PROFILE=stealth npm run test:api

# ❌ Wrong (profile ignored)
npm run test:api API_PROFILE=stealth
```

#### Issue: "Need custom profile"

**Solution:** Extend the `PROFILES` object:

```typescript
// tests/api/utils/profiles.ts

export const CUSTOM_PROFILE: ProfileConfig = {
    name: 'custom',
    requestDelay: { min: 1000, max: 2000 },
    sessionGap: { min: 3000, max: 5000 },
    jitterPercent: 30,
    maxParallel: 3,
    retryDelay: { min: 1000, max: 3000 },
    progressiveBackoff: true,
    cookiePersistence: true,
    useMocks: false,
};

// Add to map
PROFILES['custom'] = CUSTOM_PROFILE;
```

Then use:

```bash
API_PROFILE=custom npm run test:api
```

---

### Migration from Legacy System

#### Old Config (Deprecated)


# Linux/macOS
API_PROFILE=stealth npm run test:api

# Windows PowerShell
$env:API_PROFILE="stealth"; npm run test:api

# Windows CMD
set API_PROFILE=stealth && npm run test:api
```

The old `humanLike` and `humanSpeed` options are **deprecated** but still supported for backward compatibility. The system will log a migration warning.

---

### Cross-Platform Environment Variables

**Important:** The syntax for setting environment variables differs between operating systems.

| OS | Syntax | Example |
|----|--------|---------|
| **Linux/macOS** | `VAR=value command` | `API_PROFILE=stealth npm run test:api` |
| **Windows PowerShell** | `$env:VAR="value"; command` | `$env:API_PROFILE="stealth"; npm run test:api` |
| **Windows CMD** | `set VAR=value && command` | `set API_PROFILE=stealth && npm run test:api` |
| **cross-env (Universal)** | `cross-env VAR=value command` | `npx cross-env API_PROFILE=stealth npm run test:api` |

The project includes `cross-env` to simplify this. You can use the universal syntax on any platform.

    humanSpeed: 1.5
});
```

#### New Config (Recommended)

```bash
# ✅ Use environment variable
API_PROFILE=stealth npm run test:api
```

The old `humanLike` and `humanSpeed` options are **deprecated** but still supported for backward compatibility. The system will log a migration warning.

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
```

If seeing 429 errors, switch to slower profile (see examples above in "Issue: Too Many Requests").
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
// NEW: init() is no longer needed (but still works for backward compatibility)
Before(async function (this: ApiWorld) {
    // Simply create the client - it's ready immediately
    this.api = new ApiClient();
    
    // OR use the legacy method (logs deprecation warning)
    // await this.initApi();
});

After(async function (this: ApiWorld) {
    // Log stats
    const stats = this.api.getStats();
    console.log(`📊 Scenario stats: ${stats.totalRequests} requests, ${stats.averageResponseTime}ms avg`);
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

// Language is automatically included in headers by ApiClient
// BaseApiClient uses: 'Accept-Language': 'ru,ro;q=0.9,en;q=0.8'
```

#### 6. Rate Limiting (429 Errors)

```typescript
// Check stats after test run
const stats = api.getStats();
console.log(`429 errors: ${stats.errors['429'] || 0}`);

// If seeing 429s, switch to slower profile
// API_PROFILE=stealth npm run test:api
```

#### 7. Throttling Not Working (Requests Too Fast)

```bash
# Ensure API_PROFILE is set BEFORE npm command
✅ API_PROFILE=stealth npm run test:api
❌ npm run test:api API_PROFILE=stealth  # Wrong order!

# Check Playwright workers are limited
# See playwright.config.ts getWorkerCount()
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

### Component Quick Reference

| What | Where | Example |
|------|-------|---------|
| **Throttling** | `utils/profiles.ts` | `API_PROFILE=stealth` |
| **Core Client** | `clients/base.client.ts` | Abstract class with throttling |
| **Legacy Client** | `client/apiClient.ts` | Backward-compatible wrapper |
| **Utilities** | `utils/throttle.ts` | Semaphore, jitter, backoff |
| **Session** | `utils/session-manager.ts` | Cookie persistence |
| **Stats** | `utils/rate-limit-tracker.ts` | Response time tracking |
| HTTP calls | `actions/*.ts` | `searchProducts()` |
| Business rules | `assertions/*.ts` | `expectCartTotalCorrect()` |
| Test scenarios | `specs/*.api.spec.ts` | `test('add to cart')` |
| BDD scenarios | `features/*.feature` | `Scenario: Add to cart` |
| Step mapping | `steps/*.steps.ts` | `When('user adds...')` |
| Shared state | `world.ts` | `this.cart`, `this.api` |
| Configuration | `cucumber-api.config.js` | tags, timeout, format |

### Throttling Profiles Cheat Sheet

| Profile | Use Case | Delay | Parallel | Command |
|---------|----------|-------|----------|---------|
| 🎭 **stealth** | Production, bot detection | 2-5s | 1 | `API_PROFILE=stealth npm run test:api` |
| 🚶 **normal** | Staging, moderate limits | 0.5-1.5s | 2 | `npm run test:api:normal` |
| ⚡ **fast** | Development, internal APIs | 0-100ms | 10 | `npm run test:api:fast` |
| 🚀 **burst** | CI/CD, mocks | 0ms | 20 | `npm run test:api:ci` |

---

## Contact & Support

- **Framework Author**: QA Automation Team
- **Target Site**: [Smart.md](https://smart.md)
- **Languages**: Russian (RU), Romanian (RO)
- **Currency**: Moldovan Lei (MDL)

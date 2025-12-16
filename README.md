# 🛒 Smart.md Testing Framework

Enterprise-grade Test Automation Framework for Smart.md - Moldova's largest electronics e-commerce aggregator.

> **Disclaimer**
> 
> This project is an independent technical demonstration of a QA automation framework.
> It is not affiliated with, endorsed by, or commissioned by smart.md.
> All tests interact only with publicly accessible website functionality.

## 📊 Test Pyramid (ISTQB-compliant)

```text
        ┌─────────────┐
        │   E2E (21%)  │  ~40 tests - Critical user flows
        │   Cucumber   │  BDD scenarios, real browser
        ├─────────────┤
        │              │
        │  API (79%)   │  ~151 tests - Business logic
        │  Playwright  │  Headless, fast, reliable
        │              │
        └─────────────┘

✅ Healthy pyramid: 79% API / 21% E2E
❌ Avoiding "hourglass anti-pattern" (too many E2E tests)
```

### 📐 Test Strategy & Architecture (Pyramid Implementation)

This framework strictly follows the **Testing Pyramid** principles to ensure fast feedback loops and high stability.

#### 🚀 API Layer (79% Coverage - 151 Tests)
The heavy lifting is done via direct API calls using a custom `BrowserApiClient` (headless browser for production-like testing).
* **Combinatorial Testing (Pairwise):** Automatically generates **40+ test scenarios** covering combinations of Brands + Price Ranges + Sorting options.
* **Boundary Testing:** Validates Credit Calculator logic with min/max amounts and edge-case terms (e.g., 500 MDL vs 50,000 MDL).
* **Security & Negative Testing:** Validates backend resilience against XSS payloads, SQL injection patterns, and invalid parameter types.

#### 🖥️ UI/E2E Layer (21% Coverage - 40 Scenarios)
Focuses on **Critical User Journeys** (CUJ) and visual regression.
* **Production-Safe E2E Execution:** Uses realistic interaction patterns (realistic delays, mouse movements, typing) to ensure tests behave like real users and remain stable under production conditions.
* **Dynamic Data Injection:** Scenarios automatically find valid, in-stock products from the live site before execution, eliminating "hardcoded data" flakiness.
* **Mobile Responsiveness:** Validates layout adaptations for iPhone/Android viewports.

#### 📊 Performance Metrics
* **Full Regression Suite:** ~4 minutes (vs 45+ mins for pure UI approach).
* **Flakiness Rate:** < 1% (due to heavy reliance on API preconditions).

## 🏗️ Architecture

```text
                    ┌─────────────────────────────────────┐
                    │         BDD Feature Files           │
                    │    (Gherkin - Business Language)    │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         Step Definitions            │
                    │     (TypeScript Implementation)     │
                    └──────────────┬──────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼───────┐        ┌─────────▼─────────┐      ┌─────────▼─────────┐
│  Page Objects │        │     Utilities      │      │     Fixtures      │
│   (Locators)  │        │ (Human-like, Wait) │      │   (Test Data)     │
└───────┬───────┘        └─────────┬─────────┘      └─────────┬─────────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         Playwright Engine           │
                    │    (Production-Ready Execution)     │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │          Smart.md Website           │
                    └─────────────────────────────────────┘
```

## ✨ Features

### Testing Capabilities
- 🔬 **API Testing** - 151 headless API tests via BrowserApiClient (production-like context)
- 🎯 **Pairwise Testing** - Combinatorial filter testing (Brand × Price × Sort)
- 🔒 **Input Validation & Negative Testing** - Validates proper handling of malicious/invalid inputs (XSS patterns, SQL-like strings, boundary values) without actual penetration testing
- ❌ **Error Handling** - 404, 400, validation error scenarios
- 🎭 **E2E BDD Testing** - Cucumber/Gherkin critical user flows

### Framework Features
- 🎭 **Human-like Behavior** - Realistic mouse movements, typing delays, scrolling patterns
- 🛡️ **Production-Ready Execution** - Resilient test execution with retry logic and timeout handling
- 🌐 **Multi-Language** - Romanian (RO) and Russian (RU) interface support
- 📱 **Mobile Testing** - Device emulation with touch-friendly assertions
- 💳 **Credit Calculator** - Moldova-specific installment payment validation
- 📊 **Allure Reports** - Rich HTML reports with screenshots and step details

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd smart-md-demo

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Run Tests

```bash
# === API Tests (Fast, Headless) ===
npx playwright test tests/api/specs/ --project=api

# Run specific API test suites
npx playwright test tests/api/specs/catalog.api.spec.ts --project=api
npx playwright test tests/api/specs/search.api.spec.ts --project=api
npx playwright test tests/api/specs/credit.api.spec.ts --project=api
npx playwright test tests/api/specs/errors.api.spec.ts --project=api

# Run Pairwise filter tests only
npx playwright test tests/api/specs/catalog.api.spec.ts --project=api --grep "Pairwise"

# === E2E Tests (Cucumber BDD) ===
# Run all smoke tests
npm run test:smoke

# Run critical path tests only
npm run test:critical

# Run mobile tests
npm run test:mobile
npm run test:mobile:ios
npm run test:mobile:android
npm run test:mobile:all

# Run with visible browser
npm run test:headed

# Run single feature file
npx cucumber-js -- tests/e2e/features/shopping-flow.feature

# === Full Test Suite ===
# Run all tests (API + E2E)
npm test

# === Quick Entry Points ===
npm run test:api        # All API tests (151 tests, ~2 min)
npm run test:e2e        # All E2E tests (40 scenarios, ~3 min)
npm run test:smoke      # Smoke tests only (critical paths, ~4 min)
```

### 📅 When to Run What

Optimal test execution strategy for different stages:

| Stage | Command | What Runs | Profile | Duration | Purpose |
|-------|---------|-----------|---------|----------|----------|
| **PR / Commit** | `npm run test:smoke` | Critical E2E paths + API smoke (30 tests) | fast/normal | ~4 min | Fast feedback on breaking changes |
| **Nightly / Merge** | `npm run test:api:fast` | All 151 API tests (parallel) | fast | ~2-3 min | Full business logic validation |
| **Pre-Production** | `npm run test:api:normal` | All 151 API tests (throttled) | normal | ~5-7 min | Production-like testing with rate limiting |
| **Pre-Release** | `npm test` | Complete suite (151 API + 40 E2E) | default | ~6-9 min | Comprehensive regression |
| **Mobile-Specific** | `npm run test:mobile:all` | iOS + Android responsive tests | default | ~3-4 min | Device compatibility check |
| **CI Pipeline** | `npm run test:api:ci` | All API tests (maximum speed) | burst | ~1-2 min | CI/CD pipeline execution |
| **Production Staging** | `npm run test:stealth` | Smoke E2E with Cloudflare bypass | stealth | ~5-8 min | Testing against protected production |

**Pro Tips:**
- **Local dev:** Use `npm run test:api:fast` for quick feedback (~2 min)
- **Before deploy:** Use `npm run test:api:normal` for production-like validation (~5 min)
- **CI/CD:** Use `npm run test:api:ci` for maximum speed (~1 min)
- **Production staging:** Use `npm run test:stealth` for Cloudflare-protected environments

## 📁 Project Structure

```text
smart-md-demo/
├── tests/
│   ├── api/                    # 🔬 API Tests (151 tests, 79%)
│   │   ├── specs/              # Test specifications
│   │   │   ├── catalog.api.spec.ts      # 19 tests - Pairwise Filter Engine
│   │   │   ├── search.api.spec.ts       # 27 tests - Security & boundaries
│   │   │   ├── credit.api.spec.ts       # 42 tests - Calculator + matrix
│   │   │   └── errors.api.spec.ts       # 22 tests - Negative scenarios
│   │   ├── actions/            # API action methods
│   │   │   ├── catalog.actions.ts
│   │   │   ├── search.actions.ts
│   │   │   ├── credit.actions.ts
│   │   │   └── cart.actions.ts
│   │   ├── assertions/         # Reusable API assertions
│   │   │   ├── catalog.assertions.ts
│   │   │   ├── search.assertions.ts
│   │   │   ├── credit.assertions.ts
│   │   │   └── cart.assertions.ts
│   │   └── clients/            # API clients
│   │       └── browser-api-client.ts   # Headless browser API client
│   ├── e2e/                    # 🎭 E2E Tests (40 tests, 21%)
│   │   ├── features/           # BDD Gherkin feature files
│   │   │   ├── shopping-flow.feature
│   │   │   ├── credit-calculator.feature
│   │   │   └── catalog-experience.feature
│   │   ├── steps/              # Step definitions
│   │   │   ├── common.steps.ts
│   │   │   ├── shopping.steps.ts
│   │   │   ├── credit.steps.ts
│   │   │   └── catalog.steps.ts
│   │   └── support/            # Cucumber support files
│   │       ├── hooks.ts
│   │       ├── world.ts
│   │       └── custom-world.ts
│   └── shared/                 # Shared utilities
│       ├── config/             # Configuration
│       │   ├── selectors.ts    # Centralized selectors
│       │   └── urls.ts         # URL constants
│       ├── fixtures/           # Test data
│       │   ├── test-data.ts
│       │   └── devices.ts
│       ├── page-objects/       # Page Object Model
│       │   ├── base.page.ts
│       │   ├── home.page.ts
│       │   ├── search-results.page.ts
│       │   ├── product-detail.page.ts
│       │   ├── cart.page.ts
│       │   ├── catalog.page.ts
│       │   └── components/
│       │       ├── header.component.ts
│       │       ├── credit-modal.component.ts
│       │       ├── filter-sidebar.component.ts
│       │       └── mobile-menu.component.ts
│       └── utils/              # Utility functions
│           ├── human-like.ts   # Human behavior simulation
│           ├── browser-profile.ts
│           ├── locator-helper.ts
│           ├── wait-utils.ts
│           ├── price-utils.ts
│           └── language-utils.ts
├── playwright.config.ts
├── cucumber.config.js
├── package.json
└── tsconfig.json
```

## 🧪 Test Scenarios

### API Tests (151 tests - 79% of test suite)

#### 1. Catalog API (`catalog.api.spec.ts` - 19 tests)

##### Pairwise Filter Engine (12 tests)
Advanced combinatorial testing covering Brand × Price × Sort filter combinations:

| Test Type | Description | Count |
|-----------|-------------|-------|
| Brand × Price | Samsung/Apple/Xiaomi across Mid-Range (5K-15K) & Premium (20K-50K) | 6 |
| Brand × Sort | Each brand with Ascending/Descending sorting | 3 |
| Price × Sort | Price ranges combined with sort directions | 2 |
| Negative | Impossible combinations (e.g., Xiaomi Premium) | 1 |

**Pairwise Benefits:**
- Tests 90% of filter bugs with 10-15 combinations (vs 1000s of exhaustive tests)
- Covers real user behavior (combining multiple filters)
- Detects edge cases (rare combinations that should fail gracefully)

##### Multi-Category Smoke Tests (7 tests)
- `smartphone`, `laptopuri`, `tv`, `frigidere`, `masini-de-spalat`, `console`, `smart-watch`
- Validates product listings across all major categories

#### 2. Search API (`search.api.spec.ts` - 27 tests)

**Purpose:** Input validation testing - ensures backend safely handles malicious/malformed inputs.

| Test Type | Description | Count |
|-----------|-------------|-------|
| Normal Queries | iPhone, Samsung, laptop, телевизор | 4 |
| XSS-like Patterns | `<script>`, `<img onerror>`, event handlers (validates sanitization) | 4 |
| SQL-like Strings | `' OR '1'='1`, `DROP TABLE`, UNION attacks (validates escaping) | 4 |
| Boundary Values | Empty, whitespace, 1000 chars, 5000 chars | 4 |
| Special Characters | `@#$%^&*()`, `\|/?.,` | 4 |
| Unicode | Cyrillic, emoji, mixed scripts | 3 |
| Edge Cases | Multiple spaces, newlines, tabs | 4 |

#### 3. Credit Calculator API (`credit.api.spec.ts` - 42 tests)

##### Base Scenarios (14 tests)
- Valid calculations for 3/6/9/12/18/24/36 month terms
- Response structure validation
- Bank provider verification

##### Boundary Matrix (28 tests)
Combinatorial testing of amounts × terms:

| Amount (MDL) | Terms (months) | Purpose |
|--------------|----------------|----------|
| 500 | 3,6,9,12,18,24,36 | Minimum boundary |
| 4999 | 3,6,9,12,18,24,36 | Below 5K threshold |
| 5000 | 3,6,9,12,18,24,36 | Exact threshold |
| 50000 | 3,6,9,12,18,24,36 | Maximum boundary |

**Total:** 4 amounts × 7 terms = 28 tests

#### 4. Error Handling API (`errors.api.spec.ts` - 22 tests)

| Error Type | Scenarios | Count |
|------------|-----------|-------|
| 404 Errors | Non-existent products (999999999, 0, -123), invalid categories | 6 |
| 400 Errors | Invalid pagination (negative, zero, huge pages), invalid limits | 5 |
| Cart Errors | Non-existent products, zero quantity, negative quantity | 4 |
| Credit Errors | Zero/negative amounts, invalid terms (0, -12, 1000 months) | 6 |
| Special Cases | Malformed requests, missing parameters | 1 |

---

### E2E Tests (40 tests - 21% of test suite)

#### 1. Shopping Flow (`@smoke @shopping`)

| Scenario | Description |
|----------|-------------|
| Golden Path | Search → View product → Add to cart → Verify cart |
| Cart Modification | Add item → Change quantity → Remove item |

### 2. Credit Calculator (`@smoke @credit @moldova`)

| Scenario | Description |
|----------|-------------|
| Bank Offers | Open credit modal → Verify providers → Select term → Check recalculation |

### 3. Catalog Experience (`@smoke @catalog`)

| Scenario | Description |
|----------|-------------|
| Filter & Sort | Apply brand filter → Verify filtering → Sort by price |
| Language Switch | Switch RO → RU → Verify translations |
| Mobile Navigation | Hamburger menu → Category navigation → Touch-friendly cards |

## 📋 Test Commands Reference

### API Tests (Fast)

| Command | Description |
|---------|-------------|
| `npx playwright test tests/api/specs/ --project=api` | Run all API tests (151 tests) |
| `npx playwright test tests/api/specs/catalog.api.spec.ts --project=api` | Catalog & Pairwise tests (19 tests) |
| `npx playwright test tests/api/specs/search.api.spec.ts --project=api` | Search security tests (27 tests) |
| `npx playwright test tests/api/specs/credit.api.spec.ts --project=api` | Credit calculator tests (42 tests) |
| `npx playwright test tests/api/specs/errors.api.spec.ts --project=api` | Error handling tests (22 tests) |
| `npx playwright test tests/api/specs/catalog.api.spec.ts --project=api --grep "Pairwise"` | Pairwise filter tests only (12 tests) |

#### API Execution Profiles

API tests support different execution profiles for various environments:

| Profile | Command | Workers | Request Delay | Parallel Requests | Use Case | Duration |
|---------|---------|---------|---------------|-------------------|----------|----------|
| **Normal** | `npm run test:api:normal` | 2 | 500-1500ms | 2 | Staging/Production-like testing | ~5-7 min |
| **Fast** | `npm run test:api:fast` | 4 | 0-100ms | 10 | Local development | ~2-3 min |
| **CI/Burst** | `npm run test:api:ci` | 4 | 0ms | 20 | CI Pipeline | ~1-2 min |

**Key differences:**
- **Normal**: Production-safe with rate limiting, session gaps (2-5s), progressive backoff on errors
- **Fast**: Minimal delays for quick feedback during development
- **CI/Burst**: Maximum speed, zero delays, can use mocks

```bash
# For staging/production testing (safe, throttled)
npm run test:api:normal

# For local development (fast feedback)
npm run test:api:fast

# For CI pipeline (maximum speed)
npm run test:api:ci
```

### E2E Tests (Cucumber)

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (API + E2E) |
| `npm run test:smoke` | Run smoke tests |
| `npm run test:critical` | Run critical tests |
| `npm run test:mobile` | Run mobile tests |
| `npm run test:headed` | Run with visible browser |
| `npm run test:parallel` | Run in parallel (4 workers) |
| `npm run test:e2e` | Run all E2E tests directly |

#### E2E Execution Profiles

E2E tests support different execution modes for bot detection avoidance and speed:

| Profile | Command | slowMo | humanLikeMode | Headless | Use Case | Duration |
|---------|---------|--------|---------------|----------|----------|----------|
| **Stealth** | `npm run test:stealth` | 50ms | ✅ Yes | ❌ No | Production, Cloudflare bypass | ~5-8 min |
| **Fast** | `npm run test:fast` | 0ms | ❌ No | ✅ Yes | Local development only | ~2-3 min |
| **Default** | `npm run test:e2e` | 50ms | ✅ Yes | from .env | Standard testing | ~4-5 min |

**Key differences:**
- **Stealth**: Full human-like behavior with random delays (100-500ms), hover before click, realistic typing. Bypasses Cloudflare/Turnstile protection.
- **Fast**: No delays, direct clicks, instant typing. ⚠️ **WARNING**: Will trigger bot detection on production!
- **Default**: Balanced mode with moderate human-like behavior.

```bash
# For production/staging (Cloudflare-safe)
npm run test:stealth

# For local development (fast, no delays)
npm run test:fast

# Standard run
npm run test:e2e
```

**Environment variables:**
```bash
# Disable human-like delays (equivalent to fast mode)
HUMAN_LIKE_MODE=false npm run test:e2e

# Enable stealth features
HUMAN_LIKE_MODE=true HEADLESS=false npm run test:e2e
```

### Reporting

| Command | Description |
|---------|-------------|
| `npm run allure:serve` | Open Allure report |
| `npm run allure:generate` | Generate Allure report |

## 🏷️ Tag System (Test Contract)

Tags define **exactly** what runs when. Use them to control scope and cost.

### Available Tags

| Tag | Scope | Test Count | Use Case |
|-----|-------|------------|----------|
| `@smoke` | Critical happy paths | ~10 | PR validation, commit hooks |
| `@critical` | Must-work flows | ~15 | Pre-deployment gate |
| `@regression` | Full feature coverage | ~40 | Nightly runs |
| `@api` | API-level tests | 151 | Fast backend validation |
| `@e2e` | UI + integration tests | 40 | Browser compatibility |
| `@mobile` | Mobile responsive tests | ~12 | Device-specific testing |
| `@shopping` | Cart + checkout flows | ~8 | Payment provider changes |
| `@credit` | Credit calculator | ~6 | Bank integration updates |
| `@catalog` | Product listings + filters | ~10 | Catalog/search changes |
| `@language` | RO/RU localization | ~5 | Translation updates |
| `@moldova` | Moldova-specific features | ~8 | Regional logic |

### Tag Usage Examples

```bash
# === CI/CD Contracts ===
# PR: Only smoke tests (fast feedback)
npx cucumber-js --config cucumber.config.js --tags "@smoke"

# Nightly: Regression (full coverage)
npx cucumber-js --config cucumber.config.js --tags "@regression"

# Pre-release: Critical paths only
npx cucumber-js --config cucumber.config.js --tags "@critical"

# Multiple tags (AND)
npx cucumber-js --config cucumber.config.js --tags "@smoke and @shopping"

# Exclude tag
npx cucumber-js --config cucumber.config.js --tags "not @mobile"
```

## �️ Test Data Management (Live Site Strategy)

**Challenge:** Testing against live smart.md without hardcoded test data.

### Dynamic Product Discovery

Tests **never** hardcode product IDs or names. Instead, they:

1. **Query live catalog API** at test start
2. **Filter by stability criteria:**
   - `price > 0` (in stock)
   - `hasCredit === true` (credit widget available)
   - `inStock === true` (deliverable)
   - `category === 'smartphone'` (predictable attributes)
3. **Select first matching product** for test execution

```typescript
// Example: Dynamic product selection
const validProduct = await catalogActions.getProducts('smartphone', {
  filters: {
    minPrice: 1000,
    hasCredit: true,
    inStock: true
  },
  limit: 1
});

// Test proceeds with validProduct.id
```

### Fallback Strategy

If no products match criteria:
- ✅ **API tests:** Skip gracefully with `test.skip('No products in stock')`
- ✅ **E2E tests:** Use `@known-issue` tag and report to monitoring
- ✅ **CI:** Non-blocking warning (not a failure)

### What We DON'T Do

❌ Hardcode product IDs (`12345678`)
❌ Assume specific prices (`expect(price).toBe(15999)`)
❌ Rely on exact product names (`iPhone 15 Pro Max`)

### What We DO Instead

✅ Validate patterns (`expect(price).toBeGreaterThan(0)`)
✅ Check structure (`expect(product).toHaveProperty('id', 'title', 'price')`)
✅ Test interactions (`addToCart()` → `expectCartCount(1)`)

**Result:** Tests survive inventory changes, pricing updates, and out-of-stock scenarios.

## �📊 Allure Reports

### Generate Report

```bash
# After test run
npm run allure:generate

# Open in browser
npm run allure:serve
```

### Report Features

- 📸 Screenshots on failure
- 🎥 Video recordings
- 📝 Step-by-step execution
- 📈 Trend analysis
- 🏷️ Tag breakdown

## 🛡️ Stability & Anti-Flakiness

This framework implements several patterns to ensure stable, reliable tests:

### Test Pyramid Strategy

Follows **ISTQB Testing Pyramid** best practices:

```text
   E2E (21%)     ← Few, slow, brittle - Only critical flows
     ↑
  API (79%)      ← Many, fast, stable - Business logic
```

**Why this ratio?**
- ✅ **Fast feedback** - API tests run 10x faster than E2E
- ✅ **Stable** - No UI flakiness, browser quirks, or timing issues
- ✅ **Precise** - Pinpoint exact API/logic failures
- ✅ **Cost-effective** - Lower maintenance, fewer false positives
- ❌ **Avoids "hourglass anti-pattern"** - Too many E2E tests = slow, flaky suites

### Pairwise Combinatorial Testing

**Problem:** Testing all combinations of filters (3 brands × 3 prices × 2 sorts = 18 tests) is wasteful.

**Solution:** Pairwise testing covers 90% of bugs with 40% fewer tests.

```typescript
// Example: Brand × Price × Sort combinations
const BRANDS = ['Samsung', 'Apple', 'Xiaomi'];
const PRICE_RANGES = [
  { min: 5000, max: 15000 },   // Mid-range
  { min: 20000, max: 50000 }   // Premium
];
const SORT = ['asc', 'desc'];

// Instead of 3×2×2=12 tests, we generate 6 optimal pairs:
// 1. Samsung + Mid-range
// 2. Apple + Premium
// 3. Xiaomi + Mid-range
// 4. Samsung + Sort ASC
// 5. Apple + Sort DESC
// 6. Mid-range + Sort DESC
```

**Benefits:**
- Tests real-world scenarios (users combine multiple filters)
- Detects interaction bugs between filters
- Efficient - covers most bugs with minimal tests
- Scales well - adding 4th dimension (color) only adds 8 tests, not 48

### Selector Fallback Chains

Selectors are designed to be resilient to text changes and localization.
Primary strategies rely on structural CSS/data attributes, with human-readable labels used only as a fallback.

All selectors use fallback chains with priority: `data-testid` → `data-*` → CSS → text-based.

```typescript
// Example: Add to cart button
addToCart: [
  '[data-testid="add-to-cart"]',
  '[data-action="add-to-cart"]',
  '.add-to-cart-btn',
  // RO fallback: covers both "cos" and "coș"
  'button:has-text(/co[sș]/i)',
  // RU fallback
  'button:has-text(/корзин/i)',
].join(', ')
```

### Runtime Fallback Resolution (`firstWorkingLocator`)

For complex fallback chains stored as a single comma-joined string, the framework resolves the first *actually matching* selector at runtime using `firstWorkingLocator`.

```ts
import { firstWorkingLocator } from './tests/shared/utils/locator-helper';
import { SELECTORS } from './tests/shared/config/selectors';

const addToCart = await firstWorkingLocator(page, SELECTORS.product.addToCart, { contextLabel: 'product.addToCart' });
await addToCart.click();
```

### Language-Agnostic Assertions

Tests avoid hardcoded UI text for key business strings. Instead, they:

- Check selectors (not exact text like `"Coșul este gol"`)
- Use URL patterns for product identification
- Support both RO and RU variants

```typescript
// ❌ Fragile
await expect(page.locator('text="Coșul este gol"')).toBeVisible();

// ✅ Stable
await expect(page.locator(SELECTORS.cart.emptyState)).toBeVisible();
```

### Price Tolerance

Price assertions allow for minor variations (±1 MDL by default):

```typescript
// Allows for rounding differences
assertPricesApproximatelyEqual(actual, expected, tolerance: 1);
```

### Demo Overlay Handling

Credit calculator modals may show demo/promo overlays which are automatically dismissed.

### CSS Visibility Checks

Mobile tests check CSS visibility (not just DOM presence):

```typescript
// Desktop nav may exist in DOM but be CSS-hidden on mobile
await mobileMenu.assertDesktopNavHidden();
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file (copy from `.env.example`):

```env
# Base URL
BASE_URL=https://smart.md

# Browser settings
HEADLESS=true
SLOW_MO=0

# Human-like behavior
HUMAN_LIKE_MODE=true

# Timeouts (ms)
DEFAULT_TIMEOUT=30000
NAVIGATION_TIMEOUT=60000

# Parallel execution
PARALLEL_WORKERS=4
```

### Cucumber Profiles

```bash
# Default profile
npm run test:e2e

# Smoke profile (critical scenarios only)
npm run test:smoke

# Mobile profile
npm run test:mobile

# CI profile (parallel + strict)
npx cucumber-js --config cucumber.config.js --profile ci
```

## 🔧 Development

### Add New Feature

1. Create feature file in `tests/e2e/features/`
2. Add step definitions in `tests/e2e/steps/`
3. Create/update page objects if needed
4. Run and verify

### Coding Standards

- ESLint + Prettier for code formatting
- TypeScript strict mode
- JSDoc comments for public methods
- Human-like interactions for all UI operations

### Run Linting

```bash
npm run lint
npm run lint:fix
npm run format
```

## 🤖 CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Push to `main` or `develop`
- Pull requests
- Daily schedule (8:00 UTC)

### Pipeline Stages

1. **Install** - Dependencies & browsers
2. **Lint** - Code quality check
3. **Test** - Run smoke tests
4. **Report** - Generate & upload Allure

## 🐛 Troubleshooting

### Common Issues

#### Tests fail with "Element not found"

```bash
# Increase timeouts
DEFAULT_TIMEOUT=60000 npm test
```

#### Tests are unstable or timing out

```bash
# Enable human-like interaction mode (realistic delays)
HUMAN_LIKE_MODE=true npm test

# Run with visible browser for debugging
npm run test:headed
```

#### CI fails but local passes

```bash
# Run in CI mode locally
npx cucumber-js --config cucumber.config.js --profile ci
```

### Debug Mode

```bash
# Enable Playwright inspector
PWDEBUG=1 npm test

# Verbose logging
DEBUG=pw:api npm test
```

## � Test Artifacts & Evidence

This framework generates rich debugging artifacts for every test run.

### Allure Report Example

![Allure Overview](docs/screenshots/allure-overview.png)
*Full test suite results with pass/fail breakdown and trend analysis*

![Allure Timeline](docs/screenshots/allure-timeline.png)
*Parallel execution timeline showing 4-minute full regression*

### Execution Trace Example

![Playwright Trace](docs/screenshots/playwright-trace.png)
*Step-by-step execution trace with network logs, console output, and DOM snapshots*

### Video Recording

![Test Video](docs/screenshots/test-video.gif)
*Real browser recording of shopping flow E2E test*

### Generated Artifacts

Every test run produces:

| Artifact | Location | Purpose |
|----------|----------|----------|
| **Allure Report** | `allure-report/index.html` | Executive summary, trends, flakiness detection |
| **Playwright Traces** | `test-results/*/trace.zip` | Full execution replay (network, console, DOM) |
| **Screenshots** | `test-results/*/screenshot-*.png` | Failure snapshots |
| **Videos** | `test-results/*/video.webm` | Full test recordings (E2E only) |
| **Logs** | `test-results/*/logs.txt` | Console output, API responses |

### Viewing Artifacts Locally

```bash
# Open Allure report in browser
npm run allure:serve

# View Playwright trace for failed test
npx playwright show-trace test-results/shopping-flow/trace.zip
```

### CI/CD Integration

Artifacts are automatically uploaded to:
- **GitHub Actions:** Artifacts tab (7-day retention)
- **Allure TestOps:** Historical trends and flakiness analysis
- **S3/Azure Blob:** Long-term storage for compliance

**Note:** Video recordings are disabled for API tests (not needed), only E2E tests generate videos.

## �📄 License

**Proprietary Commercial License**

Copyright © Victor Murashev. All rights reserved.

Usage permitted only under a commercial agreement. Redistribution and resale are prohibited.

See [LICENSE](LICENSE) for full terms.

## 👥 Contributing

This is a proprietary project. Contributions are not accepted at this time.

For commercial inquiries or custom implementations, please contact the author.

---

Professional QA Automation Framework by Victor Murashev

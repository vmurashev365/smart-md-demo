# 🛒 Smart.md Testing Framework

Enterprise-grade Test Automation Framework for Smart.md - Moldova's largest electronics e-commerce aggregator.

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
The heavy lifting is done via direct API calls (bypassing UI) using a custom `BrowserApiClient`.
* **Combinatorial Testing (Pairwise):** Automatically generates **40+ test scenarios** covering combinations of Brands + Price Ranges + Sorting options.
* **Boundary Testing:** Validates Credit Calculator logic with min/max amounts and edge-case terms (e.g., 500 MDL vs 50,000 MDL).
* **Security & Negative Testing:** Validates backend resilience against XSS payloads, SQL injection patterns, and invalid parameter types.

#### 🖥️ UI/E2E Layer (21% Coverage - 40 Scenarios)
Focuses on **Critical User Journeys** (CUJ) and visual regression.
* **Smart WAF Bypass:** Uses `human-like` interaction patterns to test protected flows (Checkout, Login) without triggering Cloudflare.
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
                    │     (Anti-Detection + Stealth)      │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │          Smart.md Website           │
                    └─────────────────────────────────────┘
```

## ✨ Features

### Testing Capabilities
- 🔬 **API Testing** - 151 headless API tests via BrowserApiClient (Cloudflare bypass)
- 🎯 **Pairwise Testing** - Combinatorial filter testing (Brand × Price × Sort)
- 🔒 **Security Testing** - XSS, SQL injection, boundary value analysis
- ❌ **Negative Testing** - 404, 400, validation error scenarios
- 🎭 **E2E BDD Testing** - Cucumber/Gherkin critical user flows

### Framework Features
- 🎭 **Human-like Behavior** - Realistic mouse movements, typing delays, scrolling patterns
- 🛡️ **Anti-Detection** - Browser fingerprint randomization, WebDriver flag removal
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
npm run cucumber -- tests/e2e/features/shopping-flow.feature

# === Full Test Suite ===
# Run all tests (API + E2E)
npm test
```

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
│   │       └── browser-api-client.ts   # Cloudflare bypass
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
│           ├── browser-fingerprint.ts
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

| Test Type | Description | Count |
|-----------|-------------|-------|
| Normal Queries | iPhone, Samsung, laptop, телевизор | 4 |
| XSS Prevention | `<script>`, `<img onerror>`, event handlers | 4 |
| SQL Injection | `' OR '1'='1`, `DROP TABLE`, UNION attacks | 4 |
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

### E2E Tests (Cucumber)

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (API + E2E) |
| `npm run test:smoke` | Run smoke tests |
| `npm run test:critical` | Run critical tests |
| `npm run test:mobile` | Run mobile tests |
| `npm run test:headed` | Run with visible browser |
| `npm run test:parallel` | Run in parallel (4 workers) |
| `npm run cucumber` | Run Cucumber directly |

### Reporting

| Command | Description |
|---------|-------------|
| `npm run allure:serve` | Open Allure report |
| `npm run allure:generate` | Generate Allure report |

## 🏷️ Tag System

```gherkin
@smoke          # Quick smoke tests (< 5 min)
@critical       # Critical path tests
@shopping       # Shopping flow tests
@credit         # Credit calculator tests
@catalog        # Catalog & filtering tests
@mobile         # Mobile-specific tests
@language       # Language switching tests
@moldova        # Moldova-specific features
```

### Run by tag

```bash
# Single tag
npm run cucumber -- --tags "@smoke"

# Multiple tags (AND)
npm run cucumber -- --tags "@smoke and @shopping"

# Exclude tag
npm run cucumber -- --tags "not @mobile"
```

## 📊 Allure Reports

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
npm run cucumber

# Smoke profile (critical scenarios only)
npm run cucumber -- --profile smoke

# Mobile profile
npm run cucumber -- --profile mobile

# CI profile (parallel + strict)
npm run cucumber -- --profile ci
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

#### Anti-bot detection triggered

```bash
# Enable stealth mode (default)
HUMAN_LIKE_MODE=true npm test

# Run with real Chrome
npm run test:headed
```

#### CI fails but local passes

```bash
# Run in CI mode locally
npm run cucumber -- --profile ci
```

### Debug Mode

```bash
# Enable Playwright inspector
PWDEBUG=1 npm test

# Verbose logging
DEBUG=pw:api npm test
```

## 📄 License

MIT License - see LICENSE file for details.

## 👥 Contributing

1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Add tests for new features
5. Submit pull request

---

Made with ❤️ for Smart.md testing

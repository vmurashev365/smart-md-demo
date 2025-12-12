# 🛒 Smart.md E2E Testing Framework

Enterprise-grade Smoke Testing Framework for Smart.md - Moldova's largest electronics e-commerce aggregator.

## 🏗️ Architecture

```
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

- 🎭 **Human-like Behavior** - Realistic mouse movements, typing delays, and scrolling patterns
- 🛡️ **Anti-Detection** - Browser fingerprint randomization, WebDriver flag removal
- 🌐 **Multi-Language** - Support for Romanian (RO) and Russian (RU) interfaces
- 📱 **Mobile Testing** - Device emulation with touch-friendly assertions
- 💳 **Credit Calculator Testing** - Moldova-specific installment payment validation
- 📊 **Allure Reports** - Rich HTML reports with screenshots and step details
- 🏷️ **Tag-based Execution** - Run smoke, critical, or mobile tests separately

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
# Run all smoke tests
npm run test:smoke

# Run critical path tests only
npm run test:critical

# Run mobile tests
npm run test:mobile

# Run with visible browser
npm run test:headed

# Run single feature file
npm run cucumber -- tests/e2e/features/shopping-flow.feature
```

## 📁 Project Structure

```
smart-md-demo/
├── tests/
│   ├── e2e/
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
│   └── shared/
│       ├── config/             # Shared configuration
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
│           ├── wait-utils.ts
│           ├── price-utils.ts
│           └── language-utils.ts
├── playwright.config.ts
├── cucumber.config.js
├── package.json
└── tsconfig.json
```

## 🧪 Test Scenarios

### 1. Shopping Flow (`@smoke @shopping`)

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

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:smoke` | Run smoke tests |
| `npm run test:critical` | Run critical tests |
| `npm run test:mobile` | Run mobile tests |
| `npm run test:headed` | Run with visible browser |
| `npm run test:parallel` | Run in parallel (4 workers) |
| `npm run cucumber` | Run Cucumber directly |
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

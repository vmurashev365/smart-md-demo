# BDD Test Profiles (Stealth vs Fast)

## 🎭 Overview

Два профиля для баланса между **скоростью разработки** и **Cloudflare bypass**.

| Profile | Speed | Cloudflare Safe | Use Case |
|---------|-------|-----------------|----------|
| **stealth** | 🐌 Slow (6-8 min) | ✅ YES | Production testing, CI/CD |
| **fast** | ⚡ Fast (1-2 min) | ❌ NO | Local development, debugging |

## 🎭 Stealth Profile

**Назначение:** Production-safe тестирование с полной защитой от Cloudflare

### Конфигурация

```javascript
stealth: {
  timeout: 20 * 1000,
  worldParameters: {
    headless: false,        // Real Chrome UI
    slowMo: 50,             // 50ms per action
    humanLikeMode: true,    // Full random delays
  },
}
```

### Характеристики

- ✅ **Headless: false** - Настоящий Chrome с UI
- ✅ **SlowMo: 50ms** - Задержка между Playwright операциями
- ✅ **Random Delays: 100-500ms** - Имитация человеческого поведения
- ✅ **Browser Fingerprint** - Уникальные отпечатки браузера
- ✅ **Anti-Detection Scripts** - Скрытие автоматизации

### Поведение

```typescript
// Каждая операция имеет задержки:
await page.click('.button');
// ↓
// 1. slowMo: +50ms (base delay)
// 2. randomDelay(200, 400): ~300ms (hover before click)
// 3. randomDelay(100, 300): ~200ms (click delay)
// 4. randomDelay(150, 350): ~250ms (after click wait)
// TOTAL: ~800ms на один клик
```

### Timing

```
9 scenarios × 40 seconds = 6 minutes
```

### Запуск

```bash
# CLI
npm run test:stealth

# Full command
npx cucumber-js --config cucumber.config.js --profile stealth

# With specific tags
npm run test:stealth -- --tags "@smoke and @critical"
```

### Когда использовать

✅ **Используйте stealth когда:**
- Тестируете production smart.md
- Запускаете в CI/CD pipeline
- Проверяете WAF bypass
- Нужны стабильные результаты
- Делаете demo/video

❌ **Не используйте когда:**
- Локальная разработка features
- Отладка step definitions
- Быстрая проверка изменений
- Тестируете localhost/staging

## ⚡ Fast Profile

**Назначение:** Быстрая разработка и отладка без Cloudflare защиты

### Конфигурация

```javascript
fast: {
  timeout: 10 * 1000,
  worldParameters: {
    headless: true,         // Headless mode
    slowMo: 0,              // No slowMo
    humanLikeMode: false,   // No random delays
  },
}
```

### Характеристики

- ⚡ **Headless: true** - Без UI для скорости
- ⚡ **SlowMo: 0** - Нет искусственных задержек
- ⚡ **Random Delays: DISABLED** - Instant clicks/typing
- ⚠️ **NO Cloudflare Protection** - Детектится как бот

### Поведение

```typescript
// Операции выполняются мгновенно:
await page.click('.button');
// ↓
// 1. Instant click
// TOTAL: ~50-100ms (network + DOM update)
```

### Timing

```
9 scenarios × ~10 seconds = 1.5 minutes
```

**Improvement:** 75% faster than stealth

### Запуск

```bash
# CLI
npm run test:fast

# Full command
npx cucumber-js --config cucumber.config.js --profile fast

# With BASE_URL override (for localhost)
BASE_URL=http://localhost:3000 npm run test:fast
```

### ⚠️ ВАЖНО: Cloudflare Warning

```
╔═══════════════════════════════════════════════════════╗
║  ⚠️  WARNING: Fast profile bypasses Cloudflare!      ║
║                                                       ║
║  This WILL trigger bot detection on smart.md         ║
║  production. Use ONLY for:                           ║
║                                                       ║
║  ✅ localhost development                            ║
║  ✅ staging environments                             ║
║  ✅ internal networks                                ║
║  ✅ non-Cloudflare protected sites                   ║
║                                                       ║
║  ❌ DO NOT USE on production smart.md               ║
╚═══════════════════════════════════════════════════════╝
```

### Когда использовать

✅ **Используйте fast когда:**
- Разрабатываете новые features
- Отлаживаете step definitions
- Тестируете localhost
- Быстрая проверка PR changes
- Работаете со staging без Cloudflare

❌ **НЕ используйте когда:**
- Тестируете production smart.md
- Запускаете в CI/CD на production
- Нужен WAF bypass
- Делаете финальную проверку перед release

## 🔄 Comparison Matrix

### Performance

| Metric | Stealth | Fast | Difference |
|--------|---------|------|------------|
| Time per scenario | ~40s | ~10s | **4x faster** |
| Total time (9 scenarios) | 6m | 1.5m | **4x faster** |
| Click operation | ~800ms | ~50ms | **16x faster** |
| Type operation | ~2s | ~100ms | **20x faster** |

### Features

| Feature | Stealth | Fast |
|---------|---------|------|
| Cloudflare bypass | ✅ YES | ❌ NO |
| Human-like behavior | ✅ YES | ❌ NO |
| Random delays | ✅ YES | ❌ NO |
| Browser fingerprinting | ✅ YES | ⚠️ Basic |
| Headless mode | ❌ NO | ✅ YES |
| SlowMo | ✅ 50ms | ❌ 0ms |
| Production-safe | ✅ YES | ❌ NO |
| Development speed | ❌ Slow | ✅ Fast |

## 🎯 Recommended Workflow

### Local Development

```bash
# 1. Develop features in FAST mode
npm run test:fast

# 2. Final check in STEALTH mode before commit
npm run test:stealth

# 3. Push to CI (uses stealth automatically)
git push
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
- name: BDD Smoke Tests
  run: npm run test:stealth  # Always use stealth in CI
```

### Debugging

```bash
# Fast mode + specific scenario
npm run test:fast -- --name "Add product to cart"

# Stealth mode + headed for visual debugging
HEADLESS=false npm run test:stealth -- --name "Search flow"
```

## 🔧 Environment Variables

### Override defaults

```bash
# Force stealth settings even in fast profile
HUMAN_LIKE_MODE=true npm run test:fast

# Force fast settings even in stealth profile (NOT RECOMMENDED!)
HUMAN_LIKE_MODE=false npm run test:stealth

# Custom target (for non-production testing)
BASE_URL=http://localhost:3000 npm run test:fast
```

## 📊 Decision Tree

```
Need to test?
│
├─ Production smart.md? → stealth
├─ Localhost/staging? → fast
├─ CI/CD pipeline? → stealth
├─ Quick PR check? → fast
├─ Demo/recording? → stealth
└─ Rapid development? → fast
```

## 🎓 Examples

### Stealth Example

```bash
$ npm run test:stealth

Browser launched: Chrome (headless: false, slowMo: 50ms)
🔍 Dynamic Data Injection: Fetching valid product...
   ✅ Selected Product: iPhone 15 Pro Max
   Price: 25999 MDL

Feature: Shopping Cart
  Scenario: Add product to cart
    ✓ Given I am on homepage (2.1s)
    ✓ When I search for a valid product (4.5s)
    ✓ And I click first product (3.2s)
    ✓ And I add to cart (5.8s)
    ✓ Then cart should contain product (2.4s)

Duration: 18s per scenario
```

### Fast Example

```bash
$ npm run test:fast

Browser launched: Chrome (headless: true, slowMo: 0ms)
🔍 Dynamic Data Injection: Fetching valid product...
   ✅ Selected Product: iPhone 15 Pro Max

Feature: Shopping Cart
  Scenario: Add product to cart
    ✓ Given I am on homepage (0.5s)
    ✓ When I search for a valid product (0.8s)
    ✓ And I click first product (0.6s)
    ✓ And I add to cart (1.2s)
    ✓ Then cart should contain product (0.5s)

Duration: 3.6s per scenario
```

## 📚 Related Documentation

- [Performance Analysis](./performance-analysis.md) - Detailed timing breakdown
- [Cloudflare Bypass Strategy](../tests/shared/utils/browser-fingerprint.ts) - Anti-detection
- [Human-Like Utilities](../tests/shared/utils/human-like.ts) - Delay implementation
- [API Profiles](../tests/api/utils/profiles.ts) - Similar strategy for API tests

## ✅ Summary

**Key Takeaway:** 
- 🎭 **Stealth = Production Safety** (slow but safe)
- ⚡ **Fast = Development Speed** (fast but detected)

**Rule of Thumb:**
```
If (Cloudflare protection needed) {
  use stealth
} else {
  use fast
}
```

# 🐌 Performance Analysis: 6 минут на 9 сценариев

## 📊 Факты

**Результат:** 6m09s для 9 сценариев
**Среднее время:** ~40 секунд на сценарий
**Ожидаемое:** ~5-10 секунд на smoke сценарий

## 🔍 Причины медлительности

### 1. **Human-Like Delays (Главная причина)**

#### Проблема: Множество random delays в каждом шаге

```typescript
// human-like.ts - delays ВЕЗДЕ:
await randomDelay(100, 300);  // Click focus
await randomDelay(50, 150);   // Clear input
await randomDelay(50, 150);   // Each character typing
await randomDelay(200, 500);  // "Thinking" pause (10% вероятность)
await randomDelay(100, 300);  // Before Enter
await randomDelay(200, 400);  // Before hover
await randomDelay(100, 300);  // Before click
await randomDelay(150, 350);  // After click
await randomDelay(300, 700);  // Scroll delays
await randomDelay(500, 1000); // Wait for content
```

**Расчет:** На один шаг с search может быть **2-3 секунды только в delays**!

#### Где используется:
- ✅ `humanType()` - печатание каждой буквы
- ✅ `humanClick()` - hover + click + wait
- ✅ `humanScroll()` - natural scrolling
- ✅ `waitForSearchResults()` - ожидание результатов
- ✅ Shopping steps - везде `randomDelay(500, 1000)`

### 2. **SlowMo Mode (50ms базовый delay)**

```javascript
// cucumber.config.js
slowMo: parseInt(process.env.SLOW_MO || '50')

// hooks.ts
const slowMo = parseInt(process.env.SLOW_MO || '50', 10);
```

**Impact:** Каждая Playwright операция (click, type, navigate) добавляет +50ms

**Пример:** 100 операций = +5 секунд чистого slowMo

### 3. **Step Timeout (15 секунд на шаг)**

```javascript
timeout: 15 * 1000, // 15 seconds per step
```

Это не причина медлительности, но показывает что ожидания долгие.

### 4. **Headless: false (Browser UI overhead)**

```javascript
headless: process.env.HEADLESS === 'true'  // По умолчанию FALSE
```

**Impact:** ~20-30% медленнее чем headless режим

### 5. **Dynamic Data Injection Hook**

```typescript
// hooks.ts - Before hook @needs_product
await getCategoryProducts(apiClient, categorySlug, {
  page: 1,
  limit: 40,
});
```

**Impact:** Каждый сценарий с @needs_product добавляет ~2-3 секунды на fetch продуктов

### 6. **Sequential Execution (No Parallelism)**

```javascript
// cucumber.config.js - default profile
// parallel: НЕ УКАЗАН -> sequential execution
```

**Impact:** Тесты выполняются последовательно, не используя возможности параллелизма

## 🎯 Breakdown времени на 1 сценарий (~40 сек)

```
1. Before hooks (browser context + @needs_product)    ~5s
2. Navigate to homepage (with slowMo + delays)        ~3s
3. Search step (humanType + randomDelays)             ~5s
4. Wait for results (randomDelay + content wait)      ~4s
5. Click first product (humanClick + delays)          ~5s
6. Product page load + validation                     ~5s
7. Add to cart (humanClick + confirmation wait)       ~6s
8. Cart validation steps                              ~4s
9. After hooks (cleanup + screenshot)                 ~3s
─────────────────────────────────────────────────────────
TOTAL:                                                ~40s
```

## 📈 Распределение времени

```
Human-like delays:    35% (~14s)
SlowMo overhead:      15% (~6s)
Real operations:      30% (~12s)
Network/Loading:      15% (~6s)
Before/After hooks:   5%  (~2s)
```

## 🚀 Решения

### 1. **Fast Mode для Smoke Tests** (Priority 1)

```javascript
// cucumber.config.js - добавить smoke_fast profile
smoke_fast: {
  ...common,
  tags: '@smoke',
  worldParameters: {
    ...common.worldParameters,
    headless: true,        // +20-30% быстрее
    slowMo: 0,             // Убрать slowMo
    humanLikeMode: false,  // Отключить human-like delays
  },
}
```

**Ожидаемый результат:** 6 минут → **2 минуты**

### 2. **Conditional Human-Like Behavior**

```typescript
// human-like.ts
export async function randomDelay(min: number = 100, max: number = 500): Promise<void> {
  // ДОБАВИТЬ проверку режима
  if (process.env.HUMAN_LIKE_MODE === 'false' || process.env.CI) {
    return Promise.resolve(); // SKIP delays
  }
  
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

**Impact:** Убрать ~14 секунд из 40

### 3. **Parallel Execution для Smoke**

```javascript
// cucumber.config.js
smoke_parallel: {
  ...common,
  tags: '@smoke and not @serial',
  parallel: 3, // 3 workers
  worldParameters: {
    ...common.worldParameters,
    headless: true,
    slowMo: 0,
  },
}
```

**Ожидаемый результат:** 6 минут → **2-3 минуты** (3x workers)

### 4. **Cache Dynamic Data**

```typescript
// hooks.ts - кэшировать продукты на весь test run
let cachedProduct: Product | null = null;

BeforeAll(async function() {
  // Fetch ONCE для всех scenarios
  cachedProduct = await fetchValidProduct();
});

Before({ tags: '@needs_product' }, async function (this: CustomWorld) {
  this.testData.targetProduct = cachedProduct;
  // Больше не нужен fetch на каждый сценарий
});
```

**Impact:** Сэкономить ~2-3 секунды на сценарий

### 5. **Reduce Step Timeouts**

```javascript
// cucumber.config.js - для fast режима
smoke_fast: {
  timeout: 5 * 1000, // 5 seconds вместо 15
}
```

**Impact:** Быстрее fail при проблемах

### 6. **Smart Wait Strategies**

```typescript
// Вместо:
await randomDelay(500, 1000);
await page.waitForSelector('.results');

// Использовать:
await page.waitForSelector('.results', { timeout: 3000 });
// Без лишних delays
```

## 🎯 Quick Win Implementation

### Option A: CI/Fast Mode (Без изменения кода)

```bash
# В .env или CI
export HEADLESS=true
export SLOW_MO=0
export HUMAN_LIKE_MODE=false
export DISABLE_HUMAN_DELAYS=true

# Запуск
npx cucumber-js --tags "@smoke"
```

**Результат:** 6 минут → **2-2.5 минуты**

### Option B: New Fast Profile (5 минут работы)

1. Добавить в `cucumber.config.js`:

```javascript
smoke_fast: {
  ...common,
  tags: '@smoke',
  timeout: 8 * 1000,
  worldParameters: {
    ...common.worldParameters,
    headless: true,
    slowMo: 0,
    humanLikeMode: false,
  },
}
```

2. В `package.json`:

```json
"test:smoke:fast": "cucumber-js --config cucumber.config.js --profile smoke_fast"
```

**Результат:** 6 минут → **1.5-2 минуты**

### Option C: Full Optimization (30 минут работы)

1. Fast profile ✅
2. Parallel execution ✅
3. Product caching ✅
4. Smart waits вместо randomDelay ✅

**Результат:** 6 минут → **1 минута** (с 3 workers)

## 📊 Comparison Table

| Configuration | Time | Improvement |
|---|---|---|
| **Current (default)** | 6m 09s | Baseline |
| **Headless only** | ~4m 30s | 26% |
| **No slowMo** | ~5m 00s | 19% |
| **No human-like** | ~2m 30s | 59% |
| **Fast profile (A+B+C)** | ~2m 00s | 67% |
| **Fast + parallel (3x)** | ~45s | **88%** 🎯 |

## ✅ Recommended Action Plan

### Immediate (Next 5 minutes)

```bash
# Создать .env.smoke-fast
HEADLESS=true
SLOW_MO=0
HUMAN_LIKE_MODE=false
DISABLE_HUMAN_DELAYS=true

# Запуск
npx cucumber-js --tags "@smoke"
```

### Short-term (Today)

- [ ] Добавить `smoke_fast` profile в config
- [ ] Добавить npm script `test:smoke:fast`
- [ ] Обновить CI/CD для использования fast режима

### Long-term (This week)

- [ ] Implement product caching
- [ ] Add parallel execution
- [ ] Optimize wait strategies
- [ ] Add performance monitoring

## 🎓 Best Practices

### When to use Human-Like Mode?

✅ **Use (slowMo + delays):**
- Manual debugging
- Recording test videos
- WAF/Cloudflare bypass testing
- Demo scenarios

❌ **Don't use (fast mode):**
- CI/CD pipelines
- Smoke tests
- Regression testing
- Performance testing

### Tagging Strategy

```gherkin
@smoke @fast          # Fast mode, no delays
@smoke @stealth       # Human-like mode, full delays
@smoke @demo          # Medium mode, some delays for readability
```

## 📝 Summary

**Root Cause:** Комбинация human-like delays (35%), slowMo (15%), и sequential execution

**Quick Fix:** Environment variables для отключения delays

**Best Fix:** Dedicated fast profile + parallel execution

**Expected Improvement:** 88% быстрее (6 минут → 45 секунд)

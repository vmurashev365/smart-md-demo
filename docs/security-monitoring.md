# Security Monitoring & Health Checks

Двухуровневая система мониторинга безопасности и доступности сайта.

## 📦 Компоненты

### 1. Health Check Smoke Test
**Файл:** `tests/health-check.spec.ts`

Разовая проверка перед запуском основных тестов.

**Что проверяет:**
- ✅ Доступность сайта (детекция 5xx ошибок)
- ✅ WAF конфигурацию (детекция 403 блокировок)
- ✅ Security headers
- ✅ Базовую структуру страницы

**Запуск:**
```bash
# Только health check
npx playwright test health-check.spec.ts

# Health check перед основными тестами
npx playwright test health-check.spec.ts tests/api/specs/
```

### 2. Continuous Monitoring Fixture
**Файл:** `tests/shared/fixtures/monitored-page.ts`

Непрерывный мониторинг во время выполнения тестов.

**Что отслеживает:**
- 🔍 Все HTTP response коды
- 🚨 WAF блокировки (403) с автоматическими скриншотами
- 🔴 Server errors (5xx)
- 📊 Статистику событий

## 🚀 Использование

### Вариант 1: Health Check перед CI/CD pipeline

```yaml
# .github/workflows/tests.yml
- name: Pre-flight Health Check
  run: npx playwright test health-check.spec.ts
  
- name: Run Main Tests
  run: npx playwright test
  if: success()
```

### Вариант 2: Использование monitored fixture в тестах

```typescript
// Импортируйте test из monitored-page вместо @playwright/test
import { test, expect } from '../shared/fixtures/monitored-page';

test('My stealth test @stealth', async ({ monitoredPage, stats }) => {
  // Используйте monitoredPage вместо page
  await monitoredPage.goto('https://smart.md');
  
  // Все response автоматически мониторятся
  await monitoredPage.click('.product-card');
  
  // Доступ к статистике
  console.log(`WAF blocks: ${stats.wafBlocks}`);
  console.log(`Server errors: ${stats.serverErrors}`);
});
```

### Вариант 3: Комбинация (рекомендуется)

```bash
# 1. Сначала health check
npx playwright test health-check.spec.ts

# 2. Затем stealth тесты с мониторингом
npx playwright test tests/examples/monitored-page.example.spec.ts
```

## 📊 Что получаете

### Health Check Output
```
🏥 Starting Security Configuration Health Check...
   Target: https://smart.md
✓ Initial response received
  Status: 200
  URL: https://smart.md/
✓ Site is accessible
✓ Page title validated
✓ Page structure validated
🔒 Security Headers:
   strict-transport-security: max-age=31536000
   x-frame-options: SAMEORIGIN
   x-content-type-options: nosniff
   content-security-policy: NOT SET
```

### Continuous Monitoring Output
```
🔍 Starting continuous security monitoring...
⚠️ WAF BLOCK DETECTED [1]
   URL: https://smart.md/api/search
   Status: 403
   Server: cloudflare
   CF-Ray: 8b9c1d2e3f4g5h6i
   📸 Screenshot saved

📊 Security Monitoring Summary:
   WAF Blocks: 1
   Server Errors: 0
   Blocked URLs: https://smart.md/api/search
```

## 🎯 Сценарии обнаружения

### Scenario 1: Сайт лежит (500)
```
CRITICAL: Site is down (502). 
Failed after 2 retry attempts. 
Immediate manual check required.
```
**Действие:** 
- ✅ Тест падает (hard fail assertion)
- ✅ Скриншот: `critical-site-down-chromium-1734268800000.png`
- ✅ Алерт в Slack/Telegram (если настроено)
- ✅ Остановка всех тестов

### Scenario 2: WAF блокирует легитимный трафик (403)
```
SECURITY ALERT: WAF is blocking human-like access. 
Potential False Positive affecting real users. 
Verify WAF rules immediately. 
Cloudflare challenge detected.
```
**Действие:**
- ✅ Тест падает (hard fail assertion)
- ✅ Скриншот: `waf-block-desktop-chromium-1734268800000.png` (с browser/device context!)
- ✅ **Real-time alert в Slack/Telegram** 🚨
- ✅ Диагностика: browser, device type, CF-Ray, User-Agent
- 🔍 Помогает понять: банит только mobile или desktop тоже?

### Scenario 3: Все ОК (200)
```
✓ Site is accessible
✓ Page title validated
✓ Security headers verified
```
**Действие:** Продолжение тестов

## 🔧 Конфигурация

### Настройка alerting (ВАЖНО!)

```bash
# .env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...
TELEGRAM_CHAT_ID=-1001234567890
```

**Почему критично:** WAF блокировки случаются в реальном времени. Без алертинга вы узнаете о проблеме через несколько часов из отчета. С алертингом — через 1 минуту.

📖 [Полное руководство по настройке алертинга](./alerting-setup.md)

### Настройка retry логики

```typescript
// tests/health-check.spec.ts
const RETRY_ATTEMPTS = 2;      // Количество попыток
const RETRY_DELAY_MS = 2000;   // Задержка между попытками
```

### Настройка мониторинга

```typescript
// tests/shared/fixtures/monitored-page.ts
// Добавьте дополнительные проверки в response listener
page.on('response', async (response) => {
  // Ваша кастомная логика
  if (response.status() === 429) {
    console.warn('Rate limit hit');
  }
});
```

## 📁 Структура файлов

```
tests/
├── health-check.spec.ts              # Smoke test (запускать первым)
├── shared/
│   └── fixtures/
│       └── monitored-page.ts         # Fixture с мониторингом
└── examples/
    └── monitored-page.example.spec.ts # Примеры использования
```

## 🎭 Интеграция со Stealth режимом

Monitored fixture полностью совместим со stealth profile:

```bash
# Stealth тесты с мониторингом
API_PROFILE=stealth npx playwright test --grep "@stealth"
```

Мониторинг не влияет на:
- ✅ Throttling (семафоры)
- ✅ Human-like delays
- ✅ Rate limiting
- ✅ Worker count

## 🔍 Отладка

### Просмотр логов WAF блокировок
```bash
# Найти все скриншоты WAF блокировок
ls -la test-results/waf-block-*.png

# Просмотр последнего скриншота
open test-results/waf-block-*.png | tail -1
```

### Allure отчеты
Все события автоматически прикрепляются к Allure:
- Screenshots (WAF blocks, errors)
- JSON diagnostics
- Security monitoring summary

```bash
npx allure serve allure-results
```

## ⚡ Best Practices

1. **Запускайте health check первым:**
   ```bash
   npm run test:health && npm run test:main
   ```

2. **Используйте monitored fixture для stealth тестов:**
   ```typescript
   import { test } from '../shared/fixtures/monitored-page';
   ```

3. **Проверяйте stats после критичных операций:**
   ```typescript
   await monitoredPage.click('button:text("Buy")');
   expect(stats.wafBlocks).toBe(0); // Проверка что блоков не было
   ```

4. **Настройте CI/CD для fail-fast:**
   ```yaml
   - run: npx playwright test health-check.spec.ts
   - run: npx playwright test
     if: success()
   ```

## 🚨 Алертинг (опционально)

Добавьте интеграцию с Slack/Telegram:

```typescript
// utils/alerts.ts
export async function sendSecurityAlert(message: string) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ text: message })
  });
}

// В monitored-page.ts
if (status === 403) {
  await sendSecurityAlert('⚠️ WAF blocking detected!');
}
```

## 📚 Дополнительно

- [Health Check Spec](./tests/health-check.spec.ts)
- [Monitored Page Fixture](./tests/shared/fixtures/monitored-page.ts)
- [Usage Examples](./tests/examples/monitored-page.example.spec.ts)

# Alerting Setup Guide

Настройка real-time уведомлений для критических событий безопасности.

## 🎯 Зачем нужен алертинг?

**Без алертинга:** Вы узнаете о проблемах утром, когда проверите отчет Jenkins.

**С алертингом:** Уведомление приходит через 1 минуту после инцидента.

### Критические сценарии

1. **WAF начал блокировать human-like трафик (403)**
   - Реальные пользователи могут быть заблокированы
   - Требуется немедленная проверка WAF правил

2. **Сайт лег (5xx)**
   - Полная недоступность сервиса
   - Требуется немедленное вмешательство команды

## 📱 Поддерживаемые каналы

### 1. Slack (рекомендуется для команд)

**Преимущества:**
- Интеграция с рабочим процессом
- Автоматическая группировка алертов
- Богатое форматирование сообщений

**Настройка:**

1. Перейдите в Slack Workspace Settings
2. Apps → Incoming Webhooks → Add New Webhook
3. Выберите канал (например, `#alerts` или `#monitoring`)
4. Скопируйте Webhook URL
5. Добавьте в `.env`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE_ID/YOUR_CHANNEL_ID/YOUR_WEBHOOK_TOKEN
```

**Пример алерта в Slack:**

```
🚨 WAF Blocking Detected
Human-like traffic is being blocked on https://smart.md/catalog. This may affect real users!

Status: 403
Browser: chromium
Device Type: desktop
Server: cloudflare
CF-Ray: 8b9c1d2e3f4g5h6i

Footer: Smart.md Health Check
```

### 2. Telegram (рекомендуется для личных уведомлений)

**Преимущества:**
- Мгновенные push-уведомления
- Работает на всех устройствах
- Можно отправлять скриншоты

**Настройка:**

1. **Создайте бота:**
   - Откройте [@BotFather](https://t.me/BotFather) в Telegram
   - Отправьте `/newbot`
   - Следуйте инструкциям
   - Сохраните токен (выглядит как `123456789:ABCdefGHI...`)

2. **Получите Chat ID:**
   - Напишите своему боту любое сообщение
   - Откройте [@userinfobot](https://t.me/userinfobot)
   - Отправьте `/start`
   - Сохраните ваш Chat ID (например, `-1001234567890`)

3. **Добавьте в `.env`:**

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
```

**Пример алерта в Telegram:**

```
🚨 WAF Blocking Detected

Human-like traffic is being blocked on https://smart.md/catalog. This may affect real users!

Details:
• Status: 403
• Browser: chromium
• Device Type: desktop
• Server: cloudflare
• CF-Ray: 8b9c1d2e3f4g5h6i

2025-12-15T10:30:00.000Z
```

### 3. Custom Webhook

**Для интеграции с:**
- PagerDuty
- Opsgenie
- Custom monitoring systems
- Your own API

**Настройка:**

```bash
CUSTOM_WEBHOOK_URL=https://your-api.com/alerts
```

**Payload формат:**

```json
{
  "severity": "critical",
  "title": "WAF Blocking Detected",
  "message": "Human-like traffic is being blocked...",
  "details": {
    "status": 403,
    "url": "https://smart.md/catalog",
    "browser": "chromium",
    "deviceType": "desktop"
  },
  "timestamp": "2025-12-15T10:30:00.000Z",
  "source": "smart-md-health-check"
}
```

## 🚀 Быстрый старт

### Минимальная настройка (Telegram)

```bash
# 1. Скопируйте .env.example в .env
cp .env.example .env

# 2. Добавьте Telegram credentials
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# 3. Запустите health check
npm run test:health
```

### Полная настройка (Slack + Telegram)

```bash
# .env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...
TELEGRAM_CHAT_ID=-1001234567890
```

## 📊 Тестирование алертов

### Тест Slack

```bash
curl -X POST YOUR_SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Test alert from Smart.md Health Check"
  }'
```

### Тест Telegram

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage" \
  -d "chat_id=YOUR_CHAT_ID" \
  -d "text=Test alert from Smart.md Health Check"
```

## 🔧 Использование в коде

### Автоматические алерты (уже реализовано)

Health check автоматически отправляет алерты:

```typescript
// tests/health-check.spec.ts
// При 403 - автоматический алерт
if (status === 403) {
  await alerts.wafBlock(url, diagnostics, screenshot);
}

// При 5xx - автоматический алерт
if (status >= 500) {
  await alerts.siteDown(status, RETRY_ATTEMPTS);
}
```

### Ручные алерты

```typescript
import { alerts } from './shared/utils/alerting';

// WAF блокировка
await alerts.wafBlock(
  'https://smart.md/catalog',
  { status: 403, browser: 'chromium' },
  screenshot
);

// Сайт недоступен
await alerts.siteDown(502, 3);

// Кастомное предупреждение
await alerts.securityWarning(
  'Unusual traffic pattern detected',
  { requests: 1000, timeframe: '5m' }
);
```

### Advanced: Кастомные алерты

```typescript
import { sendAlert } from './shared/utils/alerting';

await sendAlert({
  severity: 'warning',
  title: 'High Response Time',
  message: 'API response time exceeded 5s threshold',
  details: {
    endpoint: '/api/products',
    responseTime: '5234ms',
    threshold: '5000ms',
  },
});
```

## 🎛️ Конфигурация severity levels

```typescript
type Severity = 'critical' | 'warning' | 'info';

// critical - требует немедленного действия (5xx, 403)
// warning - требует внимания (slow response, high error rate)
// info - информационные сообщения
```

## 📈 Best Practices

### 1. Используйте разные каналы для разных severity

```bash
# Production alerts → Slack канал #production-alerts
# Dev/Staging alerts → Telegram личный чат
```

### 2. Настройте rate limiting

Чтобы избежать спама, используйте group alerts:

```typescript
// Группируйте похожие алерты
// Отправляйте summary каждые 5 минут вместо каждого события
```

### 3. Добавьте контекст

```typescript
await sendAlert({
  severity: 'critical',
  title: 'WAF Block',
  message: 'Traffic blocked',
  details: {
    environment: process.env.NODE_ENV,
    runId: process.env.CI_RUN_ID,
    commitSha: process.env.GIT_SHA,
  },
});
```

### 4. Проверяйте алерты в CI/CD

```yaml
# .github/workflows/test.yml
- name: Health Check with Alerts
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
  run: npm run test:health
```

## 🔐 Безопасность

### ⚠️ Никогда не коммитьте credentials!

```bash
# Плохо
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...

# Хорошо - используйте secrets
# GitHub: Settings → Secrets → Actions
# GitLab: Settings → CI/CD → Variables
```

### Используйте GitHub Secrets

```yaml
# .github/workflows/test.yml
env:
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
  TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
```

## 🐛 Troubleshooting

### Алерты не приходят

1. **Проверьте credentials:**
   ```bash
   echo $SLACK_WEBHOOK_URL
   echo $TELEGRAM_BOT_TOKEN
   ```

2. **Проверьте network доступ:**
   ```bash
   curl https://api.telegram.org
   curl https://hooks.slack.com
   ```

3. **Проверьте логи:**
   ```
   ✓ Slack alert sent successfully
   ✓ Telegram alert sent successfully
   ```

### Slack: "Invalid webhook URL"

- Проверьте, что URL начинается с `https://hooks.slack.com/`
- Webhook мог быть деактивирован в Slack settings

### Telegram: "Unauthorized"

- Проверьте bot token
- Убедитесь, что бот не заблокирован
- Напишите боту хотя бы одно сообщение

### Telegram: "Chat not found"

- Проверьте chat ID (начинается с `-` для групп)
- Добавьте бота в группу если используете группу

## 📚 Дополнительно

- [Health Check Documentation](./security-monitoring.md)
- [Alerting Utils Code](../tests/shared/utils/alerting.ts)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Telegram Bot API](https://core.telegram.org/bots/api)

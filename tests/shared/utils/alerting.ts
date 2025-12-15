/**
 * Alerting Utilities
 *
 * Notification hooks for critical security events.
 * Supports Slack, Telegram, and custom webhooks.
 *
 * @updated December 2025
 */

export interface AlertPayload {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  details?: Record<string, any>;
  screenshot?: Buffer;
  timestamp?: string;
}

/**
 * Send alert to Slack
 */
export async function sendSlackAlert(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('⚠️ SLACK_WEBHOOK_URL not configured, skipping Slack alert');
    return;
  }

  const emoji = {
    critical: ':rotating_light:',
    warning: ':warning:',
    info: ':information_source:',
  };

  const color = {
    critical: '#ff0000',
    warning: '#ffaa00',
    info: '#0099ff',
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            color: color[payload.severity],
            title: `${emoji[payload.severity]} ${payload.title}`,
            text: payload.message,
            fields: payload.details
              ? Object.entries(payload.details).map(([key, value]) => ({
                  title: key,
                  value: String(value),
                  short: true,
                }))
              : undefined,
            footer: 'Smart.md Health Check',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Failed to send Slack alert: ${response.statusText}`);
    } else {
      console.log('✓ Slack alert sent successfully');
    }
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

/**
 * Send alert to Telegram
 */
export async function sendTelegramAlert(payload: AlertPayload): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('⚠️ Telegram credentials not configured, skipping Telegram alert');
    return;
  }

  const emoji = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  };

  let message = `${emoji[payload.severity]} *${payload.title}*\n\n${payload.message}`;

  if (payload.details) {
    message += '\n\n*Details:*\n';
    Object.entries(payload.details).forEach(([key, value]) => {
      message += `• ${key}: \`${value}\`\n`;
    });
  }

  message += `\n_${payload.timestamp || new Date().toISOString()}_`;

  try {
    // Send text message
    const textResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!textResponse.ok) {
      console.error(`Failed to send Telegram alert: ${textResponse.statusText}`);
      return;
    }

    console.log('✓ Telegram alert sent successfully');

    // Send screenshot if provided
    if (payload.screenshot) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      // Convert Buffer to Uint8Array for FormData compatibility
      const uint8Array = new Uint8Array(payload.screenshot);
      formData.append('photo', new Blob([uint8Array], { type: 'image/png' }), 'screenshot.png');
      formData.append('caption', `Screenshot: ${payload.title}`);

      const photoResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      if (photoResponse.ok) {
        console.log('✓ Screenshot sent to Telegram');
      }
    }
  } catch (error) {
    console.error('Failed to send Telegram alert:', error);
  }
}

/**
 * Send alert to custom webhook
 */
export async function sendCustomWebhook(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.CUSTOM_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
        source: 'smart-md-health-check',
      }),
    });

    if (response.ok) {
      console.log('✓ Custom webhook alert sent');
    }
  } catch (error) {
    console.error('Failed to send custom webhook alert:', error);
  }
}

/**
 * Send alert to all configured channels
 */
export async function sendAlert(payload: AlertPayload): Promise<void> {
  payload.timestamp = payload.timestamp || new Date().toISOString();

  console.log(`📢 Sending ${payload.severity} alert: ${payload.title}`);

  // Send to all configured channels in parallel
  await Promise.allSettled([
    sendSlackAlert(payload),
    sendTelegramAlert(payload),
    sendCustomWebhook(payload),
  ]);
}

/**
 * Quick alert helpers
 */
export const alerts = {
  wafBlock: (url: string, details: Record<string, any>, screenshot?: Buffer) =>
    sendAlert({
      severity: 'critical',
      title: 'WAF Blocking Detected',
      message: `Human-like traffic is being blocked on ${url}. This may affect real users!`,
      details,
      screenshot,
    }),

  siteDown: (status: number, retries: number) =>
    sendAlert({
      severity: 'critical',
      title: 'Site Down',
      message: `Site returned ${status} error after ${retries} retry attempts. Immediate action required.`,
      details: { status, retries, url: process.env.BASE_URL || 'unknown' },
    }),

  securityWarning: (message: string, details?: Record<string, any>) =>
    sendAlert({
      severity: 'warning',
      title: 'Security Warning',
      message,
      details,
    }),
};

import type { Browser } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';

export async function sslCheck(
  browser: Browser,
  _req: NormalizedRequirement,
  baseUrl: string,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  if (!baseUrl.toLowerCase().startsWith('https://')) {
    return {
      status: 'FAIL',
      reason: 'ssl_check: baseUrl is not https://',
      evidence: { url: baseUrl },
    };
  }

  const context = await browser.newContext({ ignoreHTTPSErrors: false });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return {
      status: 'PASS',
      reason: 'ssl_check: https navigation succeeded without cert errors',
      evidence: { url: page.url() },
    };
  } catch (e: any) {
    return {
      status: 'FAIL',
      reason: `ssl_check: navigation failed (${e?.message || 'unknown error'})`,
      evidence: { url: baseUrl },
    };
  } finally {
    await context.close();
  }
}

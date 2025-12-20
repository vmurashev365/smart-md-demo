import type { Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';

export async function linkPresenceCheck(
  page: Page,
  req: NormalizedRequirement,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const targetUrl = String(req.automation.raw.target_url || '').trim();
  if (!targetUrl) {
    return {
      status: 'SKIPPED',
      reason: 'link_presence: missing automation.target_url',
      evidence: { url: page.url() },
    };
  }

  const anchors = page.locator('a[href]');
  const count = await anchors.count();

  const matches: string[] = [];
  const needle = targetUrl.toLowerCase();

  for (let i = 0; i < Math.min(count, 300); i++) {
    const href = await anchors.nth(i).getAttribute('href');
    if (!href) continue;
    if (href.toLowerCase().includes(needle)) {
      matches.push(href);
      if (matches.length >= 5) break;
    }
  }

  if (matches.length === 0) {
    return {
      status: 'FAIL',
      reason: `link_presence: no link href contains "${targetUrl}"`,
      evidence: { url: page.url(), matchedSnippets: [] },
    };
  }

  return {
    status: 'PASS',
    reason: `link_presence: found ${matches.length} matching link(s)`,
    evidence: { url: page.url(), matchedSnippets: matches },
  };
}

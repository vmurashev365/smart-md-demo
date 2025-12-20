import type { Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';

export async function keywordSearchCheck(
  page: Page,
  req: NormalizedRequirement,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const keywords = req.automation.raw.keywords as unknown;
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return {
      status: 'SKIPPED',
      reason: 'keyword_search: missing automation.keywords[]',
      evidence: { url: page.url() },
    };
  }

  const bodyText = (await page.locator('body').innerText()).toLowerCase();
  const normalizedKeywords = keywords.map((k) => String(k).toLowerCase()).filter(Boolean);

  const found = normalizedKeywords.find((k) => bodyText.includes(k));
  if (!found) {
    return {
      status: 'FAIL',
      reason: `keyword_search: none of ${normalizedKeywords.length} keywords found`,
      evidence: { url: page.url(), matchedSnippets: [] },
    };
  }

  return {
    status: 'PASS',
    reason: `keyword_search: matched keyword "${found}"`,
    evidence: { url: page.url(), matchedSnippets: [found] },
  };
}

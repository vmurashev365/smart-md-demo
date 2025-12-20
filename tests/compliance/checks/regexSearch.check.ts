import type { Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';

function snippetAround(text: string, index: number, radius: number): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

export async function regexSearchCheck(
  page: Page,
  req: NormalizedRequirement,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const pattern = String(req.automation.raw.pattern || '');
  if (!pattern) {
    return {
      status: 'SKIPPED',
      reason: 'regex_search: missing automation.pattern',
      evidence: { url: page.url() },
    };
  }

  const flags = String(req.automation.raw.flags || 'i');
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (e: any) {
    return {
      status: 'SKIPPED',
      reason: `regex_search: invalid regex (${e?.message || 'unknown error'})`,
      evidence: { url: page.url() },
    };
  }

  const bodyText = await page.locator('body').innerText();
  const match = re.exec(bodyText);

  if (!match) {
    return {
      status: 'FAIL',
      reason: `regex_search: no match for /${pattern}/${flags}`,
      evidence: { url: page.url() },
    };
  }

  const idx = match.index ?? bodyText.indexOf(match[0]);
  const snippet = snippetAround(bodyText, idx >= 0 ? idx : 0, 180);

  return {
    status: 'PASS',
    reason: `regex_search: matched /${pattern}/${flags}`,
    evidence: {
      url: page.url(),
      matchedSnippets: [snippet],
    },
  };
}

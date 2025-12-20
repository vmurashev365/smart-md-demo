import type { Locator, Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';
import type { SiteProfile } from '../site/siteProfile';

function normalizeButtonText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function buildExpectedRegex(expectedList: string[]): RegExp {
  const escaped = expectedList
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

async function firstVisible(candidates: Locator[]): Promise<Locator | null> {
  for (const loc of candidates) {
    try {
      if (await loc.first().isVisible({ timeout: 1000 })) return loc.first();
    } catch {
      // ignore
    }
  }
  return null;
}

export async function buttonTextExactCheck(
  page: Page,
  req: NormalizedRequirement,
  profile: SiteProfile,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const expectedText = req.automation.raw.expected_text as unknown;
  const expectedList = Array.isArray(expectedText)
    ? expectedText.map((t) => String(t))
    : profile.i18n.finalizeOrderButtonLabels;

  if (!expectedList || expectedList.length === 0) {
    return {
      status: 'SKIPPED',
      reason: 'button_text_exact: missing expected_text list',
      evidence: { url: page.url() },
    };
  }

  const selectors = profile.selectors.checkoutFinalizeButton || [];
  const candidates: Locator[] = [];
  // Preferred: match the actual button by accessible name against expected labels.
  candidates.push(page.getByRole('button', { name: buildExpectedRegex(expectedList) }));
  // Fallbacks (site-specific selectors), filtered later by visibility.
  candidates.push(...selectors.map((s) => page.locator(s)));

  const button = await firstVisible(candidates);
  if (!button) {
    return {
      status: 'SKIPPED',
      reason: 'button_text_exact: no button candidate found/visible',
      evidence: { url: page.url(), selectorsUsed: selectors },
    };
  }

  const actual = normalizeButtonText((await button.innerText()) || '');
  const normalizedExpected = expectedList.map((t) => normalizeButtonText(t));

  const ok = normalizedExpected.includes(actual);
  if (!ok) {
    return {
      status: 'FAIL',
      reason: `button_text_exact: actual="${actual}" did not match expected list`,
      evidence: {
        url: page.url(),
        selectorsUsed: selectors,
        matchedSnippets: [actual, ...normalizedExpected.slice(0, 5)],
      },
    };
  }

  return {
    status: 'PASS',
    reason: 'button_text_exact: matched expected text',
    evidence: { url: page.url(), selectorsUsed: selectors, matchedSnippets: [actual] },
  };
}

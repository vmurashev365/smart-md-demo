import type { Locator, Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';
import type { SiteProfile } from '../site/siteProfile';

async function firstVisibleLocator(candidates: Locator[]): Promise<Locator | null> {
  for (const loc of candidates) {
    try {
      if (await loc.first().isVisible({ timeout: 1000 })) return loc.first();
    } catch {
      // ignore
    }
  }
  return null;
}

function buildLabelRegex(labels: string[]): RegExp {
  const escaped = labels
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

export async function checkboxStateCheck(
  page: Page,
  req: NormalizedRequirement,
  profile: SiteProfile,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const expectedState = String(req.automation.raw.expected_state || '').toLowerCase().trim();
  if (expectedState !== 'checked' && expectedState !== 'unchecked') {
    return {
      status: 'SKIPPED',
      reason: 'checkbox_state: missing/invalid automation.expected_state (checked|unchecked)',
      evidence: { url: page.url() },
    };
  }

  const selectors = profile.selectors.checkoutTermsCheckbox || [];
  const selectorLocators = selectors.map((s) => page.locator(s));

  const labelRegex = buildLabelRegex(profile.i18n.termsCheckboxLabels || []);
  const labelLocator = page.getByRole('checkbox', { name: labelRegex });

  const checkbox = await firstVisibleLocator([...selectorLocators, labelLocator]);
  if (!checkbox) {
    return {
      status: 'SKIPPED',
      reason: 'checkbox_state: no checkbox candidate found/visible',
      evidence: { url: page.url(), selectorsUsed: selectors },
    };
  }

  const actualChecked = await checkbox.isChecked();
  const expectedChecked = expectedState === 'checked';

  if (actualChecked !== expectedChecked) {
    return {
      status: 'FAIL',
      reason: `checkbox_state: expected ${expectedState} but was ${actualChecked ? 'checked' : 'unchecked'}`,
      evidence: { url: page.url(), selectorsUsed: selectors },
    };
  }

  return {
    status: 'PASS',
    reason: `checkbox_state: is ${expectedState}`,
    evidence: { url: page.url(), selectorsUsed: selectors },
  };
}

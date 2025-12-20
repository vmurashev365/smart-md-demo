import type { Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';
import type { SiteProfile } from '../site/siteProfile';

export async function elementVisibilityCheck(
  page: Page,
  req: NormalizedRequirement,
  profile: SiteProfile,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const mapping = profile.elementVisibilityById?.[req.id];
  if (!mapping || !mapping.selectors || mapping.selectors.length === 0) {
    return {
      status: 'SKIPPED',
      reason: 'element_visibility: no selectors mapped for this requirement id in site profile',
      evidence: { url: page.url() },
    };
  }

  for (const selector of mapping.selectors) {
    const visible = await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false);
    if (visible) {
      return {
        status: 'PASS',
        reason: 'element_visibility: element is visible',
        evidence: { url: page.url(), selectorsUsed: [selector] },
      };
    }
  }

  return {
    status: 'FAIL',
    reason: 'element_visibility: none of the mapped selectors were visible',
    evidence: { url: page.url(), selectorsUsed: mapping.selectors },
  };
}

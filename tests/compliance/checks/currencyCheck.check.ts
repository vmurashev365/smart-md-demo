import type { Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';
import type { SiteProfile } from '../site/siteProfile';

export async function currencyCheck(
  page: Page,
  req: NormalizedRequirement,
  profile?: SiteProfile,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const expected = String(req.automation.raw.expected || 'MDL|lei');
  const re = new RegExp(expected, 'i');

  const roots = profile?.selectors?.currencyTextRoot?.length
    ? profile.selectors.currencyTextRoot
    : ['#custom_products_content', 'main', 'body'];

  const ready = profile?.selectors?.currencyReadySelector || [];
  const root = page.locator(roots.join(',')).first();

  // Ensure the page is actually showing products/prices before asserting.
  await root.waitFor({ state: 'visible', timeout: 30000 }).catch(() => undefined);
  await root.scrollIntoViewIfNeeded().catch(() => undefined);

  // Try explicit readiness selectors first (product cards, or visible "lei").
  if (ready.length > 0) {
    await page.locator(ready.join(',')).first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => undefined);
  } else {
    // Fallback: wait until expected currency appears inside the root container.
    await root.getByText(re).first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => undefined);
  }

  // Always try to wait for expected currency in the root container once (even if a ready selector was used).
  await root.getByText(re).first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => undefined);

  const rootText = await root.innerText().catch(async () => await page.locator('body').innerText());
  const ok = re.test(rootText);

  if (!ok) {
    return {
      status: 'FAIL',
      reason: `currency_check: missing expected currency (${expected})`,
      evidence: {
        url: page.url(),
        matchedSnippets: [],
        selectorsUsed: [
          `currencyTextRoot=${roots.join(',')}`,
          ...(ready.length ? [`currencyReadySelector=${ready.join(',')}`] : []),
        ],
      },
    };
  }

  const firstMatch = rootText.match(re)?.[0];
  const snippet = rootText
    .replace(/\s+/g, ' ')
    .slice(0, 220)
    .trim();

  return {
    status: 'PASS',
    reason: `currency_check: matched (${expected})`,
    evidence: {
      url: page.url(),
      matchedSnippets: [firstMatch || expected, snippet].filter(Boolean),
      selectorsUsed: [
        `currencyTextRoot=${roots.join(',')}`,
        ...(ready.length ? [`currencyReadySelector=${ready.join(',')}`] : []),
      ],
    },
  };
}

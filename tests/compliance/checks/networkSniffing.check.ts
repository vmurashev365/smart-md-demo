import type { Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';
import type { SiteProfile } from '../site/siteProfile';

const TRACKER_NEEDLES = [
  'googletagmanager',
  'google-analytics',
  'doubleclick',
  'facebook',
  'hotjar',
  // Microsoft Clarity
  'clarity.ms',
];

function buildAnyRegex(parts: string[]): RegExp {
  const escaped = parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

export async function networkSniffingCheck(
  page: Page,
  req: NormalizedRequirement,
  profile: SiteProfile,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const durationMs = Number(req.automation.raw.duration_ms || 5000);
  const urls: string[] = [];

  const onRequest = (request: any) => {
    const url = String(request?.url?.() || request?.url || '');
    if (url) urls.push(url);
  };

  page.on('request', onRequest);

  try {
    await page.waitForTimeout(Number.isFinite(durationMs) ? durationMs : 5000);
  } finally {
    page.off('request', onRequest);
  }

  const sample = urls.slice(0, 200);
  const found = sample.filter((u) => TRACKER_NEEDLES.some((n) => u.toLowerCase().includes(n)));

  // If banner is not visible, we cannot assert "before consent" with confidence.
  // Try to detect the accept action inside a likely CMP/banner container to avoid false positives.
  const acceptName = buildAnyRegex(profile.i18n.cookieAccept);
  const cookieWord = /cookie|cookies|fișiere cookie|fisiere cookie|файл(ы)? cookie|куки/i;
  const bannerLikelyPresent = await (async () => {
    // 1) Prefer semantic dialog/alertdialog that mentions cookies.
    const dialog = page.getByRole('dialog').filter({ hasText: cookieWord }).first();
    const dialogVisible = await dialog.isVisible({ timeout: 500 }).catch(() => false);
    if (dialogVisible) {
      const accept = dialog.getByRole('button', { name: acceptName }).or(dialog.getByRole('link', { name: acceptName }));
      if (await accept.first().isVisible({ timeout: 500 }).catch(() => false)) return true;
    }

    const alertDialog = page.getByRole('alertdialog').filter({ hasText: cookieWord }).first();
    const alertVisible = await alertDialog.isVisible({ timeout: 500 }).catch(() => false);
    if (alertVisible) {
      const accept = alertDialog
        .getByRole('button', { name: acceptName })
        .or(alertDialog.getByRole('link', { name: acceptName }));
      if (await accept.first().isVisible({ timeout: 500 }).catch(() => false)) return true;
    }

    // 2) If site profile provides banner root selectors, require the accept action inside them.
    const roots = profile.selectors.cookieBannerRoot || [];
    for (const sel of roots) {
      const root = page.locator(sel).first();
      const rootVisible = await root.isVisible({ timeout: 500 }).catch(() => false);
      if (!rootVisible) continue;
      const accept = root.getByRole('button', { name: acceptName }).or(root.getByRole('link', { name: acceptName }));
      if (await accept.first().isVisible({ timeout: 500 }).catch(() => false)) return true;
    }

    // 3) Last resort: accept action anywhere (may be a false positive).
    const accept = page.getByRole('button', { name: acceptName }).or(page.getByRole('link', { name: acceptName }));
    return await accept.first().isVisible({ timeout: 500 }).catch(() => false);
  })();

  if (found.length > 0) {
    return {
      status: 'FAIL',
      reason: `network_sniffing: detected trackers before consent window (${found.length} URL(s))`,
      evidence: { url: page.url(), requestsSample: found },
    };
  }

  if (!bannerLikelyPresent) {
    return {
      status: 'WARN',
      reason: 'network_sniffing: no trackers detected, but cookie banner not detected (cannot confirm consent gating)',
      evidence: { url: page.url(), requestsSample: sample.slice(0, 30) },
    };
  }

  return {
    status: 'PASS',
    reason: 'network_sniffing: no known trackers detected before consent window',
    evidence: { url: page.url(), requestsSample: sample.slice(0, 30) },
  };
}

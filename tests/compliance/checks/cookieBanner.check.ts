import type { Frame, Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';
import type { SiteProfile } from '../site/siteProfile';

function buildAnyRegex(parts: string[]): RegExp {
  const escaped = parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const raw = p.trim();
      const escapedPart = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // For very short ASCII tokens (e.g. "OK"), require word boundaries to avoid accidental matches.
      if (/^[A-Za-z0-9]{1,2}$/.test(raw)) return `\\b${escapedPart}\\b`;
      return escapedPart;
    });
  return new RegExp(escaped.join('|'), 'i');
}

async function findBannerRoot(page: Page, profile: SiteProfile, acceptName: RegExp) {
  const roots = profile.selectors.cookieBannerRoot || [];
  for (const sel of roots) {
    const loc = page.locator(sel).first();
    const visible = await loc.isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) continue;

    // Ensure this root actually contains the Accept action; otherwise it may match unrelated "cookie" UI.
    const acceptCandidate = await findFirstAction(loc, acceptName);
    const acceptVisible = await isActionVisible(acceptCandidate);
    if (acceptVisible) return { locator: loc, selectorUsed: sel };
  }
  return { locator: page.locator('body'), selectorUsed: 'body' };
}

const CLICKABLE_SELECTOR =
  'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"], [onclick], [tabindex], [class*="btn" i], [class*="button" i]';

async function findFirstAction(container: any, name: RegExp) {
  // Prefer accessibility roles first (CMPs often expose buttons via ARIA even if markup isn't <button>).
  const roleButton = container.getByRole?.('button', { name }).first?.();
  if (roleButton) {
    const visible = await roleButton.isVisible({ timeout: 500 }).catch(() => false);
    if (visible) {
      const text = (await roleButton.textContent().catch(() => '')) || '';
      const normalized = String(text).replace(/\s+/g, ' ').trim();
      return { locator: roleButton, matchedLabel: normalized || 'role=button(nameMatch)' };
    }
  }

  const roleLink = container.getByRole?.('link', { name }).first?.();
  if (roleLink) {
    const visible = await roleLink.isVisible({ timeout: 500 }).catch(() => false);
    if (visible) {
      const text = (await roleLink.textContent().catch(() => '')) || '';
      const normalized = String(text).replace(/\s+/g, ' ').trim();
      return { locator: roleLink, matchedLabel: normalized || 'role=link(nameMatch)' };
    }
  }

  const loc = container.locator(CLICKABLE_SELECTOR);
  const count = await loc.count().catch(() => 0);
  for (let i = 0; i < Math.min(count, 80); i++) {
    const el = loc.nth(i);
    const payload = await el
      .evaluate((n: Element) => {
        const tag = n.tagName.toLowerCase();
        const text = (n.textContent || '').replace(/\s+/g, ' ').trim();
        const ariaLabel = (n.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        const value = tag === 'input' ? (n.getAttribute('value') || '').replace(/\s+/g, ' ').trim() : '';
        return { tag, text, ariaLabel, value };
      })
      .catch(() => null);
    if (!payload) continue;

    const candidate = [payload.text, payload.ariaLabel, payload.value].filter(Boolean).join(' | ');
    if (!candidate) continue;
    if (name.test(candidate)) return { locator: el, matchedLabel: candidate };
  }
  return null;
}

async function isActionVisible(action: { locator: any } | null) {
  if (!action) return false;
  return await action.locator.isVisible({ timeout: 1000 }).catch(() => false);
}

async function sampleActionCandidates(container: any): Promise<string[]> {
  const loc = container.locator(CLICKABLE_SELECTOR);
  const count = await loc.count().catch(() => 0);
  const out: string[] = [];
  for (let i = 0; i < Math.min(count, 60); i++) {
    const el = loc.nth(i);
    const payload = await el
      .evaluate((n: Element) => {
        const tag = n.tagName.toLowerCase();
        const text = (n.textContent || '').replace(/\s+/g, ' ').trim();
        const ariaLabel = (n.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        const value = tag === 'input' ? (n.getAttribute('value') || '').replace(/\s+/g, ' ').trim() : '';
        return { tag, text, ariaLabel, value };
      })
      .catch(() => null);
    if (!payload) continue;

    const candidate = [payload.text, payload.ariaLabel, payload.value].filter(Boolean).join(' | ');
    const normalized = String(candidate).replace(/\s+/g, ' ').trim();
    if (normalized) out.push(normalized);
  }
  // de-dupe while preserving order
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const s of out) {
    if (seen.has(s)) continue;
    seen.add(s);
    deduped.push(s);
    if (deduped.length >= 25) break;
  }
  return deduped;
}

async function checkInContainer(container: Page | Frame, profile: SiteProfile, acceptName: RegExp) {
  // Prefer semantic modal containers first (many CMPs use dialogs).
  const cookieWord = /cookie|cookies|fișiere cookie|fisiere cookie|файл(ы)? cookie|куки/i;
  const dialog = container.getByRole?.('dialog')?.filter({ hasText: cookieWord })?.first?.();
  if (dialog) {
    const visible = await dialog.isVisible({ timeout: 1500 }).catch(() => false);
    if (visible) {
      const accept = await findFirstAction(dialog, acceptName);
      const acceptVisible = await isActionVisible(accept);
      if (acceptVisible) {
        return { root: dialog, selectorUsed: 'role=dialog + hasText(cookie)', accept, containerUrl: container.url() };
      }
    }
  }

  const alertDialog = container.getByRole?.('alertdialog')?.filter({ hasText: cookieWord })?.first?.();
  if (alertDialog) {
    const visible = await alertDialog.isVisible({ timeout: 1500 }).catch(() => false);
    if (visible) {
      const accept = await findFirstAction(alertDialog, acceptName);
      const acceptVisible = await isActionVisible(accept);
      if (acceptVisible) {
        return {
          root: alertDialog,
          selectorUsed: 'role=alertdialog + hasText(cookie)',
          accept,
          containerUrl: container.url(),
        };
      }
    }
  }

  const roots = profile.selectors.cookieBannerRoot || [];
  if (roots.length > 0) {
    // Give the CMP a short chance to render any of the known roots.
    await container
      .locator(roots.join(','))
      .first()
      .waitFor({ state: 'visible', timeout: 4000 })
      .catch(() => undefined);
  }
  for (const sel of roots) {
    const root = container.locator(sel).first();
    const rootVisible = await root.isVisible({ timeout: 1000 }).catch(() => false);
    if (!rootVisible) continue;

    const accept = await findFirstAction(root, acceptName);
    const acceptVisible = await isActionVisible(accept);
    if (!acceptVisible) continue;

    return { root, selectorUsed: sel, accept, containerUrl: container.url() };
  }
  return null;
}

export async function cookieBannerComplianceCheck(
  page: Page,
  _req: NormalizedRequirement,
  profile: SiteProfile,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  const acceptName = buildAnyRegex(profile.i18n.cookieAccept);
  const rejectName = buildAnyRegex(profile.i18n.cookieReject);
  const manageName = buildAnyRegex(profile.i18n.cookieManage);

  // First, allow the banner to render in the main frame.
  await page.waitForTimeout(500);

  // Some CMPs render inside iframes; scan all frames and choose the first banner root that contains Accept.
  const frames = page.frames();
  let match:
    | {
        root: any;
        selectorUsed: string;
        accept: { locator: any; matchedLabel: string } | null;
        containerUrl: string;
      }
    | null = null;
  for (const frame of frames) {
    match = await checkInContainer(frame, profile, acceptName);
    if (match) break;
  }

  // Back-compat: if nothing matched, fall back to previous behavior (body as root) so we still return diagnostics.
  const fallbackRoot = await findBannerRoot(page, profile, acceptName);
  const root = match ? { locator: match.root, selectorUsed: match.selectorUsed } : fallbackRoot;
  const containerUrl = match?.containerUrl || page.url();

  const accept = match?.accept || (await findFirstAction(root.locator, acceptName));
  const reject = await findFirstAction(root.locator, rejectName);
  const manage = await findFirstAction(root.locator, manageName);

  // Give the banner a moment to render (any of the actions).
  if (accept) {
    await accept.locator.waitFor({ state: 'visible', timeout: 4000 }).catch(() => undefined);
  }

  const acceptVisible = await isActionVisible(accept);
  const rejectVisible = await isActionVisible(reject);
  const manageVisible = await isActionVisible(manage);

  const selectorsUsed = [`cookieBannerRoot=${root.selectorUsed}`, `frameUrl=${containerUrl}`];

  if (acceptVisible && rejectVisible && manageVisible) {
    return {
      status: 'PASS',
      reason: 'cookie_banner_compliance: Accept/Reject/Manage all visible',
      evidence: { url: page.url(), selectorsUsed },
    };
  }

  const debugTexts = await sampleActionCandidates(root.locator);
  const labels: string[] = [];
  if (accept?.matchedLabel) labels.push(`acceptCandidate=${accept.matchedLabel}`);
  if (reject?.matchedLabel) labels.push(`rejectCandidate=${reject.matchedLabel}`);
  if (manage?.matchedLabel) labels.push(`manageCandidate=${manage.matchedLabel}`);
  return {
    status: 'FAIL',
    reason: `cookie_banner_compliance: missing buttons (accept=${acceptVisible}, reject=${rejectVisible}, manage=${manageVisible})`,
    evidence: { url: page.url(), selectorsUsed, matchedSnippets: [...labels, ...debugTexts] },
  };
}

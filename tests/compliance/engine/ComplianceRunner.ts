import fs from 'fs';
import path from 'path';
import type { Browser, BrowserContext, Page } from '@playwright/test';

import type { AuditChecklist, CheckResult, ComplianceReport, NormalizedRequirement } from './types';
import { AutomationType, parseAutomationType, parseScope, parseSeverity } from './types';
import { passesFilters, readRunFiltersFromEnv } from './filters';
import { dispatchCheck } from './CheckDispatcher';
import { getSiteProfile, type RouteKey, type SiteProfile } from '../site/siteProfile';

function resolveAuditPath(): string {
  return path.join(process.cwd(), 'tests', 'compliance', 'audit', 'audit_master_2025_v2_1_FIXED.json');
}

function nowTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function joinUrl(baseUrl: string, routePath: string): string {
  if (!routePath) return baseUrl;
  if (/^https?:\/\//i.test(routePath)) return routePath;
  const base = baseUrl.replace(/\/+$/, '');
  const rel = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${base}${rel}`;
}

function inferRouteKey(req: NormalizedRequirement, profile: SiteProfile): RouteKey {
  if (req.automation.type === AutomationType.element_visibility) {
    const override = profile.elementVisibilityById?.[req.id]?.route;
    if (override) return override;
  }
  if (req.automation.type === AutomationType.cookie_banner_compliance) return 'home';
  if (req.automation.type === AutomationType.network_sniffing) return 'home';
  if (req.automation.type === AutomationType.checkbox_state) return 'checkout';
  if (req.automation.type === AutomationType.button_text_exact) return 'checkout';
  if (req.automation.type === AutomationType.currency_check) {
    if (profile.routes?.listing) return 'listing';
    if (profile.routes?.product) return 'product';
    return 'home';
  }

  const where = (req.whereToVerify || '').toLowerCase();
  if (where.includes('contact')) return 'contact';
  if (where.includes('confiden') || where.includes('privacy')) return 'privacy';
  if (where.includes('cookie')) return 'cookies';
  if (where.includes('t&c') || where.includes('termeni') || where.includes('conditii') || where.includes('condiții')) {
    return 'terms';
  }
  if (where.includes('checkout') || where.includes('coș') || where.includes('cos') || where.includes('cart')) {
    return 'checkout';
  }
  if (where.includes('retur') || where.includes('returns')) return 'returns';
  if (where.includes('pagina produs') || where.includes('produs')) return 'product';

  return 'home';
}

function normalizeChecklist(checklist: AuditChecklist): NormalizedRequirement[] {
  const out: NormalizedRequirement[] = [];
  const sections = checklist.sections || {};

  for (const [sectionKey, section] of Object.entries(sections)) {
    const requirements = section.requirements || {};
    for (const [id, raw] of Object.entries(requirements)) {
      const severity = parseSeverity(raw.severity) || 'MEDIU';
      const scope = parseScope(raw.scope) || 'MANDATORY';

      const rawAutomation = (raw.automation || {}) as Record<string, unknown>;
      const rawType = (rawAutomation.type as string | undefined) || undefined;
      const parsedType = parseAutomationType(rawType);

      const automation:
        | { type: NormalizedRequirement['automation']['type']; rawType?: string; raw: Record<string, unknown> }
        = rawType
          ? parsedType
            ? { type: parsedType, rawType, raw: rawAutomation }
            : { type: 'unknown', rawType, raw: rawAutomation }
          : Object.keys(rawAutomation).length
            ? { type: 'unknown', rawType: undefined, raw: rawAutomation }
            : { type: 'missing', rawType: undefined, raw: {} };

      out.push({
        id,
        sectionKey,
        sectionTitle: section.title,
        desc: raw.desc,
        whereToVerify: raw.where_to_verify,
        law: raw.law,
        risk: raw.risk,
        severity,
        scope,
        automation,
      });
    }
  }

  return out;
}

export class ComplianceRunner {
  private page: Page;
  private browser: Browser;
  private auditPath: string;

  constructor(deps: { page: Page; browser: Browser; auditPath?: string }) {
    this.page = deps.page;
    this.browser = deps.browser;
    this.auditPath = deps.auditPath || resolveAuditPath();
  }

  async run(): Promise<ComplianceReport> {
    const profile = getSiteProfile(process.env.COMPLIANCE_SITE || 'smart');
    const filters = readRunFiltersFromEnv(profile.id, 'RIDICAT');

    const reportStamp = nowTimestamp();
    const reportDir = path.join(process.cwd(), 'tests', 'compliance', 'reports', profile.id);
    const assetsSubdirName = `assets/compliance-report.${reportStamp}`;
    const assetsDir = path.join(reportDir, assetsSubdirName);
    fs.mkdirSync(assetsDir, { recursive: true });

    const screenshotMode = String(process.env.COMPLIANCE_SCREENSHOTS || 'fail').toLowerCase().trim();
    const forcedScreenshotIds = new Set(
      String(process.env.COMPLIANCE_SCREENSHOT_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );

    const shouldScreenshot = (reqId: string, status: string) =>
      forcedScreenshotIds.has(reqId) ||
      screenshotMode === 'all' ||
      (screenshotMode === 'fail' && (status === 'FAIL' || status === 'WARN'));

    const rawText = fs.readFileSync(this.auditPath, 'utf-8');
    const checklist = JSON.parse(rawText) as AuditChecklist;
    const allRequirements = normalizeChecklist(checklist);

    const requirements = allRequirements.filter((r) => passesFilters(r, filters));

    const results: CheckResult[] = [];

    // Run ssl_check without relying on page navigation grouping.
    for (const req of requirements.filter((r) => r.automation.type === AutomationType.ssl_check)) {
      const partial = await dispatchCheck({ page: this.page, browser: this.browser, profile }, req);
      results.push(this.wrapResult(req, partial));
    }

    const pageRequirements = requirements.filter((r) => r.automation.type !== AutomationType.ssl_check);

    // Group by inferred route key (deterministic mapping)
    const byRoute = new Map<RouteKey, NormalizedRequirement[]>();
    for (const req of pageRequirements) {
      const routeKey = inferRouteKey(req, profile);
      const list = byRoute.get(routeKey) || [];
      list.push(req);
      byRoute.set(routeKey, list);
    }

    for (const [routeKey, reqs] of byRoute.entries()) {
      const routePath = profile.routes?.[routeKey];
      if (!routePath) {
        for (const req of reqs) {
          results.push(
            this.wrapResult(req, {
              status: 'SKIPPED',
              reason: `route not configured for key "${routeKey}" in site profile`,
              evidence: { url: undefined },
            }),
          );
        }
        continue;
      }

      const url = joinUrl(profile.baseUrl, routePath);
      let navigated = false;

      try {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        navigated = true;
      } catch (e: any) {
        for (const req of reqs) {
          results.push(
            this.wrapResult(req, {
              status: 'SKIPPED',
              reason: `navigation failed for ${routeKey} (${e?.message || 'unknown error'})`,
              evidence: { url },
            }),
          );
        }
      }

      if (!navigated) continue;

      // Some checks must run in an "incognito"-like context (fresh session with no cookies/storage)
      // so the first-visit banner and pre-consent tracking behavior are observable.
      const incognitoTypes = new Set<AutomationType>([
        AutomationType.cookie_banner_compliance,
        AutomationType.network_sniffing,
      ]);
      const incognitoReqs = reqs.filter((r) => incognitoTypes.has(r.automation.type as AutomationType));
      const normalReqs = reqs.filter((r) => !incognitoTypes.has(r.automation.type as AutomationType));

      // Run normal checks on the shared page.
      for (const req of normalReqs) {
        // If the JSON says manual_check, always SKIPPED.
        if (req.automation.type === AutomationType.manual_check) {
          results.push(
            this.wrapResult(req, {
              status: 'SKIPPED',
              reason: 'manual_check: always SKIPPED',
              evidence: { url: this.page.url() },
            }),
          );
          continue;
        }

        const partial = await dispatchCheck({ page: this.page, browser: this.browser, profile }, req);
        const wrapped = this.wrapResult(req, partial);
        if (shouldScreenshot(req.id, wrapped.status)) {
          const shot = await this.tryScreenshot(this.page, req.id, wrapped.status, assetsDir).catch(() => null);
          if (shot) {
            const relPath = `${assetsSubdirName}/${shot}`.replace(/\\/g, '/');
            const existing = wrapped.evidence.screenshots || [];
            wrapped.evidence.screenshots = [...existing, { path: relPath, caption: `${req.id} (${wrapped.status})` }];
          }
        }
        results.push(wrapped);
      }

      // Run banner/sniffing checks in a fresh context (incognito-style).
      if (incognitoReqs.length > 0) {
        const ctx = await this.createFreshContext();
        const incPage = await ctx.newPage();

        try {
          await incPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

          for (const req of incognitoReqs) {
            const partial = await dispatchCheck({ page: incPage, browser: this.browser, profile }, req);
            const wrapped = this.wrapResult(req, partial);
            if (shouldScreenshot(req.id, wrapped.status)) {
              const shot = await this.tryScreenshot(incPage, req.id, wrapped.status, assetsDir).catch(() => null);
              if (shot) {
                const relPath = `${assetsSubdirName}/${shot}`.replace(/\\/g, '/');
                const existing = wrapped.evidence.screenshots || [];
                wrapped.evidence.screenshots = [...existing, { path: relPath, caption: `${req.id} (${wrapped.status})` }];
              }
            }
            results.push(wrapped);
          }
        } catch (e: any) {
          for (const req of incognitoReqs) {
            results.push(
              this.wrapResult(req, {
                status: 'SKIPPED',
                reason: `incognito navigation/check failed (${e?.message || 'unknown error'})`,
                evidence: { url },
              }),
            );
          }
        } finally {
          await ctx.close().catch(() => undefined);
        }
      }
    }

    const report: ComplianceReport = {
      meta: {
        siteId: profile.id,
        baseUrl: profile.baseUrl,
        generatedAt: new Date().toISOString(),
        filters,
        checklistVersion: checklist.meta?.version,
        checklistTitle: checklist.meta?.document_title,
      },
      summary: this.summarize(results),
      results,
    };

    this.writeReport(profile.id, report, reportStamp);
    return report;
  }

  private summarize(results: CheckResult[]): ComplianceReport['summary'] {
    const summary = { total: results.length, pass: 0, fail: 0, warn: 0, skipped: 0 };
    for (const r of results) {
      if (r.status === 'PASS') summary.pass++;
      else if (r.status === 'FAIL') summary.fail++;
      else if (r.status === 'WARN') summary.warn++;
      else summary.skipped++;
    }
    return summary;
  }

  private writeReport(siteId: string, report: ComplianceReport, stamp: string): void {
    const dir = path.join(process.cwd(), 'tests', 'compliance', 'reports', siteId);
    fs.mkdirSync(dir, { recursive: true });

    const fileName = `compliance-report.${stamp}.json`;
    fs.writeFileSync(path.join(dir, fileName), JSON.stringify(report, null, 2), 'utf-8');
  }

  private async createFreshContext(): Promise<BrowserContext> {
    // A new context has a clean storage state (incognito-like) by default.
    // Keeping it explicit for clarity and future extension.
    return await this.browser.newContext({});
  }

  private async tryScreenshot(page: Page, reqId: string, status: string, assetsDir: string): Promise<string | null> {
    const safeId = String(reqId).replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeStatus = String(status).replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${safeId}.${safeStatus}.png`;
    const outPath = path.join(assetsDir, fileName);

    // Full-page captures are more reliable for consent banners.
    await page.screenshot({ path: outPath, fullPage: true }).catch(() => undefined);

    if (!fs.existsSync(outPath)) return null;
    return fileName;
  }

  private wrapResult(
    req: NormalizedRequirement,
    partial: Pick<CheckResult, 'status' | 'reason' | 'evidence'>,
  ): CheckResult {
    const automationType =
      req.automation.type === 'unknown' || req.automation.type === 'missing'
        ? req.automation.rawType || String(req.automation.type)
        : req.automation.type;

    return {
      id: req.id,
      sectionKey: req.sectionKey,
      status: partial.status,
      reason: partial.reason,
      evidence: partial.evidence,
      severity: req.severity,
      scope: req.scope,
      whereToVerify: req.whereToVerify,
      meta: {
        law: req.law,
        risk: req.risk,
        desc: req.desc,
        automationType: String(automationType),
      },
    };
  }
}

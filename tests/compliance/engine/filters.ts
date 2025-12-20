import type { NormalizedRequirement, RunFilters, Scope, Severity } from './types';
import { compareSeverity } from './types';

function parseCsv(envValue: string | undefined): string[] | undefined {
  if (!envValue) return undefined;
  const parts = envValue
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

export function readRunFiltersFromEnv(defaultSiteId: string, defaultMinSeverity: Severity): RunFilters {
  const siteId = (process.env.COMPLIANCE_SITE || defaultSiteId).toLowerCase().trim();

  const scopeRaw = String(process.env.COMPLIANCE_SCOPE || 'MANDATORY').toUpperCase().trim();
  const scope: 'MANDATORY' | 'ALL' = scopeRaw === 'ALL' ? 'ALL' : 'MANDATORY';

  const minSeverityRaw = String(process.env.COMPLIANCE_MIN_SEVERITY || defaultMinSeverity)
    .toUpperCase()
    .trim() as Severity;

  const minSeverity: Severity = (['CRITIC', 'RIDICAT', 'MEDIU', 'SCAZUT'] as const).includes(
    minSeverityRaw as any,
  )
    ? (minSeverityRaw as Severity)
    : defaultMinSeverity;

  return {
    siteId,
    scope,
    minSeverity,
    sectionKeys: parseCsv(process.env.COMPLIANCE_SECTIONS),
    ids: parseCsv(process.env.COMPLIANCE_IDS),
  };
}

export function passesFilters(req: NormalizedRequirement, filters: RunFilters): boolean {
  if (filters.scope === 'MANDATORY' && req.scope !== 'MANDATORY') return false;
  if (compareSeverity(req.severity, filters.minSeverity) < 0) return false;
  if (filters.sectionKeys && !filters.sectionKeys.includes(req.sectionKey)) return false;
  if (filters.ids && !filters.ids.includes(req.id)) return false;
  return true;
}

export function scopeLabel(scope: Scope): string {
  return scope === 'MANDATORY' ? 'MANDATORY' : 'BEST_PRACTICE';
}

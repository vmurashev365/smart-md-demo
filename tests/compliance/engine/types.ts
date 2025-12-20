export type Severity = 'CRITIC' | 'RIDICAT' | 'MEDIU' | 'SCAZUT';

export type Scope = 'MANDATORY' | 'BEST_PRACTICE';

export type ResultStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIPPED';

export enum AutomationType {
  keyword_search = 'keyword_search',
  regex_search = 'regex_search',
  link_presence = 'link_presence',
  checkbox_state = 'checkbox_state',
  button_text_exact = 'button_text_exact',
  currency_check = 'currency_check',
  ssl_check = 'ssl_check',
  cookie_banner_compliance = 'cookie_banner_compliance',
  network_sniffing = 'network_sniffing',
  element_visibility = 'element_visibility',
  manual_check = 'manual_check',
}

export type AuditChecklist = {
  meta?: {
    document_title?: string;
    source_file?: string;
    version?: string;
    generated_at?: string;
    totals?: {
      total_checks?: number;
      mandatory_checks?: number;
      best_practice_checks?: number;
    };
    notes?: string[];
  };
  sections?: Record<
    string,
    {
      title?: string;
      requirements?: Record<string, AuditRequirementRaw>;
    }
  >;
};

export type AuditRequirementRaw = {
  desc: string;
  where_to_verify: string;
  law?: string;
  risk?: string;
  severity: string;
  scope: string;
  automation?: {
    type?: string;
    [key: string]: unknown;
  };
};

export type NormalizedRequirement = {
  id: string;
  sectionKey: string;
  sectionTitle?: string;
  desc: string;
  whereToVerify: string;
  law?: string;
  risk?: string;
  severity: Severity;
  scope: Scope;
  automation: {
    type: AutomationType | 'unknown' | 'missing';
    rawType?: string;
    raw: Record<string, unknown>;
  };
};

export type Evidence = {
  url?: string;
  matchedSnippets?: string[];
  selectorsUsed?: string[];
  requestsSample?: string[];
  screenshots?: Array<{
    /** Path relative to the HTML report file location (portable between machines if kept within reports folder). */
    path: string;
    caption?: string;
  }>;
};

export type CheckResult = {
  id: string;
  sectionKey: string;
  status: ResultStatus;
  reason: string;
  severity: Severity;
  scope: Scope;
  whereToVerify: string;
  evidence: Evidence;
  meta?: {
    law?: string;
    risk?: string;
    desc?: string;
    automationType?: string;
  };
};

export type RunFilters = {
  siteId: string;
  scope: 'MANDATORY' | 'ALL';
  minSeverity: Severity;
  sectionKeys?: string[];
  ids?: string[];
};

export type ComplianceReport = {
  meta: {
    siteId: string;
    baseUrl: string;
    generatedAt: string;
    filters: RunFilters;
    checklistVersion?: string;
    checklistTitle?: string;
  };
  summary: {
    total: number;
    pass: number;
    fail: number;
    warn: number;
    skipped: number;
  };
  results: CheckResult[];
};

export function normalizeDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ă/gi, 'a')
    .replace(/î/gi, 'i')
    .replace(/ș/gi, 's')
    .replace(/ş/gi, 's')
    .replace(/ț/gi, 't')
    .replace(/ţ/gi, 't');
}

export function parseSeverity(input: string): Severity | null {
  const normalized = normalizeDiacritics(String(input || '')).toUpperCase().trim();
  if (normalized === 'CRITIC') return 'CRITIC';
  if (normalized === 'RIDICAT') return 'RIDICAT';
  if (normalized === 'MEDIU') return 'MEDIU';
  if (normalized === 'SCAZUT') return 'SCAZUT';
  return null;
}

export function parseScope(input: string): Scope | null {
  const normalized = String(input || '').toUpperCase().trim();
  if (normalized === 'MANDATORY') return 'MANDATORY';
  if (normalized === 'BEST_PRACTICE') return 'BEST_PRACTICE';
  return null;
}

export function parseAutomationType(input: string | undefined): AutomationType | null {
  if (!input) return null;
  const raw = String(input).trim();
  const normalized = raw.toLowerCase();
  switch (normalized) {
    case AutomationType.keyword_search:
      return AutomationType.keyword_search;
    case AutomationType.regex_search:
      return AutomationType.regex_search;
    case AutomationType.link_presence:
      return AutomationType.link_presence;
    case AutomationType.checkbox_state:
      return AutomationType.checkbox_state;
    case AutomationType.button_text_exact:
      return AutomationType.button_text_exact;
    case AutomationType.currency_check:
      return AutomationType.currency_check;
    case AutomationType.ssl_check:
      return AutomationType.ssl_check;
    case AutomationType.cookie_banner_compliance:
      return AutomationType.cookie_banner_compliance;
    case AutomationType.network_sniffing:
      return AutomationType.network_sniffing;
    case AutomationType.element_visibility:
      return AutomationType.element_visibility;
    case AutomationType.manual_check:
      return AutomationType.manual_check;
    default:
      return null;
  }
}

export function compareSeverity(a: Severity, b: Severity): number {
  const rank: Record<Severity, number> = {
    CRITIC: 4,
    RIDICAT: 3,
    MEDIU: 2,
    SCAZUT: 1,
  };
  return rank[a] - rank[b];
}

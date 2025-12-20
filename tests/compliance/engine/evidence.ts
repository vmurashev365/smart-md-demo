import type { Evidence } from './types';

export function evidenceUrl(url?: string): Evidence {
  return { url };
}

export function withMatchedSnippets(evidence: Evidence, matchedSnippets: string[]): Evidence {
  return { ...evidence, matchedSnippets };
}

export function withSelectorsUsed(evidence: Evidence, selectorsUsed: string[]): Evidence {
  return { ...evidence, selectorsUsed };
}

export function withRequestsSample(evidence: Evidence, requestsSample: string[]): Evidence {
  return { ...evidence, requestsSample };
}

export function withScreenshots(
  evidence: Evidence,
  screenshots: Array<{ path: string; caption?: string }>,
): Evidence {
  return { ...evidence, screenshots };
}

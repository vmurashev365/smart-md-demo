import type { Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from '../engine/types';

export async function manualCheck(_page: Page, _req: NormalizedRequirement): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  return {
    status: 'SKIPPED',
    reason: 'manual_check: always SKIPPED',
    evidence: { url: undefined },
  };
}

import { test } from '@playwright/test';
import { ComplianceRunner } from '../../engine/ComplianceRunner';

test('Moldova e-commerce compliance (universal kit)', async ({ page, browser }) => {
  const runner = new ComplianceRunner({ page, browser });
  const report = await runner.run();

  // Intentionally do not fail the Playwright test on compliance FAILs.
  // The purpose is to produce a deterministic JSON report with evidence.
  console.log(
    `[COMPLIANCE] total=${report.summary.total} pass=${report.summary.pass} fail=${report.summary.fail} warn=${report.summary.warn} skipped=${report.summary.skipped}`,
  );
});

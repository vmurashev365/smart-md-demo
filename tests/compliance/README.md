# Moldova E-Commerce Compliance Kit (Universal)

This folder is **isolated** and reusable.

## What it does

- Loads one **JSON master checklist** from `tests/compliance/audit/`
- Runs a deterministic **compliance engine** with strict TypeScript types
- Uses **per-site profiles only** for anything site-specific
- Writes a JSON report with evidence to `tests/compliance/reports/<siteId>/`

## How to run

- Smart (default):
  - `npm run compliance:smart`

## Management-friendly HTML report (for non-technical stakeholders)

After you have at least one JSON report in `tests/compliance/reports/smart/`, generate an HTML report:

- Generate HTML from the latest JSON report:
  - `npm run compliance:report`

Optional language override:
- Romanian: `cross-env REPORT_LANG=ro npm run compliance:report`
- Russian: `cross-env REPORT_LANG=ru npm run compliance:report`

The command prints the output `.html` file path. Open it in a browser and use:
- Status checkboxes (PASS/FAIL/WARN/SKIPPED)
- Search box (by ID / description / reason)

Environment variables (optional):
- `COMPLIANCE_SITE` (default: `smart`)
- `COMPLIANCE_SCOPE` = `MANDATORY` or `ALL` (default: `MANDATORY`)
- `COMPLIANCE_MIN_SEVERITY` = `CRITIC|RIDICAT|MEDIU|SCAZUT` (default: `RIDICAT`)
- `COMPLIANCE_SECTIONS` = comma-separated section keys (optional)
- `COMPLIANCE_IDS` = comma-separated requirement ids (optional)

## Results

Each check returns a result:
- `PASS` – requirement detected/verified
- `FAIL` – requirement not met (with evidence)
- `WARN` – uncertain; never fails without evidence (used mainly for network sniffing ambiguity)
- `SKIPPED` – manual checks and anything missing/unknown

Reports are written as:
- `tests/compliance/reports/<siteId>/compliance-report.<timestamp>.json`

## Adding a new site profile (5 steps)

1) Create `tests/compliance/site/profiles/<site>.profile.ts`
2) Export `<site>Profile` with:
   - `baseUrl`
   - `routes` (as many as you can reliably provide)
   - cookie banner and checkout text synonyms in `i18n`
3) Add the profile to the switch in `tests/compliance/site/siteProfile.ts`
4) Run: `cross-env COMPLIANCE_SITE=<site> npm run compliance:smart` (or add a new npm script)
5) If a checklist item uses `element_visibility`, map requirement ids in `elementVisibilityById`

## Non-negotiable behavior

- Unknown `automation.type` => `SKIPPED` with reason
- `manual_check` => always `SKIPPED`

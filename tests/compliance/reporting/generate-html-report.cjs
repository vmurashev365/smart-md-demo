/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function groupBy(array, keyFn) {
  const map = new Map();
  for (const item of array) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

function detectLang(report, cliLang) {
  const forced = (process.env.REPORT_LANG || cliLang || '').toLowerCase().trim();
  if (forced === 'ro' || forced === 'ru' || forced === 'en') return forced;

  const title = String(report?.meta?.checklistTitle || '');
  const version = String(report?.meta?.checklistVersion || '');
  const sampleDesc = String(report?.results?.[0]?.meta?.desc || '');
  const blob = `${title} ${version} ${sampleDesc}`;

  // Heuristic: Moldova checklist is usually Romanian.
  if (/Republica Moldova|Decembrie|Legea nr\.|Până la|E-COMMERCE|CHECKLIST|Fișiere|Condiții|Politică/i.test(blob)) {
    return 'ro';
  }
  if (/Провер|Молдова|Закон|штраф|услов|контакт/i.test(blob)) {
    return 'ru';
  }
  return 'ro';
}

function t(lang) {
  const ro = {
    status: {
      PASS: 'PASS (OK)',
      FAIL: 'FAIL (Neconform)',
      WARN: 'WARN (Necesită verificare)',
      SKIPPED: 'SKIPPED (Omis)',
      UNKNOWN: 'UNKNOWN',
    },
    summaryRegion: 'Rezumat',
    totalChecks: 'Total verificări (după filtrele curente)',
    pass: 'PASS',
    fail: 'FAIL',
    skippedWarn: 'SKIPPED / WARN',
    filtersRegion: 'Filtre',
    searchPlaceholder: 'Căutare după ID/descriere/motiv…',
    sectionCount: 'număr',
    table: {
      id: 'ID',
      status: 'Status',
      descReason: 'Descriere / Motiv',
      whereEvidence: 'Unde / Dovezi',
      where: 'Unde',
      url: 'URL',
      reason: 'Motiv',
      ruleRisk: 'Normă',
      risk: 'Risc',
      showEvidence: 'Arată dovezile',
      screenshots: 'Capturi de ecran',
      noScreenshots: 'Nu există capturi de ecran pentru acest element.',
      evidenceSummary: 'Rezumat dovezi',
      selectorsUsed: 'Selectori folosiți',
      matchedSnippets: 'Fragmente găsite',
      requestsSample: 'Cereri (eșantion)',
      technicalJson: 'Detalii tehnice (JSON)',
      evidenceHint: 'Deschide „Arată dovezile” pentru detalii tehnice.',
    },
  };

  const ru = {
    status: {
      PASS: 'PASS (ОК)',
      FAIL: 'FAIL (Нарушение)',
      WARN: 'WARN (Нужна проверка)',
      SKIPPED: 'SKIPPED (Пропущено)',
      UNKNOWN: 'UNKNOWN',
    },
    summaryRegion: 'Сводка',
    totalChecks: 'Всего проверок (по текущим фильтрам)',
    pass: 'PASS',
    fail: 'FAIL',
    skippedWarn: 'SKIPPED / WARN',
    filtersRegion: 'Фильтры',
    searchPlaceholder: 'Поиск по id/описанию/причине…',
    sectionCount: 'кол-во',
    table: {
      id: 'ID',
      status: 'Статус',
      descReason: 'Описание / Причина',
      whereEvidence: 'Где / Доказательства',
      where: 'Где',
      url: 'URL',
      reason: 'Причина',
      ruleRisk: 'Норма',
      risk: 'Риск',
      showEvidence: 'Показать доказательства',
      screenshots: 'Скриншоты',
      noScreenshots: 'Скриншотов для этого пункта нет.',
      evidenceSummary: 'Краткие доказательства',
      selectorsUsed: 'Использованные селекторы',
      matchedSnippets: 'Найденные фрагменты',
      requestsSample: 'Сетевые запросы (пример)',
      technicalJson: 'Технические детали (JSON)',
      evidenceHint: 'Для технических деталей открывайте блок “Показать доказательства”.',
    },
  };

  const en = {
    status: {
      PASS: 'PASS (OK)',
      FAIL: 'FAIL (Non-compliant)',
      WARN: 'WARN (Needs review)',
      SKIPPED: 'SKIPPED (Not run)',
      UNKNOWN: 'UNKNOWN',
    },
    summaryRegion: 'Summary',
    totalChecks: 'Total checks (current filters)',
    pass: 'PASS',
    fail: 'FAIL',
    skippedWarn: 'SKIPPED / WARN',
    filtersRegion: 'Filters',
    searchPlaceholder: 'Search by ID/description/reason…',
    sectionCount: 'count',
    table: {
      id: 'ID',
      status: 'Status',
      descReason: 'Description / Reason',
      whereEvidence: 'Where / Evidence',
      where: 'Where',
      url: 'URL',
      reason: 'Reason',
      ruleRisk: 'Rule',
      risk: 'Risk',
      showEvidence: 'Show evidence',
      screenshots: 'Screenshots',
      noScreenshots: 'No screenshots for this item.',
      evidenceSummary: 'Evidence summary',
      selectorsUsed: 'Selectors used',
      matchedSnippets: 'Matched snippets',
      requestsSample: 'Requests sample',
      technicalJson: 'Technical details (JSON)',
      evidenceHint: 'Open “Show evidence” for technical details.',
    },
  };

  if (lang === 'ru') return ru;
  if (lang === 'en') return en;
  return ro;
}

function statusLabel(status, lang) {
  const dict = t(lang);
  return dict.status[status] || String(status || dict.status.UNKNOWN);
}

function percent(part, total) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function renderHtml(report, sourceFileName) {
  const meta = report?.meta || {};
  const summary = report?.summary || {};
  const results = Array.isArray(report?.results) ? report.results : [];

  const cliLang = (process.argv.slice(2).find((a) => a.startsWith('--lang=')) || '').slice('--lang='.length);
  const lang = detectLang(report, cliLang);
  const dict = t(lang);

  const bySection = groupBy(results, (r) => r.sectionKey || 'other');

  const generatedAt = meta.generatedAt || new Date().toISOString();
  const siteId = meta.siteId || 'unknown';
  const baseUrl = meta.baseUrl || '';
  const title = `Compliance report — ${siteId}`;

  // Use system colors only (no hard-coded palette).
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
    }
    html, body {
      background: Canvas;
      color: CanvasText;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .wrap {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    header {
      display: grid;
      gap: 8px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      margin: 0;
    }
    .sub {
      color: GrayText;
      font-size: 13px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 16px 0 20px;
    }
    @media (max-width: 900px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 520px) {
      .grid { grid-template-columns: 1fr; }
    }
    .card {
      border: 1px solid GrayText;
      border-radius: 10px;
      padding: 12px 12px 10px;
      background: Canvas;
    }
    .card .k {
      font-size: 12px;
      color: GrayText;
      margin-bottom: 6px;
    }
    .card .v {
      font-size: 20px;
      font-weight: 700;
    }
    .bar {
      height: 8px;
      border: 1px solid GrayText;
      border-radius: 999px;
      overflow: hidden;
      margin-top: 8px;
      background: Canvas;
    }
    .bar > div {
      height: 100%;
      background: CanvasText;
      opacity: 0.15;
      width: 0;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin: 16px 0;
      padding: 12px;
      border: 1px solid GrayText;
      border-radius: 10px;
    }
    .controls label {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      font-size: 13px;
    }
    input[type="search"] {
      flex: 1;
      min-width: 220px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid GrayText;
      background: Canvas;
      color: CanvasText;
    }

    section {
      margin: 18px 0;
    }
    section > h2 {
      font-size: 16px;
      margin: 0 0 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid GrayText;
      border-radius: 10px;
      overflow: hidden;
    }
    th, td {
      text-align: left;
      vertical-align: top;
      padding: 10px;
      border-bottom: 1px solid GrayText;
      font-size: 13px;
    }
    th {
      font-size: 12px;
      color: GrayText;
      background: Canvas;
    }
    tr:last-child td { border-bottom: 0; }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      border: 1px solid GrayText;
      border-radius: 999px;
      font-size: 12px;
      white-space: nowrap;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    details {
      margin-top: 6px;
    }
    summary {
      cursor: pointer;
      color: GrayText;
      font-size: 12px;
    }
    pre {
      margin: 8px 0 0;
      padding: 10px;
      border: 1px solid GrayText;
      border-radius: 8px;
      overflow: auto;
      background: Canvas;
    }
    .muted { color: GrayText; }
    .row { display: grid; gap: 6px; }
    .small { font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${escapeHtml(meta.checklistTitle || 'Compliance Report')}</h1>
      <div class="sub">
        <span class="mono">siteId=${escapeHtml(siteId)}</span>
        ${baseUrl ? ` • <span class="mono">baseUrl=${escapeHtml(baseUrl)}</span>` : ''}
        • <span class="mono">generatedAt=${escapeHtml(generatedAt)}</span>
        ${sourceFileName ? ` • <span class="mono">source=${escapeHtml(sourceFileName)}</span>` : ''}
      </div>
    </header>

    .evidence {
      display: grid;
      gap: 10px;
      margin-top: 8px;
    }
    .shot {
      border: 1px solid GrayText;
      border-radius: 10px;
      overflow: hidden;
      background: Canvas;
    }
    .shot img {
      display: block;
      width: 100%;
      height: auto;
    }
    .shot figcaption {
      padding: 8px 10px;
      color: GrayText;
      font-size: 12px;
    }
    .kv {
      display: grid;
      gap: 6px;
      border: 1px solid GrayText;
      border-radius: 10px;
      padding: 10px;
    }
    .kv .k { color: GrayText; font-size: 12px; }
    .kv ul { margin: 0; padding-left: 18px; }
    .kv li { margin: 2px 0; }
    <div class="grid" role="region" aria-label="${escapeHtml(dict.summaryRegion)}">
      <div class="card">
        <div class="k">${escapeHtml(dict.totalChecks)}</div>
        <div class="v">${Number(summary.total || 0)}</div>
        <div class="bar"><div style="width: 100%"></div></div>
      </div>
      <div class="card">
        <div class="k">${escapeHtml(dict.pass)}</div>
        <div class="v">${Number(summary.pass || 0)} <span class="muted small">(${percent(summary.pass || 0, summary.total || 0)})</span></div>
        <div class="bar"><div style="width: ${percent(summary.pass || 0, summary.total || 0)}"></div></div>
      </div>
      <div class="card">
        <div class="k">${escapeHtml(dict.fail)}</div>
        <div class="v">${Number(summary.fail || 0)} <span class="muted small">(${percent(summary.fail || 0, summary.total || 0)})</span></div>
        <div class="bar"><div style="width: ${percent(summary.fail || 0, summary.total || 0)}"></div></div>
      </div>
      <div class="card">
        <div class="k">${escapeHtml(dict.skippedWarn)}</div>
        <div class="v">${Number((summary.skipped || 0) + (summary.warn || 0))} <span class="muted small">(${percent((summary.skipped || 0) + (summary.warn || 0), summary.total || 0)})</span></div>
        <div class="bar"><div style="width: ${percent((summary.skipped || 0) + (summary.warn || 0), summary.total || 0)}"></div></div>
      </div>
    </div>

    <div class="controls" role="region" aria-label="${escapeHtml(dict.filtersRegion)}">
      <label><input type="checkbox" data-status="PASS" checked /> PASS</label>
      <label><input type="checkbox" data-status="FAIL" checked /> FAIL</label>
      <label><input type="checkbox" data-status="WARN" checked /> WARN</label>
      <label><input type="checkbox" data-status="SKIPPED" /> SKIPPED</label>
      <input id="q" type="search" placeholder="${escapeHtml(dict.searchPlaceholder)}" />
    </div>

    ${Array.from(bySection.entries())
      .map(([sectionKey, items]) => {
        const sectionTitle = sectionKey.replace(/_/g, ' ');
        return `
        <section data-section="${escapeHtml(sectionKey)}">
          <h2>${escapeHtml(sectionTitle)} <span class="muted small">(${items.length})</span></h2>
          <table>
            <thead>
              <tr>
                <th style="width: 90px">${escapeHtml(dict.table.id)}</th>
                <th style="width: 140px">${escapeHtml(dict.table.status)}</th>
                <th>${escapeHtml(dict.table.descReason)}</th>
                <th style="width: 220px">${escapeHtml(dict.table.whereEvidence)}</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map((r) => {
                  const evidence = r?.evidence || {};
                  const url = evidence.url || '';
                  const law = r?.meta?.law || '';
                  const risk = r?.meta?.risk || '';
                  const automation = r?.meta?.automationType || '';
                  const desc = r?.meta?.desc || '';
                  const reason = r?.reason || '';
                  const where = r?.whereToVerify || '';
                  const snippets = Array.isArray(evidence.matchedSnippets) ? evidence.matchedSnippets : [];
                  const requests = Array.isArray(evidence.requestsSample) ? evidence.requestsSample : [];
                  const selectorsUsed = Array.isArray(evidence.selectorsUsed) ? evidence.selectorsUsed : [];
                  const screenshots = Array.isArray(evidence.screenshots) ? evidence.screenshots : [];

                  const extra = {
                    url,
                    where,
                    severity: r?.severity,
                    scope: r?.scope,
                    law,
                    risk,
                    automation,
                    selectorsUsed,
                    matchedSnippets: snippets,
                    requestsSample: requests,
                    screenshots,
                  };

                  const renderList = (items, max) => {
                    const limited = (items || []).slice(0, max);
                    if (!limited.length) return '<div class="muted small">—</div>';
                    return `<ul>${limited.map((x) => `<li>${escapeHtml(String(x))}</li>`).join('')}</ul>`;
                  };

                  const shotsHtml = screenshots.length
                    ? screenshots
                        .slice(0, 6)
                        .map(
                          (s) => `
                            <figure class="shot">
                              <img src="${escapeHtml(String(s.path))}" alt="${escapeHtml(s.caption || r.id)}" />
                              <figcaption>${escapeHtml(s.caption || '')}</figcaption>
                            </figure>`,
                        )
                        .join('')
                    : `<div class="muted small">${escapeHtml(dict.table.noScreenshots)}</div>`;

                  return `
                  <tr data-status="${escapeHtml(r.status)}" data-search="${escapeHtml(
                    `${r.id} ${sectionKey} ${desc} ${reason} ${where} ${law} ${risk}`,
                  ).toLowerCase()}">
                    <td class="mono">${escapeHtml(r.id)}</td>
                    <td><span class="pill">${escapeHtml(statusLabel(r.status, lang))}</span></td>
                    <td>
                      <div class="row">
                        ${desc ? `<div>${escapeHtml(desc)}</div>` : ''}
                        ${reason ? `<div class="muted small">${escapeHtml(dict.table.reason)}: ${escapeHtml(reason)}</div>` : ''}
                        ${(r.severity || r.scope) ? `<div class="muted small">${escapeHtml(r.severity || '')} • ${escapeHtml(r.scope || '')} • ${escapeHtml(automation || '')}</div>` : ''}
                        ${(law || risk) ? `<div class="muted small">${escapeHtml(dict.table.ruleRisk)}: ${escapeHtml(law)}${risk ? ` • ${escapeHtml(dict.table.risk)}: ${escapeHtml(risk)}` : ''}</div>` : ''}
                      </div>
                    </td>
                    <td>
                      <div class="row">
                        ${where ? `<div class="small">${escapeHtml(dict.table.where)}: ${escapeHtml(where)}</div>` : ''}
                        ${url ? `<div class="small">${escapeHtml(dict.table.url)}: <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></div>` : ''}
                        <details>
                          <summary>${escapeHtml(dict.table.showEvidence)}</summary>
                          <div class="evidence">
                            <div class="kv">
                              <div class="k">${escapeHtml(dict.table.screenshots)}</div>
                              ${shotsHtml}
                            </div>
                            <div class="kv">
                              <div class="k">${escapeHtml(dict.table.evidenceSummary)}</div>
                              <div class="small">${escapeHtml(dict.table.selectorsUsed)}:</div>
                              ${renderList(selectorsUsed, 12)}
                              <div class="small">${escapeHtml(dict.table.matchedSnippets)}:</div>
                              ${renderList(snippets, 8)}
                              <div class="small">${escapeHtml(dict.table.requestsSample)}:</div>
                              ${renderList(requests, 5)}
                            </div>
                            <details>
                              <summary>${escapeHtml(dict.table.technicalJson)}</summary>
                              <pre class="mono">${escapeHtml(safeJsonStringify(extra))}</pre>
                            </details>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </section>`;
      })
      .join('')}

    <footer class="sub" style="margin: 24px 0 6px;">
      ${escapeHtml(dict.table.evidenceHint)}
    </footer>
  </div>

  <script>
    (function () {
      const statusChecks = Array.from(document.querySelectorAll('input[type="checkbox"][data-status]'));
      const q = document.getElementById('q');

      function apply() {
        const allowed = new Set(statusChecks.filter(c => c.checked).map(c => c.getAttribute('data-status')));
        const needle = (q.value || '').trim().toLowerCase();
        const rows = Array.from(document.querySelectorAll('tbody tr[data-status]'));

        for (const row of rows) {
          const st = row.getAttribute('data-status');
          const hay = row.getAttribute('data-search') || '';
          const okStatus = allowed.has(st);
          const okText = !needle || hay.includes(needle);
          row.style.display = (okStatus && okText) ? '' : 'none';
        }
      }

      statusChecks.forEach(c => c.addEventListener('change', apply));
      q.addEventListener('input', apply);
      apply();
    })();
  </script>
</body>
</html>`;
}

function findLatestJsonReport(reportsDir) {
  if (!fs.existsSync(reportsDir)) {
    throw new Error(`Reports directory not found: ${reportsDir}`);
  }
  const files = fs
    .readdirSync(reportsDir)
    .filter((f) => /^compliance-report\..*\.json$/i.test(f))
    .map((f) => ({
      name: f,
      fullPath: path.join(reportsDir, f),
      mtimeMs: fs.statSync(path.join(reportsDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (files.length === 0) {
    throw new Error(`No JSON reports found in ${reportsDir}`);
  }
  return files[0];
}

function main() {
  const args = process.argv.slice(2);

  const siteId = (process.env.COMPLIANCE_SITE || 'smart').toLowerCase();
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const reportsDir = path.resolve(repoRoot, 'tests', 'compliance', 'reports', siteId);

  const inputArg = args.find((a) => a.startsWith('--input='));
  const outArg = args.find((a) => a.startsWith('--output='));

  const inputPath = inputArg ? inputArg.slice('--input='.length) : null;
  const outputPath = outArg ? outArg.slice('--output='.length) : null;

  const chosen = inputPath
    ? { name: path.basename(inputPath), fullPath: path.resolve(inputPath) }
    : findLatestJsonReport(reportsDir);

  const jsonRaw = fs.readFileSync(chosen.fullPath, 'utf8');
  const report = JSON.parse(jsonRaw);

  const html = renderHtml(report, chosen.name);

  const outFile = outputPath
    ? path.resolve(outputPath)
    : chosen.fullPath.replace(/\.json$/i, '.html');

  fs.writeFileSync(outFile, html, 'utf8');
  console.log(outFile);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  }
}

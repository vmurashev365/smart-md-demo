/**
 * Cucumber Configuration for Smart.md BDD Testing
 * 
 * Profiles:
 * - default: Run all tests
 * - smoke: Run only @smoke tagged tests
 * - critical: Run only @critical tagged tests
 * - mobile: Run only @mobile tagged tests
 * - e2e: Full E2E test suite
 * - parallel: Run tests in parallel (4 workers)
 */

const common = {
  requireModule: ['ts-node/register'],
  require: [
    'tests/e2e/support/**/*.ts',
    'tests/e2e/steps/**/*.ts',
  ],
  paths: ['tests/e2e/features/**/*.feature'],
  format: [
    'progress-bar',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
    'rerun:@rerun.txt',
  ],
  formatOptions: {
    snippetInterface: 'async-await',
    snippetSyntax: './tests/e2e/support/snippet-syntax.ts',
  },
  publishQuiet: true,
  worldParameters: {
    baseUrl: process.env.BASE_URL || 'https://smart.md',
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO || '50'),
    humanLikeMode: process.env.HUMAN_LIKE_MODE !== 'false',
  },
};

module.exports = {
  default: {
    ...common,
  },
  
  smoke: {
    ...common,
    tags: '@smoke',
  },
  
  critical: {
    ...common,
    tags: '@critical',
  },
  
  mobile: {
    ...common,
    tags: '@mobile',
    worldParameters: {
      ...common.worldParameters,
      device: 'iPhone 14',
    },
  },
  
  e2e: {
    ...common,
    tags: '@smoke or @critical or @e2e',
  },
  
  parallel: {
    ...common,
    parallel: 4,
    tags: '@smoke',
  },
  
  // Moldova-specific tests (credit calculators, etc.)
  moldova: {
    ...common,
    tags: '@moldova-specific',
  },
  
  // Rerun failed tests
  rerun: {
    ...common,
    paths: ['@rerun.txt'],
  },
  
  // CI configuration
  ci: {
    ...common,
    tags: '@smoke and not @flaky',
    format: [
      'progress',
      'json:reports/cucumber-report.json',
    ],
    parallel: 1,
    worldParameters: {
      ...common.worldParameters,
      headless: true,
      slowMo: 0,
    },
  },
};

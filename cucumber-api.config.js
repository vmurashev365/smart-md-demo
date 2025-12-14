/**
 * Cucumber Configuration for API BDD Tests
 * 
 * Запуск:
 *   npx cucumber-js -c cucumber-api.config.js
 *   npx cucumber-js -c cucumber-api.config.js --tags "@smoke"
 *   npx cucumber-js -c cucumber-api.config.js --tags "@search"
 */

module.exports = {
    default: {
        // Feature files location
        paths: ['tests/bdd/features/**/*.feature'],
        
        // Step definitions and support files
        require: [
            'tests/bdd/steps/**/*.ts',
            'tests/bdd/world.ts',
            'tests/bdd/hooks.ts'
        ],
        
        // TypeScript support
        requireModule: ['ts-node/register'],
        
        // Output format
        format: [
            'progress-bar',
            'html:reports/bdd-report.html',
            'json:reports/bdd-report.json'
        ],
        
        // Parallel execution (disabled for API tests to avoid race conditions)
        parallel: 1,
        
        // Fail fast on first failure
        failFast: false,
        
        // Retry failed scenarios
        retry: 1,
        
        // Tags: exclude mock-skip tests by default (use USE_REAL_API=true to run all)
        tags: 'not @mock-skip',
        
        // Timeout for steps (ms)
        timeout: 30000,
        
        // Tags to run by default (all)
        // Use --tags "@smoke" to run only smoke tests
        // Use --tags "@search and not @slow" for complex filtering
        
        // World parameters
        worldParameters: {
            baseUrl: 'https://smart.md',
            defaultLanguage: 'ru'
        },
        
        // Publish reports (disabled by default)
        publish: false,
        
        // Order of scenario execution
        order: 'defined'
    },
    
    // Profile for smoke tests only
    smoke: {
        paths: ['tests/bdd/features/**/*.feature'],
        require: [
            'tests/bdd/steps/**/*.ts',
            'tests/bdd/world.ts',
            'tests/bdd/hooks.ts'
        ],
        requireModule: ['ts-node/register'],
        format: ['progress-bar'],
        tags: '@smoke and not @mock-skip',
        timeout: 30000,
        worldParameters: {
            baseUrl: 'https://smart.md',
            defaultLanguage: 'ru'
        }
    },
    
    // Profile for CI/CD
    ci: {
        paths: ['tests/bdd/features/**/*.feature'],
        require: [
            'tests/bdd/steps/**/*.ts',
            'tests/bdd/world.ts',
            'tests/bdd/hooks.ts'
        ],
        requireModule: ['ts-node/register'],
        format: [
            'json:reports/bdd-report.json',
            'junit:reports/bdd-junit.xml'
        ],
        tags: '@smoke',
        parallel: 1,
        retry: 2,
        timeout: 60000,
        worldParameters: {
            baseUrl: 'https://smart.md',
            defaultLanguage: 'ru'
        }
    }
};

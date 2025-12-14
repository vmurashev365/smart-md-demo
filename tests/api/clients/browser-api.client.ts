/**
 * Browser-based API Client for dynamic sites like smart.md
 * 
 * Uses Playwright Page instead of APIRequestContext because smart.md
 * requires JavaScript execution to load product data.
 */

import { Page, Browser, chromium } from '@playwright/test';
import { getCurrentProfile } from '../utils/profiles';
import { SessionManager } from '../utils/session-manager';

export interface BrowserApiResponse<T> {
    data: T;
    status: number;
    responseTime: number;
    url: string;
}

export class BrowserApiClient {
    private browser?: Browser;
    private page?: Page;
    private session: SessionManager;
    private baseURL: string;
    private language: string;
    private initialized = false;

    constructor(options: { baseURL?: string; language?: string } = {}) {
        this.language = options.language || 'ru';
        
        // smart.md language URLs:
        // - Romanian (default): https://www.smart.md/smartphone
        // - Russian: https://www.smart.md/ru/smartphone
        const langPrefix = this.language === 'ru' ? '/ru' : '';
        this.baseURL = options.baseURL || `https://www.smart.md${langPrefix}`;
        
        this.session = new SessionManager();
    }

    async init(): Promise<void> {
        if (this.initialized) return;

        const profile = getCurrentProfile();
        
        // Launch browser
        this.browser = await chromium.launch({
            headless: true,
        });

        // Create context with proper headers
        const context = await this.browser.newContext({
            baseURL: this.baseURL,
            locale: this.language,
            extraHTTPHeaders: {
                'Accept-Language': this.language === 'ru' ? 'ru-RU,ru;q=0.9' : 'ro-RO,ro;q=0.9',
            },
        });

        // Create page
        this.page = await context.newPage();
        
        this.initialized = true;
        console.log(`🌐 Browser API client initialized (${this.language})`);
    }

    async get<T = string>(endpoint: string, options: { waitForSelector?: string; params?: Record<string, string> } = {}): Promise<BrowserApiResponse<T>> {
        if (!this.page) {
            throw new Error('Browser API client not initialized. Call init() first.');
        }

        const startTime = Date.now();
        let url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        // Add query params if provided
        if (options.params && Object.keys(options.params).length > 0) {
            const searchParams = new URLSearchParams(options.params);
            url += (url.includes('?') ? '&' : '?') + searchParams.toString();
        }
        
        console.log(`🌐 Browser GET: ${url.replace(this.baseURL, '')}`);

        // Navigate and wait for network idle
        const response = await this.page.goto(url, {
            waitUntil: 'domcontentloaded', // Changed from networkidle for faster loading
            timeout: 60000, // Increased timeout for slow pages
        });

        // Wait for specific selector if provided
        if (options.waitForSelector) {
            await this.page.waitForSelector(options.waitForSelector, { timeout: 10000 }).catch(() => {
                console.warn(`⚠️  Selector not found: ${options.waitForSelector}`);
            });
        }

        // Wait for dynamic content like Visely filters to load
        // Visely loads filters dynamically via JavaScript
        await this.page.waitForTimeout(2000); // Give JavaScript time to execute

        // Get HTML content
        const content = await this.page.content();
        const responseTime = Date.now() - startTime;

        return {
            data: content as T,
            status: response?.status() || 200,
            responseTime,
            url,
        };
    }

    async dispose(): Promise<void> {
        if (this.page) {
            await this.page.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
        this.initialized = false;
    }
}

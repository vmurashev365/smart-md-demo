/**
 * Human-Like Behavior Utilities for API Testing
 * 
 * Simulates realistic user behavior patterns to:
 * - Avoid rate limiting and bot detection
 * - Create realistic load patterns
 * - Test with production-like traffic
 */

// ============================================
// TIMING UTILITIES
// ============================================

/**
 * Random delay within a range (simulates human thinking time)
 */
export async function humanDelay(
    minMs: number = 100,
    maxMs: number = 500
): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Typing delay - simulates time to fill a form before submitting
 */
export async function typingDelay(textLength: number): Promise<void> {
    // Average typing speed: 40 WPM = ~200ms per character
    const baseDelay = textLength * 50; // Faster for API (50ms per char)
    const variance = Math.random() * 200 - 100; // ±100ms variance
    await new Promise(resolve => setTimeout(resolve, Math.max(50, baseDelay + variance)));
}

/**
 * Page view delay - simulates time spent viewing a page
 */
export async function pageViewDelay(): Promise<void> {
    // Users typically spend 3-15 seconds viewing a page
    const delay = Math.floor(Math.random() * 12000) + 3000;
    await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Quick action delay - for rapid consecutive actions
 */
export async function quickDelay(): Promise<void> {
    await humanDelay(50, 150);
}

/**
 * Decision delay - simulates thinking before important action
 */
export async function decisionDelay(): Promise<void> {
    await humanDelay(500, 2000);
}

// ============================================
// REQUEST PATTERNS
// ============================================

export interface HumanBehaviorConfig {
    /** Enable/disable all delays */
    enabled: boolean;
    /** Base delay multiplier (1.0 = normal, 0.5 = faster, 2.0 = slower) */
    speedMultiplier: number;
    /** Add random jitter to requests */
    jitterEnabled: boolean;
    /** Simulate realistic session patterns */
    sessionPatterns: boolean;
}

const defaultConfig: HumanBehaviorConfig = {
    enabled: process.env.HUMAN_BEHAVIOR !== 'false',
    speedMultiplier: parseFloat(process.env.HUMAN_SPEED || '1.0'),
    jitterEnabled: true,
    sessionPatterns: true
};

let currentConfig: HumanBehaviorConfig = { ...defaultConfig };

/**
 * Configure human-like behavior
 */
export function configureHumanBehavior(config: Partial<HumanBehaviorConfig>): void {
    currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current configuration
 */
export function getHumanBehaviorConfig(): HumanBehaviorConfig {
    return { ...currentConfig };
}

/**
 * Disable human-like behavior (for fast CI runs)
 */
export function disableHumanBehavior(): void {
    currentConfig.enabled = false;
}

/**
 * Enable human-like behavior
 */
export function enableHumanBehavior(): void {
    currentConfig.enabled = true;
}

// ============================================
// REALISTIC USER FLOWS
// ============================================

/**
 * Simulates delay before a specific action type
 */
export async function beforeAction(actionType: ActionType): Promise<void> {
    if (!currentConfig.enabled) return;
    
    const multiplier = currentConfig.speedMultiplier;
    
    switch (actionType) {
        case 'search':
            // User types search query
            await humanDelay(300 * multiplier, 800 * multiplier);
            break;
        case 'browse':
            // Quick navigation
            await humanDelay(100 * multiplier, 300 * multiplier);
            break;
        case 'view_product':
            // User reads product info
            await humanDelay(500 * multiplier, 1500 * multiplier);
            break;
        case 'add_to_cart':
            // Decision to add
            await humanDelay(200 * multiplier, 500 * multiplier);
            break;
        case 'checkout':
            // Important decision, longer delay
            await humanDelay(1000 * multiplier, 3000 * multiplier);
            break;
        case 'filter':
            // Applying filters
            await humanDelay(150 * multiplier, 400 * multiplier);
            break;
        case 'pagination':
            // Scrolling/navigation
            await humanDelay(200 * multiplier, 600 * multiplier);
            break;
        default:
            await humanDelay(100 * multiplier, 300 * multiplier);
    }
}

export type ActionType = 
    | 'search'
    | 'browse'
    | 'view_product'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'checkout'
    | 'filter'
    | 'sort'
    | 'pagination'
    | 'login'
    | 'credit_calculate';

// ============================================
// USER AGENT ROTATION
// ============================================

const userAgents = [
    // Chrome Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    // Chrome Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Firefox Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    // Firefox Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    // Safari Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    // Edge Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    // Mobile Chrome Android
    'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    // Mobile Safari iOS
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
];

/**
 * Get a random realistic User-Agent
 */
export function getRandomUserAgent(): string {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Get User-Agent for specific platform
 */
export function getUserAgentForPlatform(platform: 'desktop' | 'mobile' | 'tablet'): string {
    switch (platform) {
        case 'mobile':
            return userAgents.filter(ua => ua.includes('Mobile'))[0];
        case 'tablet':
            return 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
        default:
            return userAgents.filter(ua => !ua.includes('Mobile'))[0];
    }
}

// ============================================
// REALISTIC HEADERS
// ============================================

export interface RealisticHeaders {
    'User-Agent': string;
    'Accept': string;
    'Accept-Language': string;
    'Accept-Encoding': string;
    'Cache-Control': string;
    'Connection': string;
    'Sec-Fetch-Dest'?: string;
    'Sec-Fetch-Mode'?: string;
    'Sec-Fetch-Site'?: string;
}

/**
 * Generate realistic browser headers
 */
export function getRealisticHeaders(language: 'ru' | 'ro' = 'ru'): RealisticHeaders {
    const acceptLanguage = language === 'ru' 
        ? 'ru-RU,ru;q=0.9,ro;q=0.8,en;q=0.7'
        : 'ro-RO,ro;q=0.9,ru;q=0.8,en;q=0.7';
    
    return {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': acceptLanguage,
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    };
}

// ============================================
// SESSION SIMULATION
// ============================================

export interface SessionBehavior {
    /** Session start time */
    startedAt: Date;
    /** Number of requests in session */
    requestCount: number;
    /** Pages viewed */
    pagesViewed: string[];
    /** Products viewed */
    productsViewed: string[];
    /** Search queries */
    searchQueries: string[];
}

/**
 * Create a new session behavior tracker
 */
export function createSessionBehavior(): SessionBehavior {
    return {
        startedAt: new Date(),
        requestCount: 0,
        pagesViewed: [],
        productsViewed: [],
        searchQueries: []
    };
}

/**
 * Track page view in session
 */
export function trackPageView(session: SessionBehavior, page: string): void {
    session.pagesViewed.push(page);
    session.requestCount++;
}

/**
 * Track product view in session
 */
export function trackProductView(session: SessionBehavior, productId: string): void {
    if (!session.productsViewed.includes(productId)) {
        session.productsViewed.push(productId);
    }
    session.requestCount++;
}

/**
 * Track search query in session
 */
export function trackSearch(session: SessionBehavior, query: string): void {
    session.searchQueries.push(query);
    session.requestCount++;
}

/**
 * Get session duration in seconds
 */
export function getSessionDuration(session: SessionBehavior): number {
    return (new Date().getTime() - session.startedAt.getTime()) / 1000;
}

// ============================================
// RATE LIMITING HELPERS
// ============================================

let lastRequestTime = 0;
const minRequestInterval = 100; // Minimum 100ms between requests

/**
 * Ensure minimum interval between requests
 */
export async function throttleRequest(): Promise<void> {
    if (!currentConfig.enabled) return;
    
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < minRequestInterval) {
        await new Promise(resolve => 
            setTimeout(resolve, minRequestInterval - timeSinceLastRequest)
        );
    }
    
    lastRequestTime = Date.now();
}

/**
 * Add jitter to avoid request patterns
 */
export async function addJitter(): Promise<void> {
    if (!currentConfig.enabled || !currentConfig.jitterEnabled) return;
    
    const jitter = Math.floor(Math.random() * 100);
    await new Promise(resolve => setTimeout(resolve, jitter));
}

// ============================================
// REALISTIC DATA GENERATION
// ============================================

/**
 * Generate realistic search queries
 */
export function getRealisticSearchQuery(): string {
    const queries = [
        'iPhone',
        'Samsung Galaxy',
        'телефон',
        'telefon',
        'ноутбук',
        'laptop',
        'наушники',
        'телевизор',
        'холодильник',
        'стиральная машина',
        'пылесос',
        'Apple',
        'Xiaomi',
        'процессор',
        'видеокарта'
    ];
    return queries[Math.floor(Math.random() * queries.length)];
}

/**
 * Generate realistic filter values
 */
export function getRealisticPriceRange(): { min: number; max: number } {
    const ranges = [
        { min: 1000, max: 5000 },
        { min: 5000, max: 10000 },
        { min: 10000, max: 20000 },
        { min: 20000, max: 50000 },
        { min: 50000, max: 100000 }
    ];
    return ranges[Math.floor(Math.random() * ranges.length)];
}

/**
 * Generate realistic quantity
 */
export function getRealisticQuantity(): number {
    // Most users buy 1-2 items, rarely more
    const weights = [0.7, 0.2, 0.05, 0.03, 0.02];
    const rand = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (rand <= cumulative) {
            return i + 1;
        }
    }
    return 1;
}

/**
 * API Session Manager
 *
 * Manages cookies and session state across API requests.
 * Provides human-like session gaps between test suites.
 *
 * @module session-manager
 */

import { getCurrentProfile } from './profiles';
import { randomDelay } from './throttle';

/**
 * Cookie storage type
 */
interface CookieJar {
  [name: string]: {
    value: string;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
  };
}

/**
 * Session Manager Singleton
 *
 * Maintains session state (cookies) across requests within a test suite.
 * Implements human-like pauses between test suites.
 *
 * @example
 * const session = SessionManager.getInstance();
 *
 * // After receiving response
 * session.saveCookies(response);
 *
 * // Before making request
 * session.applyCookies(headers);
 *
 * // Between test suites
 * await session.waitForSessionGap();
 */
export class SessionManager {
  private static instance: SessionManager | null = null;

  private cookies: CookieJar = {};
  private lastSuiteEndTime = 0;
  private suiteCount = 0;
  private sessionId: string;

  /**
   * Private constructor (use getInstance())
   */
  private constructor() {
    this.sessionId = this.generateSessionId();
    console.log(`🍪 Session initialized: ${this.sessionId}`);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Reset singleton (for test isolation)
   */
  static resetInstance(): void {
    SessionManager.instance = null;
  }

  /**
   * Generate a unique session identifier
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
  }

  /**
   * Parse Set-Cookie header value
   */
  private parseCookie(setCookieHeader: string): {
    name: string;
    value: string;
    attributes: Record<string, string | boolean>;
  } | null {
    const parts = setCookieHeader.split(';').map((p) => p.trim());

    if (parts.length === 0) return null;

    // First part is name=value
    const [nameValue, ...attributeParts] = parts;
    const eqIndex = nameValue.indexOf('=');

    if (eqIndex === -1) return null;

    const name = nameValue.substring(0, eqIndex).trim();
    const value = nameValue.substring(eqIndex + 1).trim();

    // Parse attributes
    const attributes: Record<string, string | boolean> = {};

    for (const attr of attributeParts) {
      const attrEqIndex = attr.indexOf('=');
      if (attrEqIndex === -1) {
        // Flag attribute (e.g., Secure, HttpOnly)
        attributes[attr.toLowerCase()] = true;
      } else {
        const attrName = attr.substring(0, attrEqIndex).trim().toLowerCase();
        const attrValue = attr.substring(attrEqIndex + 1).trim();
        attributes[attrName] = attrValue;
      }
    }

    return { name, value, attributes };
  }

  /**
   * Save cookies from API response
   *
   * Extracts Set-Cookie headers and stores them for subsequent requests.
   *
   * @param response - Fetch Response or headers object
   */
  saveCookies(
    response: Response | { headers: Headers } | { headers: Record<string, string> }
  ): void {
    const profile = getCurrentProfile();

    if (!profile.cookiePersistence) {
      return;
    }

    let setCookieHeaders: string[] = [];

    // Handle different response types
    if (response instanceof Response) {
      // Fetch API Response
      const header = response.headers.get('set-cookie');
      if (header) {
        setCookieHeaders = [header];
      }
    } else if (response.headers instanceof Headers) {
      // Headers object
      const header = response.headers.get('set-cookie');
      if (header) {
        setCookieHeaders = [header];
      }
    } else if (typeof response.headers === 'object') {
      // Plain object headers
      const header =
        response.headers['set-cookie'] || response.headers['Set-Cookie'];
      if (header) {
        setCookieHeaders = Array.isArray(header) ? header : [header];
      }
    }

    // Parse and store each cookie
    for (const setCookie of setCookieHeaders) {
      const parsed = this.parseCookie(setCookie);

      if (parsed) {
        this.cookies[parsed.name] = {
          value: parsed.value,
          expires: parsed.attributes['expires']
            ? new Date(parsed.attributes['expires'] as string)
            : undefined,
          path: parsed.attributes['path'] as string | undefined,
          domain: parsed.attributes['domain'] as string | undefined,
          secure: !!parsed.attributes['secure'],
          httpOnly: !!parsed.attributes['httponly'],
        };

        console.log(`🍪 Cookie saved: ${parsed.name}`);
      }
    }
  }

  /**
   * Apply stored cookies to request headers
   *
   * Adds Cookie header to the provided headers object.
   *
   * @param headers - Headers object or Record to modify
   * @returns Modified headers
   */
  applyCookies<T extends Headers | Record<string, string>>(headers: T): T {
    const profile = getCurrentProfile();

    if (!profile.cookiePersistence) {
      return headers;
    }

    // Build cookie string
    const cookieParts: string[] = [];
    const now = new Date();

    for (const [name, cookie] of Object.entries(this.cookies)) {
      // Skip expired cookies
      if (cookie.expires && cookie.expires < now) {
        delete this.cookies[name];
        continue;
      }

      cookieParts.push(`${name}=${cookie.value}`);
    }

    if (cookieParts.length === 0) {
      return headers;
    }

    const cookieString = cookieParts.join('; ');

    // Apply to headers
    if (headers instanceof Headers) {
      headers.set('Cookie', cookieString);
    } else {
      headers['Cookie'] = cookieString;
    }

    return headers;
  }

  /**
   * Get current cookies as a string
   */
  getCookieString(): string {
    const parts: string[] = [];

    for (const [name, cookie] of Object.entries(this.cookies)) {
      parts.push(`${name}=${cookie.value}`);
    }

    return parts.join('; ');
  }

  /**
   * Get all stored cookies
   */
  getCookies(): CookieJar {
    return { ...this.cookies };
  }

  /**
   * Check if a specific cookie exists
   */
  hasCookie(name: string): boolean {
    return name in this.cookies;
  }

  /**
   * Get a specific cookie value
   */
  getCookie(name: string): string | undefined {
    return this.cookies[name]?.value;
  }

  /**
   * Clear all session data
   *
   * Call between unrelated test suites for isolation.
   */
  clearSession(): void {
    this.cookies = {};
    this.sessionId = this.generateSessionId();
    console.log(`🧹 Session cleared, new ID: ${this.sessionId}`);
  }

  /**
   * Wait for session gap between test suites
   *
   * Simulates human behavior of taking breaks between browsing sessions.
   * Delay is determined by current profile's sessionGap setting.
   */
  async waitForSessionGap(): Promise<void> {
    const profile = getCurrentProfile();
    const { sessionGap } = profile;

    // Skip if no gap configured
    if (sessionGap.max <= 0) {
      return;
    }

    // Check time since last suite
    const now = Date.now();
    const timeSinceLastSuite = now - this.lastSuiteEndTime;

    // If enough time has passed naturally, skip
    if (timeSinceLastSuite >= sessionGap.min) {
      this.lastSuiteEndTime = now;
      return;
    }

    // Wait for remaining gap
    const remainingGap = sessionGap.min - timeSinceLastSuite;
    const maxAdditional = sessionGap.max - sessionGap.min;
    const additionalDelay = Math.floor(Math.random() * maxAdditional);
    const totalDelay = remainingGap + additionalDelay;

    if (totalDelay > 0) {
      this.suiteCount++;
      console.log(
        `☕ Session gap: waiting ${(totalDelay / 1000).toFixed(1)}s (suite #${this.suiteCount})`
      );
      await randomDelay(totalDelay, totalDelay);
    }

    this.lastSuiteEndTime = Date.now();
  }

  /**
   * Mark suite end time (for gap calculation)
   */
  markSuiteEnd(): void {
    this.lastSuiteEndTime = Date.now();
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get session statistics
   */
  getStats(): {
    sessionId: string;
    cookieCount: number;
    suiteCount: number;
  } {
    return {
      sessionId: this.sessionId,
      cookieCount: Object.keys(this.cookies).length,
      suiteCount: this.suiteCount,
    };
  }
}

export default SessionManager;

/**
 * API Throttling Profile Configurations
 *
 * Defines behavior profiles for human-like API request patterns.
 * Select profile via API_PROFILE environment variable.
 *
 * @module profiles
 */

/**
 * Delay range configuration
 */
export interface DelayRange {
  /** Minimum delay in milliseconds */
  min: number;
  /** Maximum delay in milliseconds */
  max: number;
}

/**
 * Complete profile configuration for API throttling behavior
 */
export interface ProfileConfig {
  /** Profile identifier */
  name: string;
  /** Delay between individual requests */
  requestDelay: DelayRange;
  /** Gap between test suites/describes */
  sessionGap: DelayRange;
  /** Randomization factor (0-50%) */
  jitterPercent: number;
  /** Maximum concurrent requests */
  maxParallel: number;
  /** Delay before retry on error */
  retryDelay: DelayRange;
  /** Increase delays after consecutive errors */
  progressiveBackoff: boolean;
  /** Maintain session cookies across requests */
  cookiePersistence: boolean;
  /** Use mock server instead of real API */
  useMocks: boolean;
}

/**
 * Available profile names
 */
export type ProfileName = 'stealth' | 'normal' | 'fast' | 'burst';

/**
 * 🎭 STEALTH Profile
 *
 * Use for external protected APIs with aggressive bot detection.
 * Mimics careful human browsing with long pauses.
 *
 * - Very slow, sequential requests
 * - Long session gaps (coffee breaks)
 * - High jitter for unpredictability
 */
export const STEALTH_PROFILE: ProfileConfig = {
  name: 'stealth',
  requestDelay: { min: 2000, max: 5000 },
  sessionGap: { min: 10000, max: 30000 },
  jitterPercent: 40,
  maxParallel: 1,
  retryDelay: { min: 5000, max: 15000 },
  progressiveBackoff: true,
  cookiePersistence: true,
  useMocks: false,
};

/**
 * 🚶 NORMAL Profile
 *
 * Use for staging environments with basic rate limiting.
 * Balanced between speed and safety.
 *
 * - Moderate delays
 * - Limited parallelism
 * - Session awareness
 */
export const NORMAL_PROFILE: ProfileConfig = {
  name: 'normal',
  requestDelay: { min: 500, max: 1500 },
  sessionGap: { min: 2000, max: 5000 },
  jitterPercent: 25,
  maxParallel: 2,
  retryDelay: { min: 2000, max: 5000 },
  progressiveBackoff: true,
  cookiePersistence: true,
  useMocks: false,
};

/**
 * ⚡ FAST Profile
 *
 * Use for internal APIs without protection.
 * Quick execution with reasonable limits.
 *
 * - Minimal delays
 * - High parallelism
 * - No session gaps
 */
export const FAST_PROFILE: ProfileConfig = {
  name: 'fast',
  requestDelay: { min: 0, max: 100 },
  sessionGap: { min: 0, max: 0 },
  jitterPercent: 10,
  maxParallel: 10,
  retryDelay: { min: 500, max: 1000 },
  progressiveBackoff: false,
  cookiePersistence: false,
  useMocks: false,
};

/**
 * 🚀 BURST Profile
 *
 * Use for CI pipelines with mock servers.
 * Maximum speed, no throttling.
 *
 * - Zero delays
 * - Maximum parallelism
 * - Mock server enabled
 */
export const BURST_PROFILE: ProfileConfig = {
  name: 'burst',
  requestDelay: { min: 0, max: 0 },
  sessionGap: { min: 0, max: 0 },
  jitterPercent: 0,
  maxParallel: 20,
  retryDelay: { min: 100, max: 300 },
  progressiveBackoff: false,
  cookiePersistence: false,
  useMocks: true,
};

/**
 * Map of all available profiles
 */
export const PROFILES: Record<ProfileName, ProfileConfig> = {
  stealth: STEALTH_PROFILE,
  normal: NORMAL_PROFILE,
  fast: FAST_PROFILE,
  burst: BURST_PROFILE,
};

/**
 * Get profile configuration by name
 *
 * @param name - Profile name (stealth, normal, fast, burst)
 * @returns Profile configuration
 * @throws Error if profile name is invalid
 */
export function getProfile(name: string): ProfileConfig {
  const profileName = name.toLowerCase() as ProfileName;

  if (!(profileName in PROFILES)) {
    const validProfiles = Object.keys(PROFILES).join(', ');
    throw new Error(
      `🚦 Invalid API_PROFILE: "${name}". Valid options: ${validProfiles}`
    );
  }

  return PROFILES[profileName];
}

/**
 * Get current profile from environment variable
 *
 * Reads API_PROFILE env var, defaults to 'stealth' if not set.
 *
 * @returns Current profile configuration
 */
export function getCurrentProfile(): ProfileConfig {
  const profileName = process.env.API_PROFILE || 'stealth';
  return getProfile(profileName);
}

/**
 * Check if current profile allows parallel requests
 *
 * @returns true if maxParallel > 1
 */
export function isParallelEnabled(): boolean {
  return getCurrentProfile().maxParallel > 1;
}

/**
 * Check if current profile uses mock server
 *
 * @returns true if useMocks is enabled
 */
export function isMockMode(): boolean {
  return getCurrentProfile().useMocks;
}

/**
 * Log profile info to console
 *
 * @param profile - Profile to log (defaults to current)
 */
export function logProfileInfo(profile?: ProfileConfig): void {
  const p = profile || getCurrentProfile();

  console.log(`\n🎭 API Profile: ${p.name.toUpperCase()}`);
  console.log(`   ⏱️  Request delay: ${p.requestDelay.min}-${p.requestDelay.max}ms`);
  console.log(`   🔄 Session gap: ${p.sessionGap.min}-${p.sessionGap.max}ms`);
  console.log(`   🎲 Jitter: ${p.jitterPercent}%`);
  console.log(`   🔀 Max parallel: ${p.maxParallel}`);
  console.log(`   📦 Mocks: ${p.useMocks ? 'enabled' : 'disabled'}`);
  console.log(`   🍪 Cookies: ${p.cookiePersistence ? 'persistent' : 'ephemeral'}`);
  console.log('');
}

export default {
  PROFILES,
  getProfile,
  getCurrentProfile,
  isParallelEnabled,
  isMockMode,
  logProfileInfo,
};

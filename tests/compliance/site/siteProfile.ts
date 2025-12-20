export type RouteKey =
  | 'home'
  | 'contact'
  | 'privacy'
  | 'cookies'
  | 'terms'
  | 'returns'
  | 'listing'
  | 'product'
  | 'cart'
  | 'checkout';

export type SiteProfile = {
  id: string;
  baseUrl: string;
  routes?: Partial<Record<RouteKey, string>>;

  applicability: {
    hasCheckout: boolean;
    redirectsToPartners?: boolean;
    requiresLoginForCheckout?: boolean;
  };

  i18n: {
    cookieAccept: string[];
    cookieReject: string[];
    cookieManage: string[];
    termsCheckboxLabels: string[];
    finalizeOrderButtonLabels: string[];
  };

  selectors: {
    cookieBannerRoot?: string[];
    checkoutTermsCheckbox?: string[];
    checkoutFinalizeButton?: string[];
    linkAllAnchors?: string;

    /** Optional container to read currency text from (e.g., product listing root). */
    currencyTextRoot?: string[];

    /** Optional selector(s) that indicate the product list/prices have rendered. */
    currencyReadySelector?: string[];
  };

  elementVisibilityById?: Record<string, { route?: RouteKey; selectors: string[] }>;
};

export type SiteProfileId = 'smart';

export function getSiteProfile(siteId: string): SiteProfile {
  const normalized = String(siteId || '').toLowerCase().trim() as SiteProfileId;
  switch (normalized) {
    case 'smart':
      return require('./profiles/smart.profile').smartProfile;
    default:
      return require('./profiles/smart.profile').smartProfile;
  }
}

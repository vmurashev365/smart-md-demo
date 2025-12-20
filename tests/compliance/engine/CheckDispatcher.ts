import type { Browser, Page } from '@playwright/test';
import type { CheckResult, NormalizedRequirement } from './types';
import { AutomationType } from './types';
import type { SiteProfile } from '../site/siteProfile';

import {
  buttonTextExactCheck,
  checkboxStateCheck,
  cookieBannerComplianceCheck,
  currencyCheck,
  elementVisibilityCheck,
  keywordSearchCheck,
  linkPresenceCheck,
  manualCheck,
  networkSniffingCheck,
  regexSearchCheck,
  sslCheck,
} from '../checks';

export type DispatchContext = {
  page: Page;
  browser: Browser;
  profile: SiteProfile;
};

export async function dispatchCheck(
  ctx: DispatchContext,
  req: NormalizedRequirement,
): Promise<Pick<CheckResult, 'status' | 'reason' | 'evidence'>> {
  if (req.automation.type === 'missing') {
    return {
      status: 'SKIPPED',
      reason: 'missing automation definition',
      evidence: { url: ctx.page.url() },
    };
  }

  if (req.automation.type === 'unknown') {
    return {
      status: 'SKIPPED',
      reason: `unknown automation.type: ${req.automation.rawType || 'unknown'}`,
      evidence: { url: ctx.page.url() },
    };
  }

  switch (req.automation.type) {
    case AutomationType.manual_check:
      return manualCheck(ctx.page, req);
    case AutomationType.keyword_search:
      return keywordSearchCheck(ctx.page, req);
    case AutomationType.regex_search:
      return regexSearchCheck(ctx.page, req);
    case AutomationType.link_presence:
      return linkPresenceCheck(ctx.page, req);
    case AutomationType.checkbox_state:
      return checkboxStateCheck(ctx.page, req, ctx.profile);
    case AutomationType.button_text_exact:
      return buttonTextExactCheck(ctx.page, req, ctx.profile);
    case AutomationType.currency_check:
      return currencyCheck(ctx.page, req, ctx.profile);
    case AutomationType.ssl_check:
      return sslCheck(ctx.browser, req, ctx.profile.baseUrl);
    case AutomationType.cookie_banner_compliance:
      return cookieBannerComplianceCheck(ctx.page, req, ctx.profile);
    case AutomationType.network_sniffing:
      return networkSniffingCheck(ctx.page, req, ctx.profile);
    case AutomationType.element_visibility:
      return elementVisibilityCheck(ctx.page, req, ctx.profile);
    default:
      return {
        status: 'SKIPPED',
        reason: `unsupported automation.type: ${(req.automation.type as string) || 'unknown'}`,
        evidence: { url: ctx.page.url() },
      };
  }
}

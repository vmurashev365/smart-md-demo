import type { Locator, Page } from '@playwright/test';

function splitSelectorList(selectorList: string): string[] {
  const selectors: string[] = [];

  let current = '';
  let quote: '"' | "'" | '`' | null = null;
  let escape = false;

  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let i = 0; i < selectorList.length; i++) {
    const ch = selectorList[i];

    if (escape) {
      current += ch;
      escape = false;
      continue;
    }

    if (quote) {
      current += ch;
      if (ch === '\\') {
        escape = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === '(') parenDepth++;
    else if (ch === ')' && parenDepth > 0) parenDepth--;
    else if (ch === '[') bracketDepth++;
    else if (ch === ']' && bracketDepth > 0) bracketDepth--;
    else if (ch === '{') braceDepth++;
    else if (ch === '}' && braceDepth > 0) braceDepth--;

    const isTopLevelComma = ch === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0;

    if (isTopLevelComma) {
      const trimmed = current.trim();
      if (trimmed) selectors.push(trimmed);
      current = '';
      continue;
    }

    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed) selectors.push(trimmed);

  return selectors;
}

export type FirstWorkingLocatorOptions = {
  contextLabel?: string;
  /** If true (default), prefers selectors that currently resolve to a visible element. */
  requireVisible?: boolean;
};

/**
 * Resolves the first selector (from a comma-separated selector list) that actually matches on the current page.
 *
 * Notes:
 * - Works with the existing `SELECTORS.*` format where fallback selectors are stored as a single string via `.join(', ')`.
 * - Splitting is aware of parentheses so selectors like `:text-matches("...", "i")` remain intact.
 */
export async function firstWorkingLocator(
  page: Page,
  selectorList: string,
  options: FirstWorkingLocatorOptions = {}
): Promise<Locator> {
  const selectors = splitSelectorList(selectorList);
  const { contextLabel, requireVisible = true } = options;

  const errors: string[] = [];

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector);
      const count = await locator.count();
      if (count <= 0) {
        continue;
      }

      const first = locator.first();
      if (!requireVisible) {
        // eslint-disable-next-line no-console
        console.log(
          `[locator-helper] Using selector "${selector}"` + (contextLabel ? ` for ${contextLabel}` : '')
        );
        return first;
      }

      const visible = await first.isVisible().catch(() => false);
      if (visible) {
        // eslint-disable-next-line no-console
        console.log(
          `[locator-helper] Using selector "${selector}"` + (contextLabel ? ` for ${contextLabel}` : '')
        );
        return first;
      }
    } catch (err) {
      errors.push(`${selector} -> ${(err as Error)?.message ?? String(err)}`);
    }
  }

  throw new Error(
    `[locator-helper] None of selectors worked` +
      (contextLabel ? ` for ${contextLabel}` : '') +
      `: ${selectors.join(', ')}` +
      (errors.length ? `\nErrors:\n- ${errors.join('\n- ')}` : '')
  );
}

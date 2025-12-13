# Defect Report

## DEF-001: Product titles not translated to Russian on product detail pages

---

### Summary
| Field | Value |
|-------|-------|
| **Defect ID** | DEF-001 |
| **Title** | Product titles not translated to Russian on Smart.md product detail pages |
| **Severity** | Medium |
| **Priority** | Low |
| **Status** | Open |
| **Type** | Localization Bug |
| **Component** | Product Detail Page (PDP) |
| **Found in Version** | Production (smart.md) |
| **Environment** | Windows 11, Chrome 131, Desktop |
| **Date Found** | 2024-12-13 |
| **Found By** | Automated Test Suite |
| **Test Case** | Switch language from Romanian to Russian |

---

### Description
When switching the website language from Romanian (RO) to Russian (RU) on a product detail page, the product title remains in Romanian instead of being translated to Russian. This affects user experience for Russian-speaking customers in Moldova.

---

### Steps to Reproduce
1. Navigate to https://www.smart.md
2. Search for "televizor" (TV)
3. Click on any product in the search results (e.g., "Unitate TV Rigel Alb")
4. Verify the product detail page loads with Romanian content
5. Click on "RUS" language switcher in the header
6. Observe the product title

---

### Expected Result
- The product title should be displayed in Russian (Cyrillic script)
- Example: "Тумба ТВ Ригель Белая" instead of "Unitate TV Rigel Alb"
- The URL should change to include `/ru/` prefix (✓ works correctly)
- The "Add to Cart" button should show "В корзину" (✓ works correctly)

---

### Actual Result
- The product title remains in Romanian: "Unitate TV Rigel Alb"
- The title does not contain any Cyrillic characters
- Other UI elements (buttons, navigation) are correctly translated to Russian

---

### Evidence

**Failed Test Output:**
```
Scenario: Switch language from Romanian to Russian
  × And the product title should be in Russian
      Error: expect(received).toBe(expected) // Object.is equality
      Expected: true
      Received: false
      
  Failed at URL: https://www.smart.md/ru/unitate-tv-rigel-alb
```

**Test Assertion Logic:**
```typescript
// Check if title contains Cyrillic characters (Russian)
const hasCyrillic = /[а-яА-ЯёЁ]/.test(title);
expect(hasCyrillic).toBe(true);
```

**Screenshot:** See `reports/screenshots/` for failure screenshot

---

### Impact Analysis

| Aspect | Impact |
|--------|--------|
| **User Experience** | Russian-speaking users see mixed-language content |
| **SEO** | Russian language pages may have lower relevance for Russian queries |
| **Market** | Moldova has significant Russian-speaking population (~14%) |
| **Business** | Potential loss of Russian-speaking customers |

---

### Affected Products
- Multiple products across various categories
- Confirmed on: TV Units, Furniture items
- Likely affects all products without Russian translations in CMS

---

### Root Cause (Suspected)
Product content (titles, descriptions) stored in CMS without Russian translations. The site framework correctly switches UI elements but product data lacks Russian localization.

---

### Workaround
None available for end users. Products display in Romanian regardless of language selection.

---

### Recommended Fix
1. **Short-term:** Add Russian translations for all product titles in CMS
2. **Medium-term:** Implement fallback logic to show translation notice when content unavailable
3. **Long-term:** Automated translation pipeline for new products

---

### Related Items
| Type | ID | Description |
|------|-----|-------------|
| Test Case | TC-LANG-001 | Switch language from Romanian to Russian |
| Feature Tag | @known-issue | Marked as known issue in test suite |
| Feature Tag | @localization | Localization test category |

---

### Automation Status
- **Test Location:** `tests/e2e/features/catalog-experience.feature:34`
- **Step Definition:** `tests/e2e/steps/catalog.steps.ts:200`
- **Current Status:** Test marked with `@known-issue` tag, executes but expected to fail

---

### Revision History
| Date | Author | Change |
|------|--------|--------|
| 2024-12-13 | QA Automation | Initial defect report created |

---

### Attachments
- [ ] Screenshot of failed page
- [ ] Test execution log
- [ ] Network HAR file (if needed)

---

*This defect report follows ISTQB defect reporting standards and is formatted for Jira import.*

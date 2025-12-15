# Dynamic Data Injection Strategy

## 🎯 Overview

**Problem:** Hardcoded product names ("iPhone 15", "Samsung Galaxy") in feature files become outdated when:
- Products go out of stock
- Catalog changes
- Prices fluctuate
- Products are removed

**Solution:** Dynamic Data Injection - fetch valid products from the **live site** before test execution.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  Feature File with @needs_product tag              │
│  ────────────────────────────────────────          │
│  @needs_product                                     │
│  Scenario: Add product to cart                     │
│    When I search for a valid product               │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  Before Hook (hooks.ts)                            │
│  ────────────────────────────────────────          │
│  1. Initialize BrowserApiClient                     │
│  2. Call getCategoryProducts()                      │
│  3. Filter: available && price > 2000              │
│  4. Store in CustomWorld.testData.targetProduct    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  Step Definition (shopping.steps.ts)               │
│  ────────────────────────────────────────          │
│  When('I search for a valid product')              │
│    → Uses this.testData.targetProduct.title        │
└─────────────────────────────────────────────────────┘
```

## 📦 Components

### 1. TestData Interface
**File:** `tests/e2e/support/custom-world.ts`

```typescript
export interface TestData {
  targetProduct?: {
    id: string | number;
    title: string;
    price: number;
    url: string;
    brand?: string;
    available: boolean;
  };
  [key: string]: any; // Extensible for future dynamic data
}
```

### 2. Before Hook with @needs_product
**File:** `tests/e2e/support/hooks.ts`

**Trigger:** Any scenario tagged with `@needs_product`

**Logic:**
1. Initialize `BrowserApiClient`
2. Fetch products from "telefoane-si-smartfonuri" category
3. Filter for valid products:
   - `available === true` (in stock)
   - `price > 2000` MDL (qualifies for credit)
4. Store first valid product in `this.testData.targetProduct`
5. Log details for debugging
6. **Fail Fast** if no valid products found
7. Cleanup: `apiClient.dispose()`

**Output Example:**
```
🔍 Dynamic Data Injection: Fetching valid product from live site...
   Fetching from category: telefoane-si-smartfonuri
   Found 40 products
   ✅ Selected Product:
      Title: iPhone 15 Pro Max 256GB Black Titanium
      Price: 25999 MDL
      Brand: Apple
      ID: 123456
      Available: true
   🧹 BrowserApiClient disposed
```

### 3. Dynamic Step Definition
**File:** `tests/e2e/steps/shopping.steps.ts`

```typescript
When('I search for a valid product', async function (this: CustomWorld) {
  if (!this.testData.targetProduct) {
    throw new Error('testData.targetProduct not initialized. Use @needs_product tag.');
  }

  const productTitle = this.testData.targetProduct.title;
  const homePage = new HomePage(this.page);
  await homePage.search(productTitle);
  await waitForSearchResults(this.page);
});
```

**Validation:** Throws descriptive error if `@needs_product` tag is missing.

## 🚀 Usage

### Basic Example

```gherkin
@needs_product
Scenario: Search for a valid product
  Given I am on the Smart.md homepage
  When I search for a valid product
  Then the search results should contain at least 1 products
```

### Advanced Example

```gherkin
@needs_product @credit
Scenario: Verify product qualifies for credit
  When I search for a valid product
  And I click on the first product in search results
  Then the product price should be greater than 2000 MDL
  # Guaranteed because filter ensures price > 2000
```

### Accessing Product Data

```typescript
// In any step definition:
When('I verify the product brand', async function (this: CustomWorld) {
  const product = this.testData.targetProduct;
  
  console.log(`Product: ${product.title}`);
  console.log(`Price: ${product.price} MDL`);
  console.log(`Brand: ${product.brand}`);
  console.log(`URL: ${product.url}`);
  console.log(`Available: ${product.available}`);
});
```

## 🎛️ Configuration

### Change Category

```typescript
// hooks.ts - line ~250
const categorySlug = 'telefoane-si-smartfonuri'; // Change here
```

**Available categories:**
- `telefoane-si-smartfonuri` (smartphones)
- `laptopuri` (laptops)
- `televizoare` (TVs)
- `electrocasnice` (appliances)

### Change Filter Criteria

```typescript
// hooks.ts - filter logic
const validProducts = catalogPage.products.filter(product => {
  return product.available === true && product.price > 2000;
  // Modify criteria here:
  // - price > 5000 (for higher-value products)
  // - product.brand === 'Apple' (specific brand)
  // - product.rating && product.rating > 4.0 (high-rated)
});
```

### Change Selection Logic

```typescript
// Current: Select first valid product
const targetProduct = validProducts[0];

// Random selection:
const randomIndex = Math.floor(Math.random() * validProducts.length);
const targetProduct = validProducts[randomIndex];

// Cheapest product:
const targetProduct = validProducts.sort((a, b) => a.price - b.price)[0];

// Most expensive:
const targetProduct = validProducts.sort((a, b) => b.price - a.price)[0];
```

## 🔍 Debugging

### Enable Verbose Logging

Hook already logs:
- ✅ Category being fetched
- ✅ Total products found
- ✅ Selected product details
- ✅ Cleanup confirmation

### Attach to Allure Report

Product data is automatically attached as JSON:

```json
{
  "dynamicDataInjection": true,
  "targetProduct": {
    "id": 123456,
    "title": "iPhone 15 Pro Max",
    "price": 25999,
    "url": "https://smart.md/product/123456",
    "brand": "Apple",
    "available": true
  },
  "timestamp": "2025-12-15T10:30:00.000Z"
}
```

### Fail Fast Diagnostics

If no valid products found:

```
❌ FAIL FAST: No valid products found in category 'telefoane-si-smartfonuri'.
   Criteria: available === true AND price > 2000
   Total products: 40
   Available products: 35
   Products > 2000 MDL: 25
```

**Action:** Adjust filter criteria or change category.

## ⚡ Best Practices

### 1. Use Descriptive Tags

```gherkin
@needs_product @credit @smoke
Scenario: Credit flow with dynamic product
```

### 2. Validate Product Properties

```typescript
When('I verify the product is valid for credit', async function (this: CustomWorld) {
  const product = this.testData.targetProduct!;
  
  expect(product.available).toBe(true);
  expect(product.price).toBeGreaterThan(2000);
});
```

### 3. Store Multiple Products (Future Enhancement)

```typescript
// CustomWorld testData can store multiple products:
testData: {
  targetProduct: { ... },      // Main product
  comparisonProduct: { ... },  // For comparison tests
  cartProducts: [ ... ],       // For multi-item cart tests
}
```

### 4. Cache Product Data

```typescript
// To avoid fetching on every scenario, use @BeforeAll:
BeforeAll(async function() {
  // Fetch once, store in global variable
  // Use in all @needs_product scenarios
});
```

### 5. Handle Edge Cases

```typescript
// What if category is empty?
if (catalogPage.products.length === 0) {
  throw new Error(`Category '${categorySlug}' has no products. Site may be down.`);
}

// What if all products are out of stock?
const availableCount = catalogPage.products.filter(p => p.available).length;
if (availableCount === 0) {
  throw new Error('All products are out of stock. Check inventory.');
}
```

## 🆚 Comparison

### Without Dynamic Data Injection

```gherkin
Scenario: Search for iPhone
  When I search for "iPhone 15 Pro Max"  ❌ Breaks if renamed/removed
  Then I should see search results
```

**Problems:**
- ❌ Hardcoded product names
- ❌ Breaks when products change
- ❌ Manual maintenance required
- ❌ May search for out-of-stock products

### With Dynamic Data Injection

```gherkin
@needs_product
Scenario: Search for a valid product
  When I search for a valid product  ✅ Always finds valid product
  Then I should see search results
```

**Benefits:**
- ✅ No hardcoded data
- ✅ Always uses valid products
- ✅ Self-healing tests
- ✅ Zero maintenance
- ✅ Production-ready

## 🚧 Limitations

1. **Requires network access** - Hook fetches from live site
2. **Adds ~1-2s overhead** - Per scenario with @needs_product
3. **Category dependency** - Must have products in target category
4. **Single product** - Current implementation fetches one product (extensible)

## 🔮 Future Enhancements

### 1. Multi-Product Support

```typescript
testData: {
  products: {
    smartphone: { ... },
    laptop: { ... },
    tv: { ... },
  }
}
```

### 2. Caching Strategy

```typescript
// Cache products for test session
const productCache = new Map<string, Product[]>();
```

### 3. Custom Filters

```gherkin
@needs_product(category="laptopuri", brand="Apple", minPrice=5000)
Scenario: Search for premium laptop
```

### 4. Fallback Strategy

```typescript
// If live fetch fails, use backup product list
const fallbackProducts = require('./fixtures/products.json');
```

## 📚 Related Files

- [custom-world.ts](../tests/e2e/support/custom-world.ts) - TestData interface
- [hooks.ts](../tests/e2e/support/hooks.ts) - Before hook implementation
- [shopping.steps.ts](../tests/e2e/steps/shopping.steps.ts) - Dynamic step definition
- [dynamic-product-search.feature](../tests/e2e/features/dynamic-product-search.feature) - Example usage

## 🎓 Example Run

```bash
# Run scenarios with dynamic data injection
npx cucumber-js --config cucumber.config.js --tags "@needs_product"

# Output:
# 🔍 Dynamic Data Injection: Fetching valid product from live site...
#    Fetching from category: telefoane-si-smartfonuri
#    Found 40 products
#    ✅ Selected Product:
#       Title: iPhone 15 Pro Max 256GB Black Titanium
#       Price: 25999 MDL
#       Brand: Apple
#       ID: 123456
#       Available: true
#    🧹 BrowserApiClient disposed
#
# Feature: Dynamic Product Search
#   ✓ Search for a valid product using dynamic data injection (2.5s)
#   ✓ Add dynamically selected product to cart (3.1s)
#
# 2 scenarios (2 passed)
# 8 steps (8 passed)
```

## ✅ Summary

Dynamic Data Injection transforms your test suite from **brittle and maintenance-heavy** to **self-healing and production-ready**.

**Key Takeaway:** Tag scenarios with `@needs_product`, use `When I search for a valid product` step, and let the framework handle the rest!

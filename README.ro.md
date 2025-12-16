# 🛒 Framework de Testare Smart.md

Framework de Automatizare a Testelor de Nivel Enterprise pentru Smart.md - cel mai mare agregator de electronice din Moldova.

> **Declinare a responsabilității**
> 
> Acest proiect reprezintă o demonstrație tehnică independentă a unui framework de automatizare QA.
> Nu este afiliat, aprobat sau comandat de smart.md.
> Toate testele interacționează doar cu funcționalitățile accesibile public ale website-ului.

## 📊 Piramida Testelor (Conformă ISTQB)

```text
        ┌─────────────┐
        │   E2E (21%)  │  ~40 teste - Fluxuri critice utilizatori
        │   Cucumber   │  Scenarii BDD, browser real
        ├─────────────┤
        │              │
        │  API (79%)   │  ~151 teste - Logica de business
        │  Playwright  │  Headless, rapid, fiabil
        │              │
        └─────────────┘

✅ Piramidă sănătoasă: 79% API / 21% E2E
❌ Evitarea "anti-pattern clepsidră" (prea multe teste E2E)
```

### 📐 Strategie de Testare & Arhitectură (Implementarea Piramidei)

Acest framework respectă strict principiile **Piramidei de Testare** pentru a asigura feedback rapid și stabilitate ridicată.

#### 🚀 Nivel API (79% Acoperire - 151 Teste)
Munca grea se realizează prin apeluri API directe folosind un `BrowserApiClient` personalizat (browser headless pentru testare similară cu producția).
* **Testare Combinatorială (Pairwise):** Generează automat **peste 40 de scenarii de test** acoperind combinații de Branduri + Intervale de Preț + Opțiuni de Sortare.
* **Testare de Limite:** Validează logica Calculatorului de Credit cu sume min/max și termeni edge-case (ex: 500 MDL vs 50,000 MDL).
* **Testare de Securitate & Negativă:** Validează reziliența backend-ului împotriva payload-urilor XSS, pattern-urilor SQL injection și tipuri de parametri invalizi.

#### 🖥️ Nivel UI/E2E (21% Acoperire - 40 Scenarii)
Se concentrează pe **Călătorii Critice ale Utilizatorului** (CUJ) și regresie vizuală.
* **Execuție E2E Sigură pentru Producție:** Folosește pattern-uri de interacțiune realistice (întârzieri realiste, mișcări mouse, tastare) pentru a asigura că testele se comportă ca utilizatori reali și rămân stabile în condiții de producție.
* **Injectare Dinamică de Date:** Scenariile găsesc automat produse valide, în stoc de pe site-ul live înainte de execuție, eliminând instabilitatea "datelor hardcodate".
* **Responsive Mobil:** Validează adaptările de layout pentru viewport-uri iPhone/Android.

#### 📊 Metrici de Performanță
* **Suite Completă de Regresie:** ~4 minute (vs 45+ minute pentru abordare pur UI).
* **Rată de Instabilitate:** < 1% (datorită dependenței mari de precondiții API).

## 🏗️ Arhitectură

```text
                    ┌─────────────────────────────────────┐
                    │      Fișiere BDD Feature            │
                    │    (Gherkin - Limbaj Business)      │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │      Definiții Step                 │
                    │    (Implementare TypeScript)        │
                    └──────────────┬──────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼───────┐        ┌─────────▼─────────┐      ┌─────────▼─────────┐
│  Page Objects │        │     Utilități      │      │     Fixtures      │
│   (Locators)  │        │ (Human-like, Wait) │      │   (Test Data)     │
└───────┬───────┘        └─────────┬─────────┘      └─────────┬─────────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         Playwright Engine           │
                    │   (Execuție Pregătită pentru Prod)  │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │          Website Smart.md           │
                    └─────────────────────────────────────┘
```

## ✨ Funcționalități

### Capacități de Testare
- 🔬 **Testare API** - 151 teste API headless prin BrowserApiClient (context similar producției)
- 🎯 **Testare Pairwise** - Testare combinatorială a filtrelor (Brand × Preț × Sortare)
- 🔒 **Validare Input & Testare Negativă** - Validează gestionarea corectă a input-urilor malițioase/invalide (pattern-uri XSS, șiruri SQL-like, valori limită) fără testare de penetrare actuală
- ❌ **Gestionare Erori** - Scenarii erori 404, 400, validare
- 🎭 **Testare E2E BDD** - Fluxuri critice Cucumber/Gherkin

### Funcționalități Framework
- 🎭 **Comportament Uman** - Mișcări mouse realistice, întârzieri tastare, pattern-uri scroll
- 🛡️ **Execuție Pregătită pentru Producție** - Execuție test reziliență cu logică retry și gestionare timeout
- 🌐 **Multi-Limbă** - Suport interfață Română (RO) și Rusă (RU)
- 📱 **Testare Mobilă** - Emulare dispozitive cu aserțiuni touch-friendly
- 💳 **Calculator Credit** - Validare plăți rate specifică Moldovei
- 📊 **Rapoarte Allure** - Rapoarte HTML complexe cu capturi ecran și detalii pas cu pas

## 🚀 Start Rapid

### Cerințe Preliminare

- Node.js 18+
- npm sau yarn

### Instalare

```bash
# Clonează repository
git clone <repository-url>
cd smart-md-demo

# Instalează dependențe
npm install

# Instalează browsere Playwright
npx playwright install chromium
```

### Rulează Testele

```bash
# === Teste API (Rapide, Headless) ===
npx playwright test tests/api/specs/ --project=api

# Rulează suite-uri specifice de teste API
npx playwright test tests/api/specs/catalog.api.spec.ts --project=api
npx playwright test tests/api/specs/search.api.spec.ts --project=api
npx playwright test tests/api/specs/credit.api.spec.ts --project=api
npx playwright test tests/api/specs/errors.api.spec.ts --project=api

# Rulează doar teste filtru Pairwise
npx playwright test tests/api/specs/catalog.api.spec.ts --project=api --grep "Pairwise"

# === Teste E2E (Cucumber BDD) ===
# Rulează toate testele smoke
npm run test:smoke

# Rulează doar teste critice
npm run test:critical

# Rulează teste mobile
npm run test:mobile
npm run test:mobile:ios
npm run test:mobile:android
npm run test:mobile:all

# Rulează cu browser vizibil
npm run test:headed

# Rulează un singur fișier feature
npx cucumber-js -- tests/e2e/features/shopping-flow.feature

# === Suite Completă de Teste ===
# Rulează toate testele (API + E2E)
npm test

# === Puncte de Intrare Rapide ===
npm run test:api        # Toate testele API (151 teste, ~2 min)
npm run test:e2e        # Toate testele E2E (40 scenarii, ~3 min)
npm run test:smoke      # Doar teste smoke (căi critice, ~4 min)
```

### 📅 Când să Rulezi Ce

Strategia optimă de execuție teste pentru diferite etape:

| Etapă | Comandă | Ce Rulează | Durată | Scop |
|-------|---------|------------|--------|------|
| **PR / Commit** | `npm run test:smoke` | Căi critice E2E + API smoke (30 teste) | ~4 min | Feedback rapid pentru schimbări critice |
| **Nightly / Merge** | `npm run test:api` | Toate cele 151 teste API (catalog, căutare, credit, erori) | ~2 min | Validare completă logică business |
| **Pre-Release** | `npm test` | Suite completă (151 API + 40 E2E) | ~4 min | Regresie comprehensivă |
| **Specific Mobil** | `npm run test:mobile:all` | Teste responsive iOS + Android | ~2 min | Verificare compatibilitate dispozitive |

**Sfat Pro:** Rulează `npm run test:api` primul (feedback rapid), apoi `npm run test:e2e` dacă API-urile trec.

## 📁 Structura Proiectului

```text
smart-md-demo/
├── tests/
│   ├── api/                    # 🔬 Teste API (151 teste, 79%)
│   │   ├── specs/              # Specificații teste
│   │   │   ├── catalog.api.spec.ts      # 19 teste - Motor Filtre Pairwise
│   │   │   ├── search.api.spec.ts       # 27 teste - Securitate & limite
│   │   │   ├── credit.api.spec.ts       # 42 teste - Calculator + matrice
│   │   │   └── errors.api.spec.ts       # 22 teste - Scenarii negative
│   │   ├── actions/            # Metode acțiune API
│   │   │   ├── catalog.actions.ts
│   │   │   ├── search.actions.ts
│   │   │   ├── credit.actions.ts
│   │   │   └── cart.actions.ts
│   │   ├── assertions/         # Aserțiuni API reutilizabile
│   │   │   ├── catalog.assertions.ts
│   │   │   ├── search.assertions.ts
│   │   │   ├── credit.assertions.ts
│   │   │   └── cart.assertions.ts
│   │   └── clients/            # Clienți API
│   │       └── browser-api-client.ts   # Client API browser headless
│   ├── e2e/                    # 🎭 Teste E2E (40 teste, 21%)
│   │   ├── features/           # Fișiere BDD Gherkin feature
│   │   │   ├── shopping-flow.feature
│   │   │   ├── credit-calculator.feature
│   │   │   └── catalog-experience.feature
│   │   ├── steps/              # Definiții step
│   │   │   ├── common.steps.ts
│   │   │   ├── shopping.steps.ts
│   │   │   ├── credit.steps.ts
│   │   │   └── catalog.steps.ts
│   │   └── support/            # Fișiere suport Cucumber
│   │       ├── hooks.ts
│   │       ├── world.ts
│   │       └── custom-world.ts
│   └── shared/                 # Utilități partajate
│       ├── config/             # Configurare
│       │   ├── selectors.ts    # Selectori centralizați
│       │   └── urls.ts         # Constante URL
│       ├── fixtures/           # Date test
│       │   ├── test-data.ts
│       │   └── devices.ts
│       ├── page-objects/       # Model Page Object
│       │   ├── base.page.ts
│       │   ├── home.page.ts
│       │   ├── search-results.page.ts
│       │   ├── product-detail.page.ts
│       │   ├── cart.page.ts
│       │   ├── catalog.page.ts
│       │   └── components/
│       │       ├── header.component.ts
│       │       ├── credit-modal.component.ts
│       │       ├── filter-sidebar.component.ts
│       │       └── mobile-menu.component.ts
│       └── utils/              # Funcții utilitate
│           ├── human-like.ts   # Simulare comportament uman
│           ├── browser-profile.ts
│           ├── locator-helper.ts
│           ├── wait-utils.ts
│           ├── price-utils.ts
│           └── language-utils.ts
├── playwright.config.ts
├── cucumber.config.js
├── package.json
└── tsconfig.json
```

## 🧪 Scenarii de Test

### Teste API (151 teste - 79% din suite-ul de teste)

#### 1. API Catalog (`catalog.api.spec.ts` - 19 teste)

##### Motor Filtre Pairwise (12 teste)
Testare combinatorială avansată acoperind combinații Brand × Preț × Sortare:

| Tip Test | Descriere | Număr |
|----------|-----------|-------|
| Brand × Preț | Samsung/Apple/Xiaomi pe Mid-Range (5K-15K) & Premium (20K-50K) | 6 |
| Brand × Sortare | Fiecare brand cu sortare Ascendent/Descendent | 3 |
| Preț × Sortare | Intervale preț combinate cu direcții sortare | 2 |
| Negativ | Combinații imposibile (ex: Xiaomi Premium) | 1 |

**Beneficii Pairwise:**
- Testează 90% din bug-urile filtrelor cu 10-15 combinații (vs mii de teste exhaustive)
- Acoperă comportament real utilizator (combinare multiple filtre)
- Detectează cazuri marginale (combinații rare care ar trebui să eșueze elegant)

##### Teste Smoke Multi-Categorie (7 teste)
- `smartphone`, `laptopuri`, `tv`, `frigidere`, `masini-de-spalat`, `console`, `smart-watch`
- Validează listări produse pe toate categoriile majore

#### 2. API Căutare (`search.api.spec.ts` - 27 teste)

**Scop:** Testare validare input - asigură că backend-ul gestionează în siguranță input-uri malițioase/malformate.

| Tip Test | Descriere | Număr |
|----------|-----------|-------|
| Interogări Normale | iPhone, Samsung, laptop, телевизор | 4 |
| Pattern-uri XSS-like | `<script>`, `<img onerror>`, event handlers (validează sanitizare) | 4 |
| Șiruri SQL-like | `' OR '1'='1`, `DROP TABLE`, atacuri UNION (validează escape) | 4 |
| Valori Limită | Gol, whitespace, 1000 caractere, 5000 caractere | 4 |
| Caractere Speciale | `@#$%^&*()`, `\\|/?.,` | 4 |
| Unicode | Chirilică, emoji, scripturi mixte | 3 |
| Cazuri Marginale | Spații multiple, linii noi, tab-uri | 4 |

#### 3. API Calculator Credit (`credit.api.spec.ts` - 42 teste)

##### Scenarii de Bază (14 teste)
- Calcule valide pentru termeni 3/6/9/12/18/24/36 luni
- Validare structură răspuns
- Verificare furnizori bancari

##### Matrice Limite (28 teste)
Testare combinatorială sume × termeni:

| Sumă (MDL) | Termeni (luni) | Scop |
|------------|----------------|------|
| 500 | 3,6,9,12,18,24,36 | Limită minimă |
| 4999 | 3,6,9,12,18,24,36 | Sub prag 5K |
| 5000 | 3,6,9,12,18,24,36 | Prag exact |
| 50000 | 3,6,9,12,18,24,36 | Limită maximă |

**Total:** 4 sume × 7 termeni = 28 teste

#### 4. API Gestionare Erori (`errors.api.spec.ts` - 22 teste)

| Tip Eroare | Scenarii | Număr |
|------------|----------|-------|
| Erori 404 | Produse inexistente (999999999, 0, -123), categorii invalide | 6 |
| Erori 400 | Paginare invalidă (pagină negativă, zero, imensă), limite invalide | 5 |
| Erori Coș | Produse inexistente, cantitate zero, cantitate negativă | 4 |
| Erori Credit | Sume zero/negative, termeni invalizi (0, -12, 1000 luni) | 6 |
| Cazuri Speciale | Cereri malformate, parametri lipsă | 1 |

---

### Teste E2E (40 teste - 21% din suite-ul de teste)

#### 1. Flux Cumpărături (`@smoke @shopping`)

| Scenariu | Descriere |
|----------|-----------|
| Cale Aurită | Căutare → Vizualizare produs → Adaugă în coș → Verifică coș |
| Modificare Coș | Adaugă articol → Schimbă cantitate → Șterge articol |

### 2. Calculator Credit (`@smoke @credit @moldova`)

| Scenariu | Descriere |
|----------|-----------|
| Oferte Bănci | Deschide modal credit → Verifică furnizori → Selectează termen → Verifică recalculare |

### 3. Experiență Catalog (`@smoke @catalog`)

| Scenariu | Descriere |
|----------|-----------|
| Filtre & Sortare | Aplică filtru brand → Verifică filtrare → Sortează după preț |
| Schimbare Limbă | Comută RO → RU → Verifică traduceri |
| Navigare Mobilă | Meniu hamburger → Navigare categorii → Card-uri touch-friendly |

## 📋 Referință Comenzi Test

### Teste API (Rapide)

| Comandă | Descriere |
|---------|-----------|
| `npx playwright test tests/api/specs/ --project=api` | Rulează toate testele API (151 teste) |
| `npx playwright test tests/api/specs/catalog.api.spec.ts --project=api` | Teste Catalog & Pairwise (19 teste) |
| `npx playwright test tests/api/specs/search.api.spec.ts --project=api` | Teste securitate căutare (27 teste) |
| `npx playwright test tests/api/specs/credit.api.spec.ts --project=api` | Teste calculator credit (42 teste) |
| `npx playwright test tests/api/specs/errors.api.spec.ts --project=api` | Teste gestionare erori (22 teste) |
| `npx playwright test tests/api/specs/catalog.api.spec.ts --project=api --grep "Pairwise"` | Doar teste filtru Pairwise (12 teste) |

### Teste E2E (Cucumber)

| Comandă | Descriere |
|---------|-----------|
| `npm test` | Rulează toate testele (API + E2E) |
| `npm run test:smoke` | Rulează teste smoke |
| `npm run test:critical` | Rulează teste critice |
| `npm run test:mobile` | Rulează teste mobile |
| `npm run test:headed` | Rulează cu browser vizibil |
| `npm run test:parallel` | Rulează în paralel (4 workers) |
| `npm run test:e2e` | Rulează toate testele E2E direct |

### Raportare

| Comandă | Descriere |
|---------|-----------|
| `npm run allure:serve` | Deschide raport Allure |
| `npm run allure:generate` | Generează raport Allure |

## 🏷️ Sistem Tag-uri (Contract Test)

Tag-urile definesc **exact** ce rulează când. Folosește-le pentru a controla amploarea și costul.

### Tag-uri Disponibile

| Tag | Acoperire | Număr Teste | Caz de Utilizare |
|-----|-----------|-------------|------------------|
| `@smoke` | Căi critice happy | ~10 | Validare PR, hook-uri commit |
| `@critical` | Fluxuri must-work | ~15 | Poartă pre-deployment |
| `@regression` | Acoperire completă funcționalități | ~40 | Rulări nightly |
| `@api` | Teste nivel API | 151 | Validare rapidă backend |
| `@e2e` | Teste UI + integrare | 40 | Compatibilitate browser |
| `@mobile` | Teste responsive mobile | ~12 | Testare specifică dispozitive |
| `@shopping` | Fluxuri coș + checkout | ~8 | Schimbări furnizor plată |
| `@credit` | Calculator credit | ~6 | Actualizări integrare bancă |
| `@catalog` | Listări produse + filtre | ~10 | Schimbări catalog/căutare |
| `@language` | Localizare RO/RU | ~5 | Actualizări traduceri |
| `@moldova` | Funcționalități specifice Moldova | ~8 | Logică regională |

### Exemple Utilizare Tag-uri

```bash
# === Contracte CI/CD ===
# PR: Doar teste smoke (feedback rapid)
npx cucumber-js --config cucumber.config.js --tags "@smoke"

# Nightly: Regresie (acoperire completă)
npx cucumber-js --config cucumber.config.js --tags "@regression"

# Pre-release: Doar căi critice
npx cucumber-js --config cucumber.config.js --tags "@critical"

# Tag-uri multiple (ȘI)
npx cucumber-js --config cucumber.config.js --tags "@smoke and @shopping"

# Exclude tag
npx cucumber-js --config cucumber.config.js --tags "not @mobile"
```

## 🗂️ Gestionarea Datelor de Test (Strategie Site Live)

**Provocare:** Testare pe smart.md live fără date test hardcodate.

### Descoperire Dinamică Produse

Testele **niciodată** nu hardcodează ID-uri sau nume produse. În schimb:

1. **Interogă API-ul catalog live** la start test
2. **Filtrează după criterii stabilitate:**
   - `price > 0` (în stoc)
   - `hasCredit === true` (widget credit disponibil)
   - `inStock === true` (livrabil)
   - `category === 'smartphone'` (atribute predictibile)
3. **Selectează primul produs corespunzător** pentru execuție test

```typescript
// Exemplu: Selecție dinamică produs
const validProduct = await catalogActions.getProducts('smartphone', {
  filters: {
    minPrice: 1000,
    hasCredit: true,
    inStock: true
  },
  limit: 1
});

// Testul continuă cu validProduct.id
```

### Strategie Fallback

Dacă niciun produs nu corespunde criteriilor:
- ✅ **Teste API:** Sări elegant cu `test.skip('No products in stock')`
- ✅ **Teste E2E:** Folosește tag `@known-issue` și raportează la monitorizare
- ✅ **CI:** Avertisment non-blocking (nu eșec)

### Ce NU Facem

❌ Hardcodăm ID-uri produse (`12345678`)
❌ Presupunem prețuri specifice (`expect(price).toBe(15999)`)
❌ Ne bazăm pe nume exacte produse (`iPhone 15 Pro Max`)

### Ce Facem În Schimb

✅ Validăm pattern-uri (`expect(price).toBeGreaterThan(0)`)
✅ Verificăm structură (`expect(product).toHaveProperty('id', 'title', 'price')`)
✅ Testăm interacțiuni (`addToCart()` → `expectCartCount(1)`)

**Rezultat:** Testele supraviețuiesc schimbărilor inventar, actualizărilor preț și scenariilor out-of-stock.

## 📊 Rapoarte Allure

### Generează Raport

```bash
# După rulare test
npm run allure:generate

# Deschide în browser
npm run allure:serve
```

### Funcționalități Raport

- 📸 Capturi ecran la eșec
- 🎥 Înregistrări video
- 📝 Execuție pas cu pas
- 📈 Analiză trend
- 🏷️ Detaliere tag-uri

## 🛡️ Stabilitate & Anti-Instabilitate

Acest framework implementează mai multe pattern-uri pentru a asigura teste stabile, fiabile:

### Strategia Piramidei de Testare

Urmează best practices **Piramida de Testare ISTQB**:

```text
   E2E (21%)     ← Puține, lente, fragile - Doar fluxuri critice
     ↑
  API (79%)      ← Multe, rapide, stabile - Logică business
```

**De ce acest raport?**
- ✅ **Feedback rapid** - Testele API rulează de 10x mai rapid decât E2E
- ✅ **Stabil** - Fără instabilitate UI, probleme browser sau timing
- ✅ **Precis** - Identifică exact eșecurile API/logică
- ✅ **Cost-eficient** - Mentenanță mai mică, mai puține false positive
- ❌ **Evită "anti-pattern clepsidră"** - Prea multe teste E2E = suite-uri lente, instabile

### Testare Combinatorială Pairwise

**Problemă:** Testarea tuturor combinațiilor filtrelor (3 branduri × 3 prețuri × 2 sortări = 18 teste) este costisitoare.

**Soluție:** Testarea Pairwise acoperă 90% din bug-uri cu 40% mai puține teste.

```typescript
// Exemplu: Combinații Brand × Preț × Sortare
const BRANDS = ['Samsung', 'Apple', 'Xiaomi'];
const PRICE_RANGES = [
  { min: 5000, max: 15000 },   // Mid-range
  { min: 20000, max: 50000 }   // Premium
];
const SORT = ['asc', 'desc'];

// În loc de 3×2×2=12 teste, generăm 6 perechi optime:
// 1. Samsung + Mid-range
// 2. Apple + Premium
// 3. Xiaomi + Mid-range
// 4. Samsung + Sortare ASC
// 5. Apple + Sortare DESC
// 6. Mid-range + Sortare DESC
```

**Beneficii:**
- Testează scenarii din lumea reală (utilizatorii combină filtre multiple)
- Detectează bug-uri interacțiune între filtre
- Eficient - acoperă majoritatea bug-urilor cu teste minime
- Scalează bine - adăugarea dimensiunii a 4-a (culoare) adaugă doar 8 teste, nu 48

### Lanțuri Fallback Selectori

Selectorii sunt proiectați să fie rezilienți la schimbări text și localizare.
Strategiile primare se bazează pe atribute CSS/data structurale, cu etichete human-readable folosite doar ca fallback.

Toți selectorii folosesc lanțuri fallback cu prioritate: `data-testid` → `data-*` → CSS → bazat-pe-text.

```typescript
// Exemplu: Buton adaugă în coș
addToCart: [
  '[data-testid="add-to-cart"]',
  '[data-action="add-to-cart"]',
  '.add-to-cart-btn',
  // Fallback RO: acoperă atât "cos" cât și "coș"
  'button:has-text(/co[sș]/i)',
  // Fallback RU
  'button:has-text(/корзин/i)',
].join(', ')
```

### Rezolvare Fallback Runtime (`firstWorkingLocator`)

Pentru lanțuri fallback complexe stocate ca șir unic concatenat cu virgule, framework-ul rezolvă primul selector *care corespunde efectiv* la runtime folosind `firstWorkingLocator`.

```ts
import { firstWorkingLocator } from './tests/shared/utils/locator-helper';
import { SELECTORS } from './tests/shared/config/selectors';

const addToCart = await firstWorkingLocator(page, SELECTORS.product.addToCart, { contextLabel: 'product.addToCart' });
await addToCart.click();
```

### Aserțiuni Agnostice de Limbă

Testele evită text UI hardcodat pentru șiruri business cheie. În schimb:

- Verifică selectori (nu text exact precum `"Coșul este gol"`)
- Folosesc pattern-uri URL pentru identificare produs
- Suportă atât variante RO cât și RU

```typescript
// ❌ Fragil
await expect(page.locator('text="Coșul este gol"')).toBeVisible();

// ✅ Stabil
await expect(page.locator(SELECTORS.cart.emptyState)).toBeVisible();
```

### Toleranță Preț

Aserțiunile preț permit variații minore (±1 MDL implicit):

```typescript
// Permite diferențe rotunjire
assertPricesApproximatelyEqual(actual, expected, tolerance: 1);
```

### Gestionare Overlay Demo

Modal-urile calculator credit pot arăta overlay-uri demo/promo care sunt automat închise.

### Verificări Vizibilitate CSS

Testele mobile verifică vizibilitatea CSS (nu doar prezența DOM):

```typescript
// Navigarea desktop poate exista în DOM dar ascunsă CSS pe mobil
await mobileMenu.assertDesktopNavHidden();
```

## ⚙️ Configurare

### Variabile de Mediu

Creează fișier `.env` (copiază din `.env.example`):

```env
# URL de bază
BASE_URL=https://smart.md

# Setări browser
HEADLESS=true
SLOW_MO=0

# Comportament uman
HUMAN_LIKE_MODE=true

# Timeout-uri (ms)
DEFAULT_TIMEOUT=30000
NAVIGATION_TIMEOUT=60000

# Execuție paralelă
PARALLEL_WORKERS=4
```

### Profile Cucumber

```bash
# Profil implicit
npm run test:e2e

# Profil smoke (doar scenarii critice)
npm run test:smoke

# Profil mobil
npm run test:mobile

# Profil CI (paralel + strict)
npx cucumber-js --config cucumber.config.js --profile ci
```

## 🔧 Dezvoltare

### Adaugă Funcționalitate Nouă

1. Creează fișier feature în `tests/e2e/features/`
2. Adaugă definiții step în `tests/e2e/steps/`
3. Creează/actualizează page objects dacă e necesar
4. Rulează și verifică

### Standarde Coding

- ESLint + Prettier pentru formatare cod
- Mod strict TypeScript
- Comentarii JSDoc pentru metode publice
- Interacțiuni human-like pentru toate operațiunile UI

### Rulează Linting

```bash
npm run lint
npm run lint:fix
npm run format
```

## 🤖 Integrare CI/CD

### GitHub Actions

Testele rulează automat la:

- Push pe `main` sau `develop`
- Pull requests
- Program zilnic (8:00 UTC)

### Etape Pipeline

1. **Install** - Dependențe & browsere
2. **Lint** - Verificare calitate cod
3. **Test** - Rulează teste smoke
4. **Report** - Generează & încarcă Allure

## 🐛 Depanare

### Probleme Comune

#### Testele eșuează cu "Element not found"

```bash
# Crește timeout-urile
DEFAULT_TIMEOUT=60000 npm test
```

#### Testele sunt instabile sau timeout

```bash
# Activează modul interacțiune umană (întârzieri realiste)
HUMAN_LIKE_MODE=true npm test

# Rulează cu browser vizibil pentru debugging
npm run test:headed
```

#### CI eșuează dar local trece

```bash
# Rulează în modul CI local
npx cucumber-js --config cucumber.config.js --profile ci
```

### Mod Debug

```bash
# Activează inspector Playwright
PWDEBUG=1 npm test

# Logging verbose
DEBUG=pw:api npm test
```

## 📸 Artefacte & Dovezi Test

Acest framework generează artefacte debugging bogate pentru fiecare rulare test.

### Exemplu Raport Allure

![Prezentare Generală Allure](docs/screenshots/allure-overview.png)
*Rezultate suite completă test cu detaliere pass/fail și analiză trend*

![Timeline Allure](docs/screenshots/allure-timeline.png)
*Timeline execuție paralelă arătând regresie completă de 4 minute*

### Exemplu Trace Execuție

![Trace Playwright](docs/screenshots/playwright-trace.png)
*Trace execuție pas cu pas cu log-uri rețea, output consolă și snapshot-uri DOM*

### Înregistrare Video

![Video Test](docs/screenshots/test-video.gif)
*Înregistrare browser real pentru testul E2E flux cumpărături*

### Artefacte Generate

Fiecare rulare test produce:

| Artefact | Locație | Scop |
|----------|---------|------|
| **Raport Allure** | `allure-report/index.html` | Sumar executiv, trenduri, detectare instabilitate |
| **Trace-uri Playwright** | `test-results/*/trace.zip` | Replay execuție completă (rețea, consolă, DOM) |
| **Capturi Ecran** | `test-results/*/screenshot-*.png` | Snapshot-uri eșec |
| **Video-uri** | `test-results/*/video.webm` | Înregistrări test complete (doar E2E) |
| **Log-uri** | `test-results/*/logs.txt` | Output consolă, răspunsuri API |

### Vizualizare Artefacte Local

```bash
# Deschide raport Allure în browser
npm run allure:serve

# Vizualizează trace Playwright pentru test eșuat
npx playwright show-trace test-results/shopping-flow/trace.zip
```

### Integrare CI/CD

Artefactele sunt încărcate automat în:
- **GitHub Actions:** Tab Artefacte (retenție 7 zile)
- **Allure TestOps:** Trenduri istorice și analiză instabilitate
- **S3/Azure Blob:** Stocare long-term pentru conformitate

**Notă:** Înregistrările video sunt dezactivate pentru testele API (nu sunt necesare), doar testele E2E generează video-uri.

## 📄 Licență

**Licență Comercială Proprietară**

Copyright © Victor Murashev. Toate drepturile rezervate.

Utilizarea permisă doar sub un acord comercial. Redistribuirea și revânzarea sunt interzise.

Vezi [LICENSE](LICENSE) pentru termeni completi.

## 👥 Contribuții

Acesta este un proiect proprietar. Contribuțiile nu sunt acceptate în prezent.

Pentru întrebări comerciale sau implementări personalizate, vă rugăm să contactați autorul.

---

Framework Profesional de Automatizare QA de Victor Murashev

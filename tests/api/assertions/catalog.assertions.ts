/**
 * Catalog Assertions - business invariants for catalog
 */

import { expect } from '@playwright/test';
import { Category, Product, CatalogPage, CatalogFilter } from '../actions/catalog.actions';

// === CATEGORIES ===

/**
 * Проверить, что категория существует
 */
export function expectCategoryExists(category: Category | null): void {
    expect(category, 'Категория должна существовать').not.toBeNull();
}

/**
 * Проверить структуру категории
 */
export function expectCategoryStructureValid(category: Category): void {
    expect(category.id, 'Категория должна иметь ID').toBeDefined();
    expect(category.name, 'Категория должна иметь название').toBeTruthy();
    expect(category.slug, 'Категория должна иметь slug').toBeTruthy();
}

/**
 * Проверить, что категория имеет товары
 */
export function expectCategoryHasProducts(category: Category): void {
    expect(
        category.productCount,
        'Категория должна содержать товары'
    ).toBeGreaterThan(0);
}

/**
 * Проверить иерархию категорий
 */
export function expectCategoryHierarchyValid(categories: Category[]): void {
    expect(categories.length, 'Должны быть категории').toBeGreaterThan(0);
    
    // Check that child categories have parents
    for (const category of categories) {
        if (category.parentId) {
            const parentExists = categories.some(c => c.id === category.parentId);
            expect(
                parentExists,
                `Родительская категория ${category.parentId} должна существовать`
            ).toBe(true);
        }
    }
}

// === PRODUCTS ===

/**
 * Проверить, что товар существует
 */
export function expectProductExists(product: Product | null): void {
    expect(product, 'Товар должен существовать').not.toBeNull();
}

/**
 * Проверить обязательные поля товара
 */
export function expectProductStructureValid(product: Product): void {
    expect(product.id, 'Товар должен иметь ID').toBeDefined();
    expect(product.title, 'Товар должен иметь название').toBeTruthy();
    expect(typeof product.price, 'Цена должна быть числом').toBe('number');
    expect(product.price, 'Цена должна быть положительной').toBeGreaterThan(0);
    expect(typeof product.available, 'Наличие должно быть boolean').toBe('boolean');
}

/**
 * Проверить, что товар в наличии
 */
export function expectProductAvailable(product: Product): void {
    expect(product.available, `Товар "${product.title}" должен быть в наличии`).toBe(true);
}

/**
 * Проверить, что товар имеет скидку
 */
export function expectProductHasDiscount(product: Product): void {
    expect(product.oldPrice, 'Товар должен иметь старую цену').toBeDefined();
    expect(
        product.oldPrice! > product.price,
        'Старая цена должна быть больше текущей'
    ).toBe(true);
}

/**
 * Проверить корректность скидки
 */
export function expectDiscountValid(product: Product): void {
    if (product.oldPrice) {
        const discount = product.oldPrice - product.price;
        const discountPercent = (discount / product.oldPrice) * 100;
        
        expect(discount, 'Скидка должна быть положительной').toBeGreaterThan(0);
        expect(discountPercent, 'Скидка не должна превышать 90%').toBeLessThanOrEqual(90);
    }
}

// === CATALOG ===

/**
 * Проверить структуру страницы каталога
 */
export function expectCatalogPageStructureValid(page: CatalogPage): void {
    expect(page).toHaveProperty('products');
    expect(page).toHaveProperty('total');
    expect(page).toHaveProperty('page');
    expect(Array.isArray(page.products)).toBe(true);
    expect(typeof page.total).toBe('number');
}

/**
 * Проверить, что каталог не пустой
 */
export function expectCatalogNotEmpty(page: CatalogPage): void {
    expect(page.products.length, 'Каталог должен содержать товары').toBeGreaterThan(0);
    expect(page.total, 'Общее количество должно быть > 0').toBeGreaterThan(0);
}

/**
 * Проверить сортировку по цене (возрастание)
 */
export function expectProductsSortedByPriceAsc(products: Product[]): void {
    for (let i = 1; i < products.length; i++) {
        expect(
            products[i].price,
            `Цена товара ${i} должна быть >= цены товара ${i-1}`
        ).toBeGreaterThanOrEqual(products[i - 1].price);
    }
}

/**
 * Проверить сортировку по цене (убывание)
 */
export function expectProductsSortedByPriceDesc(products: Product[]): void {
    for (let i = 1; i < products.length; i++) {
        expect(
            products[i].price,
            `Цена товара ${i} должна быть <= цены товара ${i-1}`
        ).toBeLessThanOrEqual(products[i - 1].price);
    }
}

// === FILTERS ===

/**
 * Проверить наличие фильтров
 */
export function expectFiltersAvailable(filters: CatalogFilter[]): void {
    expect(filters.length, 'Должны быть доступны фильтры').toBeGreaterThan(0);
}

/**
 * Проверить структуру фильтра
 */
export function expectFilterStructureValid(filter: CatalogFilter): void {
    expect(filter.name, 'Фильтр должен иметь название').toBeTruthy();
    expect(
        ['range', 'checkbox', 'radio'].includes(filter.type),
        'Тип фильтра должен быть валидным'
    ).toBe(true);
    
    if (filter.type === 'range') {
        expect(filter.min, 'Range фильтр должен иметь min').toBeDefined();
        expect(filter.max, 'Range фильтр должен иметь max').toBeDefined();
    } else {
        expect(filter.options?.length, 'Фильтр должен иметь опции').toBeGreaterThan(0);
    }
}

/**
 * Проверить, что фильтр по бренду существует
 */
export function expectBrandFilterExists(filters: CatalogFilter[]): void {
    const brandFilter = filters.find(f => 
        f.name.toLowerCase().includes('brand') || 
        f.name.toLowerCase().includes('бренд') ||
        f.name.toLowerCase().includes('производитель')
    );
    expect(brandFilter, 'Должен быть фильтр по бренду').toBeDefined();
}

/**
 * Проверить, что фильтр по цене существует
 */
export function expectPriceFilterExists(filters: CatalogFilter[]): void {
    const priceFilter = filters.find(f => 
        f.name.toLowerCase().includes('price') || 
        f.name.toLowerCase().includes('цена') ||
        f.type === 'range'
    );
    expect(priceFilter, 'Должен быть фильтр по цене').toBeDefined();
}

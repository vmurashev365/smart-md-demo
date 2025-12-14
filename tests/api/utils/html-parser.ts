/**
 * HTML Parser utilities for extracting data from smart.md pages
 */

import * as cheerio from 'cheerio';
import { Category, Product, CatalogFilter, CatalogPage } from '../actions/catalog.actions';

export class HtmlParser {
/**
 * Parse categories from homepage HTML
 */
static parseCategories(html: string): Category[] {
    const $ = cheerio.load(html);
    const categories: Category[] = [];

    // Try multiple selectors for categories
    const categorySelectors = [
        '.header-catalog-list a',
        '.catalog-menu a',
        '.main-menu a',
        'nav a[href*="/catalog/"]',
        'a[href*="/category/"]',
        '.category-link'
    ];

    for (const selector of categorySelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
            elements.each((index, element) => {
                const $el = $(element);
                const href = $el.attr('href') || '';
                const name = $el.text().trim();
                
                if (name && href && !href.includes('javascript:') && href.length > 1) {
                    // Extract slug from URL
                    const match = href.match(/\/([^\/]+)\/?$/);
                    const slug = match ? match[1] : href.replace(/\//g, '');
                    
                    if (slug && !categories.find(c => c.slug === slug)) {
                        categories.push({
                            id: slug,
                            name: name,
                            slug: slug
                        });
                    }
                }
            });
            
            if (categories.length > 0) break;
        }
    }

    return categories;
}

/**
 * Parse category links from search results page
 * smart.md search returns categories, not products
 */
static parseSearchCategories(html: string): Array<{ name: string; url: string }> {
    const $ = cheerio.load(html);
    const categories: Array<{ name: string; url: string }> = [];
    
    // Find all category names in search results
    const categoryElements = $('h2.__new_category_home_category_name');
    
    categoryElements.each((index, element) => {
        const $el = $(element);
        const name = $el.text().trim();
        
        // Find parent container and look for first link
        const parent = $el.closest('div');
        const link = parent.find('a[href]').first();
        const href = link.attr('href');
        
        if (name && href) {
            // Convert relative URLs to paths
            let url = href;
            if (href.startsWith('http')) {
                url = new URL(href).pathname;
            }
            
            categories.push({ name, url });
        }
    });
    
    return categories;
}

/**
 * Parse category information from category page HTML
 */
static parseCategoryPage(html: string, slug: string): Category | null {
    const $ = cheerio.load(html);
    
    // Check if this is an error page (404, etc)
    const pageTitle = $('title').text().toLowerCase();
    if (pageTitle.includes('404') || pageTitle.includes('not found') || 
        pageTitle.includes('страница не найдена') || pageTitle.includes('pagina nu a fost gasita')) {
        return null;
    }
    
    // Check if we have any products on the page - if not, might be invalid category
    const hasProducts = $('.custom_product_content[data-visely-article-product-id]').length > 0;
    if (!hasProducts && !pageTitle.includes('magazin')) {
        return null;
    }
    
    // Try to find category name
    const titleSelectors = [
        'h1',
        '.category-title',
        '.page-title',
        '[itemprop="name"]'
    ];
    
    let name = '';
    for (const selector of titleSelectors) {
        const text = $(selector).first().text().trim();
        if (text) {
            name = text;
            break;
        }
    }
    
    if (!name) {
        // If no name found, use pathname as fallback
        name = 'Category';
    }
    
    // Try to extract product count
    const countSelectors = [
        '.product-count',
        '.total-products',
        '.results-count'
    ];
    
    let productCount: number | undefined;
    for (const selector of countSelectors) {
        const text = $(selector).first().text();
        const match = text.match(/(\d+)/);
        if (match) {
            productCount = parseInt(match[1]);
            break;
        }
    }
    
    return {
        id: slug,
        name,
        slug,
        productCount
    };
}

/**
 * Parse products from category/search page HTML
 */
static parseProducts(html: string): Product[] {
    const $ = cheerio.load(html);
    const products: Product[] = [];

    // smart.md uses custom_product_content class with data-visely-article-product-id attribute
    const productElements = $('.custom_product_content[data-visely-article-product-id]');

    if (productElements.length === 0) return products;

    productElements.each((index, element) => {
        const $product = $(element);
        
        // Extract product ID from data-visely-article-product-id attribute
        const id = $product.attr('data-visely-article-product-id') || String(index + 1);
        
        // Extract title from .custom_product_title h4
        const title = $product.find('.custom_product_title h4').first().text().trim();
        
        if (!title) return;
        
        // Extract price from .custom_product_price .regular
        const regularPriceText = $product.find('.custom_product_price .regular').first().text();
        let price = 0;
        const priceMatch = regularPriceText.match(/(\d+[\s,]?\d*)/);
        if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(/[\s,]/g, ''));
        }
        
        // Extract old price from .custom_product_price .special (if exists)
        const specialPriceText = $product.find('.custom_product_price .special').first().text();
        let oldPrice: number | undefined;
        const oldPriceMatch = specialPriceText.match(/(\d+[\s,]?\d*)/);
        if (oldPriceMatch) {
            oldPrice = parseFloat(oldPriceMatch[1].replace(/[\s,]/g, ''));
        }
        
        // Extract availability - check for "Livrare rapida" text
        const deliveryText = $product.find('.custom_product_delivery').first().text();
        const available = deliveryText.includes('Livrare rapida') || deliveryText.includes('Быстрая доставка');
        
        // Extract image from .custom_product_image img
        const image = $product.find('.custom_product_image img').first().attr('data-src') || 
                      $product.find('.custom_product_image img').first().attr('src') || '';
        
        // Extract link from .custom_product_title a or .custom_product_image a
        const link = $product.find('.custom_product_title a, .custom_product_image a').first().attr('href') || '';
        
        // Extract delivery/availability text for localization checks
        const interfaceText = deliveryText || $product.text();
        
        products.push({
            id,
            title,
            price,
            oldPrice,
            currency: 'MDL',
            available,
            image,
            link: link.startsWith('http') ? link : `https://www.smart.md${link}`,
            description: interfaceText.trim() // Include interface text for localization checks
        });
    });

    return products;
}

/**
 * Parse product details from product page HTML
 */
static parseProductDetails(html: string): Product | null {
    const $ = cheerio.load(html);
    
    // Extract product ID
    const id = $('[data-product-id]').attr('data-product-id') ||
               $('body').attr('data-product-id') ||
               '0';
    
    // Extract title
    const titleSelectors = [
        'h1[itemprop="name"]',
        'h1.product-title',
        'h1'
    ];
    
    let title = '';
    for (const selector of titleSelectors) {
        const text = $(selector).first().text().trim();
        if (text) {
            title = text;
            break;
        }
    }
    
    if (!title) return null;
    
    // Extract price
    const priceSelectors = [
        '[itemprop="price"]',
        '.product-price',
        '.price-current',
        '#priceProduct'
    ];
    
    let price = 0;
    for (const selector of priceSelectors) {
        const $el = $(selector).first();
        const priceText = $el.text() || $el.attr('content') || $el.val() as string || '';
        const priceMatch = priceText.match(/(\d+[\s,]?\d*)/);
        if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(/[\s,]/g, ''));
            break;
        }
    }
    
    // Extract old price
    let oldPrice: number | undefined;
    const oldPriceText = $('.old-price, .price-old, del .price').first().text();
    const oldPriceMatch = oldPriceText.match(/(\d+[\s,]?\d*)/);
    if (oldPriceMatch) {
        oldPrice = parseFloat(oldPriceMatch[1].replace(/[\s,]/g, ''));
    }
    
    // Extract description
    const description = $('.product-description, [itemprop="description"]').first().text().trim() || undefined;
    
    // Extract images
    const images: string[] = [];
    $('.product-image img, .product-gallery img, [itemprop="image"]').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && !src.includes('placeholder')) {
            images.push(src);
        }
    });
    
    // Extract availability
    const available = !$('.out-of-stock, .unavailable').length &&
                     !$('body').text().toLowerCase().includes('nu este disponibil') &&
                     !$('body').text().toLowerCase().includes('нет в наличии');
    
    // Extract brand
    const brand = $('[itemprop="brand"], .product-brand').first().text().trim() || undefined;
    
    // Extract SKU
    const sku = $('[itemprop="sku"], .product-sku, .sku').first().text().trim() || undefined;
    
    // Extract rating
    let rating: number | undefined;
    const ratingText = $('[itemprop="ratingValue"]').attr('content') || 
                       $('.rating-value').text();
    if (ratingText) {
        rating = parseFloat(ratingText);
    }
    
    // Extract specifications
    const specifications: Record<string, string> = {};
    $('.specifications tr, .product-specs tr').each((i, el) => {
        const $row = $(el);
        const key = $row.find('th, td').first().text().trim();
        const value = $row.find('td').last().text().trim();
        if (key && value) {
            specifications[key] = value;
        }
    });
    
    return {
        id,
        title,
        price,
        oldPrice,
        currency: 'MDL',
        description,
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
        images: images.length > 0 ? images : undefined,
        available,
        brand,
        sku,
        rating
    };
}

/**
 * Parse filters from category page HTML
 */
static parseFilters(html: string): CatalogFilter[] {
    const $ = cheerio.load(html);
    const filters: CatalogFilter[] = [];
    
    // smart.md использует Visely для фильтров
    // Ищем контейнер с фильтрами
    const filterContainer = $('[data-visely-part="facets"]');
    
    if (filterContainer.length === 0) {
        return filters;
    }
    
    // Перебираем все фильтры
    filterContainer.find('.search-product-facet').each((i, facetElement) => {
        const $facet = $(facetElement);
        const facetId = $facet.attr('data-facet-id') || '';
        
        // Получаем имя фильтра
        const name = $facet.find('.custom_filter_name, .search-product-facet-title').first().text().trim();
        if (!name) return;
        
        // Определяем тип фильтра
        // Диапазонные фильтры (price, размеры)
        if ($facet.find('.search-product-facet-range-slider').length > 0 || facetId.includes('pricef')) {
            const $rangeInputs = $facet.find('input[type="text"], input.range-input');
            
            let min = 0;
            let max = 999999;
            
            // Пытаемся найти минимальное и максимальное значение
            if ($rangeInputs.length >= 2) {
                const minVal = $rangeInputs.first().val();
                const maxVal = $rangeInputs.last().val();
                
                if (minVal) min = parseFloat(String(minVal).replace(/\s/g, '')) || 0;
                if (maxVal) max = parseFloat(String(maxVal).replace(/\s/g, '')) || 999999;
            }
            
            // Также можем попробовать найти в data-атрибутах слайдера
            const $slider = $facet.find('[data-min], [data-max]');
            if ($slider.length > 0) {
                const dataMin = $slider.attr('data-min');
                const dataMax = $slider.attr('data-max');
                if (dataMin) min = parseFloat(dataMin);
                if (dataMax) max = parseFloat(dataMax);
            }
            
            filters.push({
                name,
                type: 'range',
                min,
                max
            });
        } 
        // Чекбокс фильтры (бренды, характеристики)
        else if ($facet.find('.custom_filter_option').length > 0) {
            const options: Array<{ value: string; label: string; count?: number }> = [];
            
            $facet.find('.custom_filter_option').each((j, valueElement) => {
                const $value = $(valueElement);
                
                // Получаем checkbox для value и label
                const $checkbox = $value.find('input[type="checkbox"]');
                const $label = $value.find('label');
                
                // value из checkbox или data-атрибута
                const value = $checkbox.attr('value') || $value.attr('data-search-facet-value') || '';
                
                // label - это текст внутри label между </div> и <span>
                let label = $checkbox.attr('value') || value; // fallback на value
                
                // Извлекаем count из <span> внутри label
                const $countSpan = $label.find('span');
                let count: number | undefined = undefined;
                if ($countSpan.length > 0) {
                    const countText = $countSpan.text().trim();
                    count = parseInt(countText) || undefined;
                }
                
                if (label && value) {
                    options.push({ value, label, count });
                }
            });
            
            if (options.length > 0) {
                filters.push({
                    name,
                    type: 'checkbox',
                    options
                });
            }
        }
    });
    
    return filters;
}

/**
 * Parse catalog page with products and metadata
 */
static parseCatalogPage(html: string, slug: string, page: number = 1): CatalogPage {
    const $ = cheerio.load(html);
    
    const products = HtmlParser.parseProducts(html);
    const filters = HtmlParser.parseFilters(html);
    const category = HtmlParser.parseCategoryPage(html, slug);
    
    // Try to extract total count
    let total = products.length;
    const totalSelectors = [
        '.total-products',
        '.results-count',
        '.product-count'
    ];
    
    for (const selector of totalSelectors) {
        const text = $(selector).first().text();
        const match = text.match(/(\d+)/);
        if (match) {
            total = parseInt(match[1]);
            break;
        }
    }
    
    return {
        products,
        total,
        page,
        pageSize: products.length,
        filters,
        category: category || undefined
    };
}
}

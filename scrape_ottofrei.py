"""
OttoFrei Gemstone Scraper
Scrapes faceted gemstones from page 4 of OttoFrei's lab-created collection.
Filters out cabochons and follows product links to extract detailed information.
"""

import asyncio
import json
from playwright.async_api import async_playwright
from datetime import datetime

# Target URL - page 4 of faceted gemstones collection
TARGET_URL = "https://www.ottofrei.com/collections/faceted-stones?page=5"

async def get_product_links(page, category_url):
    """Get all individual product links from the category page."""
    print(f"Loading category page: {category_url}")
    await page.goto(category_url, wait_until="domcontentloaded")
    await page.wait_for_timeout(2000)
    
    # Extract product links - adjust selector based on OttoFrei's HTML structure
    # Common Shopify selectors
    possible_selectors = [
        'a.product-item__title',
        '.product-item a[href*="/products/"]',
        '.product-card a[href*="/products/"]',
        'a[href*="/products/"]'
    ]
    
    product_links = []
    for selector in possible_selectors:
        try:
            links = await page.eval_on_selector_all(
                selector,
                '(links) => links.map(link => link.href)'
            )
            if links:
                product_links = links
                print(f"  Found {len(links)} product links using selector: {selector}")
                break
        except:
            continue
    
    # Remove duplicates
    product_links = list(set(product_links))
    print(f"  Total unique product links: {len(product_links)}")
    
    return product_links

async def scrape_product_details(page, product_url):
    """Scrape detailed information from an individual product page."""
    try:
        await page.goto(product_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        
        # Extract product data using JavaScript
        product_data = await page.evaluate('''() => {
            // Helper function to clean text
            const cleanText = (text) => text ? text.trim() : null;
            
            // Get product name/title
            const titleSelectors = [
                '.product__title',
                '.product-title',
                'h1.product-single__title',
                'h1[itemprop="name"]',
                'h1'
            ];
            let name = null;
            for (const selector of titleSelectors) {
                const el = document.querySelector(selector);
                if (el && el.innerText) {
                    name = cleanText(el.innerText);
                    break;
                }
            }
            
            // Get product description
            const descSelectors = [
                '.product__description',
                '.product-description',
                '.product-single__description',
                '[itemprop="description"]'
            ];
            let description = null;
            for (const selector of descSelectors) {
                const el = document.querySelector(selector);
                if (el && el.innerText) {
                    description = cleanText(el.innerText);
                    break;
                }
            }
            
            // Extract variations from Shopify product JSON
            let variations = [];
            const scriptTags = document.querySelectorAll('script[type="application/json"]');
            let productJson = null;
            
            for (const script of scriptTags) {
                try {
                    const data = JSON.parse(script.textContent);
                    if (data.product || data.variants) {
                        productJson = data.product || data;
                        break;
                    }
                } catch(e) {}
            }
            
            // Try to find product JSON in window object
            if (!productJson && window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
                try {
                    productJson = window.ShopifyAnalytics.meta.product;
                } catch(e) {}
            }
            
            // Parse variants if found
            if (productJson && productJson.variants) {
                variations = productJson.variants.map(v => {
                    return {
                        size: v.option1 || v.title || null,
                        price: v.price ? parseFloat(v.price) / 100 : null,  // Shopify prices in cents
                        in_stock: v.available || false
                    };
                });
            }
            
            // Fallback: try to get single price if no variations
            if (variations.length === 0) {
                const priceSelectors = [
                    '.product__price .price-item--regular',
                    '.product-price',
                    '[itemprop="price"]',
                    '.price'
                ];
                let price = null;
                for (const selector of priceSelectors) {
                    const el = document.querySelector(selector);
                    if (el) {
                        const priceText = el.innerText || el.textContent || el.getAttribute('content');
                        if (priceText) {
                            const match = priceText.match(/[\\d.,]+/);
                            if (match) {
                                price = parseFloat(match[0].replace(',', ''));
                                break;
                            }
                        }
                    }
                }
                
                if (price) {
                    variations.push({
                        size: null,
                        price: price,
                        in_stock: true
                    });
                }
            }
            
            return {
                name: name,
                description: description,
                variations: variations
            };
        }''')
        
        # Filter out cabochons
        name_lower = (product_data['name'] or '').lower()
        desc_lower = (product_data['description'] or '').lower()
        
        if 'cabochon' in name_lower or 'cabochon' in desc_lower:
            print(f"    FILTERED (cabochon): {product_data['name']}")
            return None
        
        # Parse name to extract material, color, shape
        name = product_data['name'] or ''
        
        # Default values
        material = None
        color = None
        shape = None
        
        # Detect material
        if any(term in name.lower() for term in ['lab created', 'lab-created', 'synthetic', 'created']):
            material = 'Lab Created'
        elif 'cubic zirconia' in name.lower() or 'cz' in name.lower():
            material = 'Cubic Zirconia'
        
        # Extract shape (common gemstone shapes)
        shape_keywords = [
            'round', 'oval', 'emerald', 'cushion', 'pear', 'marquise', 
            'princess', 'radiant', 'asscher', 'heart', 'trillion', 'baguette'
        ]
        name_lower = name.lower()
        for keyword in shape_keywords:
            if keyword in name_lower:
                shape = keyword.capitalize()
                break
        
        # Extract color (common gemstone colors)
        color_keywords = {
            'ruby': 'Red', 'sapphire': 'Blue', 'emerald': 'Green',
            'amethyst': 'Purple', 'aquamarine': 'Blue', 'citrine': 'Yellow',
            'topaz': 'Blue', 'peridot': 'Green', 'garnet': 'Red',
            'red': 'Red', 'blue': 'Blue', 'green': 'Green', 
            'yellow': 'Yellow', 'pink': 'Pink', 'purple': 'Purple',
            'orange': 'Orange', 'white': 'White', 'clear': 'Clear'
        }
        for keyword, color_name in color_keywords.items():
            if keyword in name_lower:
                color = color_name
                break
        
        result = {
            'name': name,
            'material': material,
            'color': color,
            'shape': shape,
            'variations': product_data['variations'],
            'url': product_url
        }
        
        return result
        
    except Exception as e:
        print(f"    Error scraping {product_url}: {e}")
        return None

async def main():
    """Main function to scrape OttoFrei page 4."""
    print("="*60)
    print("OttoFrei Faceted Gemstone Scraper")
    print("Target: Page 4 only")
    print("="*60)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Get product links from page 4
        product_links = await get_product_links(page, TARGET_URL)
        
        if not product_links:
            print("\nNo product links found! Check selectors or page structure.")
            await browser.close()
            return
        
        print(f"\nScraping {len(product_links)} products...")
        
        # Scrape each product
        all_products = []
        for i, product_url in enumerate(product_links, 1):
            print(f"  [{i}/{len(product_links)}] {product_url}")
            product_data = await scrape_product_details(page, product_url)
            if product_data:
                all_products.append(product_data)
                print(f"    ✓ Extracted: {product_data['name']}")
        
        await browser.close()
        
        # Save to JSON file
        output_file = "OttoFreiGemstonesJan11202602.json"
        output_data = {
            "scraped_at": datetime.now().isoformat(),
            "total_products": len(all_products),
            "categories_scraped": 1,  # Only page 4
            "source_url": TARGET_URL,
            "products": all_products
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        # Calculate statistics
        total_variations = sum(len(p['variations']) for p in all_products)
        products_with_variations = sum(1 for p in all_products if len(p['variations']) > 0)
        
        print(f"\n{'='*60}")
        print(f"Scraping Complete!")
        print(f"{'='*60}")
        print(f"Products scraped: {len(all_products)}")
        print(f"Products with price data: {products_with_variations}")
        print(f"Total size/price variations: {total_variations}")
        print(f"Output file: {output_file}")
        print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(main())

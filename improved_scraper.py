import asyncio
import json
import os
from playwright.async_api import async_playwright
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

# Load URLs from discovered product pages
with open('product_urls.txt', 'r') as f:
    CATEGORY_URLS = [line.strip().strip(',').strip('"') for line in f if line.strip()]

async def get_product_links(page, category_url):
    """Get all individual product links from a category page."""
    await page.goto(category_url, wait_until="domcontentloaded")
    await page.wait_for_timeout(2000)
    
    # Get all product links
    product_links = await page.eval_on_selector_all(
        '.product-small.col a[href*="/product/"]',
        '(links) => links.map(link => link.href)'
    )
    
    # Remove duplicates
    return list(set(product_links))

async def scrape_product_details(page, product_url):
    """Scrape detailed information from an individual product page using JSON data."""
    try:
        await page.goto(product_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        
        # Extract product data
        product_data = await page.evaluate('''() => {
            // Get basic product info
            const nameEl = document.querySelector('.product-title');
            const name = nameEl ? nameEl.innerText.trim() : '';
            
            // Extract variation data from JSON
            const form = document.querySelector('.variations_form');
            let variations = [];
            
            if (form && form.dataset.product_variations) {
                try {
                    const varData = JSON.parse(form.dataset.product_variations);
                    variations = varData.map(v => {
                        const attrs = v.attributes || {};
                        const size = Object.values(attrs)[0] || null;
                        return {
                            size: size,
                            price: v.display_price || v.price || null,
                            in_stock: v.is_in_stock || false
                        };
                    });
                } catch(e) {
                    console.error('Error parsing variations:', e);
                }
            }
            
            // If no variations, try to get single price
            if (variations.length === 0) {
                const priceEl = document.querySelector('.price .amount');
                const price = priceEl ? priceEl.innerText.replace('$', '').trim() : null;
                if (price) {
                    variations.push({
                        size: null,
                        price: parseFloat(price),
                        in_stock: true
                    });
                }
            }
            
            return {
                name: name,
                variations: variations
            };
        }''')
        
        # Parse name to extract material, color, shape
        name_parts = product_data['name'].split(',')
        base_name = name_parts[0].strip() if name_parts else product_data['name']
        shape = name_parts[1].strip() if len(name_parts) > 1 else None
        
        # Determine material and color from name
        material = None
        color = None
        if 'Cubic Zirconia' in base_name or 'CZ' in base_name:
            material = 'Cubic Zirconia'
            color_part = base_name.replace('Cubic Zirconia', '').replace('CZ', '').strip()
            if color_part:
                color = color_part
        elif 'Lab Created' in base_name or 'Pulled' in base_name or 'Hydrothermal' in base_name:
            material = 'Lab Created'
            # Extract color from name
            for word in base_name.split():
                if word.lower() in ['ruby', 'sapphire', 'emerald', 'amethyst', 'aquamarine', 'blue', 'green', 'pink', 'red', 'yellow']:
                    color = word
                    break
        
        result = {
            'name': product_data['name'],
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

async def scrape_category(category_url, category_index, total_categories):
    """Scrape all products from a category."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print(f"\n[{category_index}/{total_categories}] {category_url}")
        
        # Get all product links from category
        product_links = await get_product_links(page, category_url)
        print(f"  Found {len(product_links)} products")
        
        products = []
        for i, product_url in enumerate(product_links, 1):
            print(f"    [{i}/{len(product_links)}] Scraping product...", end='\r')
            product_data = await scrape_product_details(page, product_url)
            if product_data:
                products.append(product_data)
        
        print(f"    Completed: {len(products)} products extracted")
        
        await browser.close()
        return products

async def main():
    """Main function to scrape all categories."""
    all_products = []
    
    # Scrape all categories
    for i, category_url in enumerate(CATEGORY_URLS, 1):
        try:
            products = await scrape_category(category_url, i, len(CATEGORY_URLS))
            all_products.extend(products)
        except Exception as e:
            print(f"  Error processing category: {e}")
    
    # Save to JSON file
    output_file = f"complete_gemstone_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_data = {
        "scraped_at": datetime.now().isoformat(),
        "total_products": len(all_products),
        "categories_scraped": len(CATEGORY_URLS),
        "products": all_products
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    # Calculate total variations
    total_variations = sum(len(p['variations']) for p in all_products)
    
    print(f"\n{'='*60}")
    print(f"Scraping complete!")
    print(f"Total products: {len(all_products)}")
    print(f"Total size/price variations: {total_variations}")
    print(f"Saved to: {output_file}")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(main())

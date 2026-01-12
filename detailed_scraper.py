import asyncio
import json
import os
import subprocess
from playwright.async_api import async_playwright
from openai import OpenAI
from datetime import datetime
from dotenv import load_dotenv

# Clear OPENAI_API_KEY environment variable using PowerShell
subprocess.run(["powershell", "-Command", "$env:OPENAI_API_KEY = $null"], shell=True)

# Load environment variables
load_dotenv()

# Get API key from environment
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

print(f"API Key loaded: {api_key[:8]}...{api_key[-4:]}")
client = OpenAI(api_key=api_key)

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
    """Scrape detailed information from an individual product page."""
    try:
        await page.goto(product_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        
        # Extract all text content from the product page
        content = await page.evaluate('''() => {
            const main = document.querySelector('.product-main') || document.querySelector('.product-info') || document.body;
            return main.innerText;
        }''')
        
        # Use AI to parse the product details including all size/price variations
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """Extract gemstone product details. Return a JSON object with:
                    - name: product name (string)
                    - material: e.g., 'Cubic Zirconia', 'Lab Created' (string)
                    - color: gemstone color (string)
                    - shape: gemstone shape (string)
                    - variations: array of size/price variations, each with:
                        - size: dimension/size (e.g., "6x4mm", "1.00ct")
                        - price: price for this size (string or number)
                    
                    If no size variations are present, include a single variation with size=null.
                    If a field is not present, use null."""
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(completion.choices[0].message.content)
        result['url'] = product_url
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
    test_categories = CATEGORY_URLS
    
    for i, category_url in enumerate(test_categories, 1):
        try:
            products = await scrape_category(category_url, i, len(test_categories))
            all_products.extend(products)
        except Exception as e:
            print(f"  Error processing category: {e}")
    
    # Save to JSON file
    output_file = f"detailed_gemstone_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_data = {
        "scraped_at": datetime.now().isoformat(),
        "total_products": len(all_products),
        "categories_scraped": len(test_categories),
        "products": all_products
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"Scraping complete!")
    print(f"Total products: {len(all_products)}")
    print(f"Saved to: {output_file}")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(main())

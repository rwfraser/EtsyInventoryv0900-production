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

# Initialize OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
if api_key:
    # Remove quotes if present
    api_key = api_key.strip('"').strip("'")
    print(f"API Key loaded: {api_key[:8]}...{api_key[-4:]}")
else:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

client = OpenAI(api_key=api_key)
# Load URLs from discovered product pages
with open('product_urls.txt', 'r') as f:
    URLs = [line.strip().strip(',').strip('"') for line in f if line.strip()]
async def scrape_gemstones(url: str):
    """
    Scrape product data from a webpage using Playwright and AI-powered parsing.
    
    Args:
        url: The URL to scrape
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)  # Wait for dynamic content
        
        # 1. Extract raw text/HTML from the product container
        products_raw = await page.eval_on_selector_all(
            '.product-small.col',
            '(els) => els.map(el => el.innerText)'
        )
        
        print(f"Found {len(products_raw)} products on {url}")
        
        # 2. Delegate parsing to AI
        completion = client.chat.completions.create(
            model="gpt-4o-mini",  # Cost-effective for extraction
            messages=[
                {
                    "role": "system",
                    "content": """Extract gemstone product data from the provided text. Return a JSON object with a 'products' array.
                    Each product should have: name (string), price (string or number, handle ranges like '$43.50 - $160.00'), 
                    shape (string, if mentioned), size (string, if mentioned), material (string, e.g., 'Cubic Zirconia', 'Lab Created').
                    If a field is not present, use null."""
                },
                {
                    "role": "user",
                    "content": "\n---\n".join(products_raw)
                }
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(completion.choices[0].message.content)
        await browser.close()
        return result


async def main():
    """Main function to scrape all URLs and aggregate results."""
    all_products = []
    total_scraped = 0
    
    for i, url in enumerate(URLs, 1):
        print(f"\n[{i}/{len(URLs)}] Scraping: {url}")
        try:
            result = await scrape_gemstones(url)
            products = result.get('products', [])
            all_products.extend(products)
            total_scraped += len(products)
            print(f"  -> Found {len(products)} products (Total: {total_scraped})")
        except Exception as e:
            print(f"  -> Error: {e}")
    
    # Save to JSON file
    output_file = f"gemstone_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_data = {
        "scraped_at": datetime.now().isoformat(),
        "total_products": len(all_products),
        "sources": len(URLs),
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

import asyncio
from playwright.async_api import async_playwright

URLs = [
    "https://www.gemsngems.com/product-category/cubic-zirconia-gemstones/",
    "https://www.gemsngems.com/product-category/lab-created/"
]

async def inspect_page(url: str):
    """
    Inspect the HTML structure to find product containers.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print(f"\n{'='*80}")
        print(f"Inspecting: {url}")
        print(f"{'='*80}\n")
        
        await page.goto(url, wait_until="networkidle")
        
        # Check current selector
        print("1. Checking current selector '.product-small.col':")
        current_selector = await page.query_selector_all('.product-small.col')
        print(f"   Found {len(current_selector)} elements\n")
        
        # Try common product selectors
        selectors_to_try = [
            '.product',
            '.product-item',
            '.woocommerce-LoopProduct-link',
            'li.product',
            '.type-product',
            'article.product',
            '[class*="product"]'
        ]
        
        print("2. Trying common product selectors:")
        for selector in selectors_to_try:
            try:
                elements = await page.query_selector_all(selector)
                if elements:
                    print(f"   [OK] '{selector}': {len(elements)} elements")
                    # Get sample HTML from first element
                    if elements:
                        sample_html = await elements[0].inner_html()
                        print(f"     Sample HTML (first 300 chars):")
                        print(f"     {sample_html[:300]}...\n")
            except Exception as e:
                print(f"   [ERROR] '{selector}': Error - {e}")
        
        # Get first few product containers for detailed inspection
        print("3. Detailed inspection of first product:")
        try:
            first_product = await page.query_selector('[class*="product"]')
            if first_product:
                # Get outer HTML to see the structure
                outer_html = await first_product.evaluate('(el) => el.outerHTML')
                print(f"{outer_html[:800]}...\n")
                
                # Get text content
                text = await first_product.inner_text()
                print(f"Text content:\n{text}\n")
        except Exception as e:
            print(f"Error: {e}")
        
        await browser.close()

if __name__ == "__main__":
    for url in URLs:
        asyncio.run(inspect_page(url))

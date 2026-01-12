import asyncio
from playwright.async_api import async_playwright

async def inspect_products():
    """
    Inspect the actual product grid on a subcategory page.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Navigate to a page with actual product listings (not categories)
        url = "https://www.gemsngems.com/product-category/lab-created/hydrothermal-pulled-czochralski-gemstones/"
        print(f"Inspecting: {url}\n")
        
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)  # Wait for dynamic content
        
        # Look for product grid container
        grid_selectors = [
            '.products',
            '.product-container',
            'ul.products',
            '.woocommerce-products',
            '[class*="product"]'
        ]
        
        print("Looking for product grid containers:")
        for selector in grid_selectors:
            elements = await page.query_selector_all(selector)
            if elements:
                print(f"  '{selector}': {len(elements)} elements")
        
        # Try to find individual product cards
        print("\nLooking for individual product elements:")
        product_selectors = [
            '.col.product',
            'div[class*="col"][class*="product"]',
            '.product.type-product',
            'li.product',
            '.product-small'
        ]
        
        for selector in product_selectors:
            try:
                elements = await page.query_selector_all(selector)
                if elements:
                    print(f"  '{selector}': {len(elements)} elements")
                    if len(elements) > 0:
                        # Get HTML of first product
                        html = await elements[0].evaluate('(el) => el.outerHTML')
                        text = await elements[0].inner_text()
                        print(f"\n  Sample HTML (first 600 chars):")
                        print(f"  {html[:600]}")
                        print(f"\n  Sample text:")
                        print(f"  {text[:200]}")
                        print()
            except Exception as e:
                print(f"  Error with '{selector}': {e}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_products())

import asyncio
from playwright.async_api import async_playwright

async def find_product_page():
    """
    Navigate to subcategory to find actual product listings.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Try a subcategory URL
        url = "https://www.gemsngems.com/product-category/cubic-zirconia-gemstones/cubic-zirconia-color-stones-aaa/"
        print(f"Checking: {url}\n")
        
        await page.goto(url, wait_until="networkidle")
        
        # Try to find actual product items
        selectors = [
            'li.product',
            '.product-small',
            '.woocommerce-LoopProduct-link',
            'a[href*="/product/"]',
        ]
        
        for selector in selectors:
            elements = await page.query_selector_all(selector)
            print(f"Selector '{selector}': {len(elements)} elements")
            
            if elements and len(elements) > 0:
                # Get first product details
                first = elements[0]
                html = await first.evaluate('(el) => el.outerHTML')
                text = await first.inner_text()
                
                print(f"\nFirst element HTML (first 500 chars):")
                print(f"{html[:500]}...\n")
                print(f"First element text:")
                print(f"{text}\n")
                print("="*80)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(find_product_page())

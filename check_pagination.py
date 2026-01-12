import asyncio
from playwright.async_api import async_playwright

async def check_pagination():
    """
    Check if there's pagination and how many pages exist.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        url = "https://www.gemsngems.com/product-category/cubic-zirconia-gemstones/cubic-zirconia-color-stones-aaa/amethyst-cubic-zirconia/"
        print(f"Checking: {url}\n")
        
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        
        # Look for pagination elements
        pagination_selectors = [
            '.pagination',
            '.page-numbers',
            'nav.woocommerce-pagination',
            'a.next',
            'a[rel="next"]',
            '.nav-pagination'
        ]
        
        print("Looking for pagination:")
        for selector in pagination_selectors:
            elements = await page.query_selector_all(selector)
            if elements:
                print(f"  '{selector}': {len(elements)} elements")
                if len(elements) > 0:
                    text = await elements[0].inner_text()
                    html = await elements[0].evaluate('(el) => el.outerHTML')
                    print(f"    Text: {text[:100]}")
                    print(f"    HTML: {html[:400]}\n")
        
        # Count total products on page
        products = await page.query_selector_all('.product-small.col')
        print(f"\nProducts on current page: {len(products)}")
        
        # Look for "Show all" or results count
        result_selectors = ['.woocommerce-result-count', '.result-count', '[class*="result"]']
        for selector in result_selectors:
            elements = await page.query_selector_all(selector)
            if elements:
                for el in elements:
                    text = await el.inner_text()
                    print(f"Result info: {text}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_pagination())

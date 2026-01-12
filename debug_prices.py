import asyncio
from playwright.async_api import async_playwright

async def inspect_product_pricing():
    """
    Inspect how pricing is displayed on a product page.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # Use headless=False to see what's happening
        page = await browser.new_page()
        
        # Test a product that likely has null prices
        url = "https://www.gemsngems.com/product/cubic-zirconia-amethyst-aaa-marquise/"
        print(f"Inspecting: {url}\n")
        
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)  # Wait longer for dynamic content
        
        # Try to find price/variation selectors
        print("Looking for price elements:")
        
        # Check for select dropdowns
        selects = await page.query_selector_all('select')
        print(f"  Found {len(selects)} select elements")
        
        for i, select in enumerate(selects):
            label = await page.evaluate('(el) => el.previousElementSibling?.innerText || el.parentElement?.querySelector("label")?.innerText', select)
            options = await page.evaluate('(el) => Array.from(el.options).map(opt => opt.text)', select)
            print(f"  Select {i+1}: {label}")
            print(f"    Options: {options[:5]}")  # Show first 5 options
        
        # Check for price display
        price_selectors = ['.price', '.woocommerce-Price-amount', '[class*="price"]']
        for selector in price_selectors:
            elements = await page.query_selector_all(selector)
            if elements:
                for el in elements:
                    text = await el.inner_text()
                    html = await el.evaluate('(el) => el.outerHTML')
                    print(f"\n  Price element ({selector}):")
                    print(f"    Text: {text}")
                    print(f"    HTML: {html[:200]}")
        
        # Get the full product info area
        print("\n\nFull product info text:")
        product_info = await page.evaluate('''() => {
            const info = document.querySelector('.product-info') || document.querySelector('.product-main');
            return info ? info.innerText : 'Not found';
        }''')
        print(product_info[:1000])
        
        # Check for variation table/grid
        print("\n\nLooking for variation table:")
        tables = await page.query_selector_all('table, .variations')
        print(f"Found {len(tables)} tables/variation containers")
        
        if tables:
            table_content = await tables[0].inner_text()
            print(f"First table content:\n{table_content[:500]}")
        
        input("Press Enter to close browser...")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_product_pricing())

import asyncio
from playwright.async_api import async_playwright

async def test_price_selection():
    """
    Test selecting different sizes and capturing price changes.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        url = "https://www.gemsngems.com/product/cubic-zirconia-amethyst-aaa-marquise/"
        print(f"Testing: {url}\n")
        
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        
        # Extract variation data from the page's JSON data
        variation_data = await page.evaluate('''() => {
            const form = document.querySelector('.variations_form');
            if (form && form.dataset.product_variations) {
                try {
                    return JSON.parse(form.dataset.product_variations);
                } catch(e) {
                    return null;
                }
            }
            return null;
        }''')
        
        if variation_data:
            print(f"Found {len(variation_data)} variations in JSON data\n")
            print("All variations with prices:")
            for i, v in enumerate(variation_data, 1):
                attrs = v.get('attributes', {})
                size = list(attrs.values())[0] if attrs else 'Unknown'
                price = v.get('display_price', v.get('price', 'N/A'))
                in_stock = v.get('is_in_stock', False)
                print(f"  [{i}] {size}: ${price} (In stock: {in_stock})")
        else:
            print("No variation data found in JSON")
            
            # Try alternative: get from page text
            print("\nTrying to extract from page content...")
            content = await page.inner_text('.product-info')
            print(content[:500])
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_price_selection())

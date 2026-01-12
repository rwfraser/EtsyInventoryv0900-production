import asyncio
from playwright.async_api import async_playwright

# Starting category URLs
START_URLS = [
    "https://www.gemsngems.com/product-category/cubic-zirconia-gemstones/cubic-zirconia-color-stones-aaa/",
    "https://www.gemsngems.com/product-category/cubic-zirconia-gemstones/cubic-zirconia-white/",
    "https://www.gemsngems.com/product-category/lab-created/hydrothermal-pulled-czochralski-gemstones/",
    "https://www.gemsngems.com/product-category/lab-created/lab-created-corundum/",
]

async def discover_product_urls():
    """
    Discover all URLs that have actual product listings.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        product_urls = []
        
        for start_url in START_URLS:
            print(f"\nExploring: {start_url}")
            
            await page.goto(start_url, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)
            
            # Check if this page has products
            products = await page.query_selector_all('.product-small.col')
            
            if len(products) > 0:
                print(f"  -> Has {len(products)} products directly")
                product_urls.append(start_url)
            else:
                # This is a category overview - find subcategory links
                subcategories = await page.query_selector_all('.product-category.col a')
                print(f"  -> Found {len(subcategories)} subcategories")
                
                # Extract all hrefs first before navigating
                subcategory_hrefs = []
                for subcat in subcategories:
                    href = await subcat.get_attribute('href')
                    if href:
                        subcategory_hrefs.append(href)
                
                # Now navigate to each one
                for href in subcategory_hrefs:
                    await page.goto(href, wait_until="domcontentloaded")
                    await page.wait_for_timeout(1000)
                    
                    sub_products = await page.query_selector_all('.product-small.col')
                    
                    if len(sub_products) > 0:
                        print(f"    -> {href}: {len(sub_products)} products")
                        product_urls.append(href)
                    else:
                        print(f"    -> {href}: subcategory page (skipping)")
        
        await browser.close()
        
        print(f"\n{'='*60}")
        print(f"Found {len(product_urls)} product pages:")
        print(f"{'='*60}")
        for url in product_urls:
            print(f"  {url}")
        
        # Save to file
        with open('product_urls.txt', 'w') as f:
            for url in product_urls:
                f.write(f'"{url}",\n')
        
        print(f"\nSaved to product_urls.txt")

if __name__ == "__main__":
    asyncio.run(discover_product_urls())

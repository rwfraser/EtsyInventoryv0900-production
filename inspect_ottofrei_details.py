from playwright.sync_api import sync_playwright
import time
import re

def inspect_details():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        print("Loading OttoFrei faceted stones page...")
        page.goto('https://www.ottofrei.com/collections/faceted-stones')
        time.sleep(3)
        
        # Check total product count
        print("\nChecking product count...")
        count_selectors = [
            '.collection-count',
            '[class*="product-count"]',
            'text=/\\d+\\s+products?/i'
        ]
        
        for selector in count_selectors:
            try:
                elem = page.query_selector(selector)
                if elem:
                    print(f"  Found with {selector}: {elem.inner_text()}")
            except:
                pass
        
        # Check actual product cards
        products = page.query_selector_all('[data-product-id]')
        print(f"\n  Visible products on page: {len(products)}")
        
        # Look for pagination or load more
        print("\nChecking navigation...")
        page_html = page.content()
        
        # Look for page numbers in URLs
        page_links = re.findall(r'page=(\d+)', page_html)
        if page_links:
            max_page = max([int(p) for p in page_links])
            print(f"  Found pagination: up to page {max_page}")
        
        # Check for "Load More" functionality
        load_more_patterns = ['load more', 'show more', 'view more']
        for pattern in load_more_patterns:
            buttons = page.query_selector_all(f'button:has-text("{pattern}"), a:has-text("{pattern}")')
            if buttons:
                print(f"  Found '{pattern}' button")
        
        # Inspect first few products
        print("\nInspecting first 3 products...")
        for i, product in enumerate(products[:3]):
            print(f"\n  Product {i+1}:")
            
            # Get product link
            link = product.query_selector('a[href*="/products/"]')
            if link:
                url = link.get_attribute('href')
                print(f"    URL: {url}")
            
            # Get title
            title = product.query_selector('.product-title, [class*="title"]')
            if title:
                print(f"    Title: {title.inner_text().strip()}")
            
            # Get price
            price = product.query_selector('.price, [class*="price"]')
            if price:
                print(f"    Price: {price.inner_text().strip()}")
        
        # Check a single product page for variation structure
        print("\n\nInspecting a single product page for variations...")
        page.goto('https://www.ottofrei.com/products/oval-faceted-lab-created-emerald')
        time.sleep(2)
        
        # Check for variant selector
        variant_selectors = page.query_selector_all('select[name*="id"], .variant-selector, [class*="variant"]')
        print(f"  Found {len(variant_selectors)} variant selector(s)")
        
        # Check for JSON data
        script_tags = page.query_selector_all('script[type="application/json"]')
        for i, script in enumerate(script_tags):
            content = script.inner_text()
            if 'variants' in content or 'product' in content:
                print(f"  Found product JSON in script tag {i}")
                if len(content) < 500:
                    print(f"    Content preview: {content[:200]}...")
        
        browser.close()

if __name__ == '__main__':
    inspect_details()

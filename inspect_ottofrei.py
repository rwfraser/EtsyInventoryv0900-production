from playwright.sync_api import sync_playwright
import time
import json

def inspect_ottofrei():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        print("Loading OttoFrei faceted stones page...")
        page.goto('https://www.ottofrei.com/collections/faceted-stones')
        time.sleep(3)
        
        print(f"Page title: {page.title()}\n")
        
        # Check for pagination
        print("Checking pagination...")
        pagination_selectors = [
            '.pagination a',
            '[class*="pagination"]',
            'a[href*="page="]',
            '.next',
            '.prev'
        ]
        
        for selector in pagination_selectors:
            elements = page.query_selector_all(selector)
            if elements:
                print(f"  Found {len(elements)} elements with selector: {selector}")
                for i, elem in enumerate(elements[:5]):
                    text = elem.inner_text() if elem.inner_text() else elem.get_attribute('href')
                    print(f"    [{i}]: {text}")
        
        # Check for "Load More" or infinite scroll
        load_more = page.query_selector('button:has-text("Load"), a:has-text("Load More")')
        if load_more:
            print(f"\nFound 'Load More' button: {load_more.inner_text()}")
        
        # Check product grid
        print("\nChecking product layout...")
        product_selectors = [
            '.product-item',
            '[class*="product"]',
            '.grid-item',
            '[data-product-id]'
        ]
        
        for selector in product_selectors:
            elements = page.query_selector_all(selector)
            if elements:
                print(f"  Found {len(elements)} products with selector: {selector}")
        
        # Check first product structure
        print("\nInspecting first product...")
        first_product = page.query_selector('.product-item, [class*="product-card"]')
        if first_product:
            html = first_product.inner_html()
            print(f"  HTML length: {len(html)} chars")
            
            # Check for product link
            link = first_product.query_selector('a[href*="/products/"]')
            if link:
                print(f"  Product URL: {link.get_attribute('href')}")
            
            # Check for title
            title_selectors = ['.product-title', '[class*="title"]', 'h3', 'h2']
            for sel in title_selectors:
                title = first_product.query_selector(sel)
                if title:
                    print(f"  Title ({sel}): {title.inner_text()}")
                    break
        
        # Check if it's a Shopify store
        print("\nChecking for Shopify JSON...")
        script_tags = page.query_selector_all('script[type="application/json"]')
        print(f"  Found {len(script_tags)} JSON script tags")
        
        browser.close()

if __name__ == '__main__':
    inspect_ottofrei()

"""
OttoFrei Faceted Gemstones Scraper
Scrapes all faceted gemstone products from ottofrei.com/collections/faceted-stones
Handles pagination and extracts detailed variation data from individual product pages.
"""

import asyncio
import json
import re
from datetime import datetime
from playwright.async_api import async_playwright
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OttoFreiScraper:
    def __init__(self):
        self.base_url = "https://www.ottofrei.com"
        self.collection_url = f"{self.base_url}/collections/faceted-stones"
        self.products = []
        self.errors = []
        
    def filter_cabochon(self, product_name, product_description=""):
        """Filter out cabochon products"""
        text = f"{product_name} {product_description}".lower()
        return "cabochon" in text
    
    def normalize_shape(self, shape_text):
        """Normalize shape names"""
        if not shape_text:
            return None
        
        shape_lower = shape_text.lower().strip()
        
        # Shape mappings
        shape_map = {
            'octagon': 'Emerald',
            'emerald cut': 'Emerald',
            'princess': 'Square',
            'cushion': 'Square',
            'trillion': 'Trillion',
            'trillium': 'Trillion',
            'triangular': 'Trillion'
        }
        
        # Check mappings
        for key, value in shape_map.items():
            if key in shape_lower:
                return value
        
        # Capitalize first letter
        return shape_text.strip().title()
    
    def extract_shape_from_name(self, name):
        """Extract shape from product name"""
        name_lower = name.lower()
        
        shapes = [
            'round', 'oval', 'pear', 'marquise', 'heart', 'emerald', 
            'octagon', 'square', 'cushion', 'princess', 'trillion',
            'baguette', 'rectangle', 'triangular'
        ]
        
        for shape in shapes:
            if shape in name_lower:
                return self.normalize_shape(shape)
        
        return None
    
    def extract_material_from_name(self, name):
        """Extract material from product name"""
        name_lower = name.lower()
        
        if 'lab-created' in name_lower or 'lab created' in name_lower:
            return "Lab Created"
        elif 'imitation' in name_lower or 'synthetic' in name_lower:
            return "Synthetic"
        elif 'genuine' in name_lower or 'natural' in name_lower:
            return "Natural"
        elif 'cubic zirconia' in name_lower or 'cz' in name_lower:
            return "Cubic Zirconia"
        
        return None
    
    def parse_price(self, price_text):
        """Extract numeric price from text"""
        if not price_text:
            return None
        
        # Remove currency symbols and extract number
        match = re.search(r'\$?(\d+(?:\.\d{2})?)', str(price_text))
        if match:
            return float(match.group(1))
        return None
    
    def normalize_size(self, size_text):
        """Normalize size format to match reference (e.g., '5x3mm', '4.0mm')"""
        if not size_text:
            return None
        
        size_lower = size_text.lower().strip()
        
        # Remove 'pack of X' text but keep it if no actual size
        if 'pack of' in size_lower:
            # Try to extract actual size first
            size_match = re.search(r'(\d+\.?\d*)\s*x?\s*(\d+\.?\d*)?\s*mm', size_lower)
            if size_match:
                if size_match.group(2):
                    return f"{size_match.group(1)}x{size_match.group(2)}mm"
                else:
                    return f"{size_match.group(1)}mm"
            else:
                # Keep pack info if no actual dimension
                return size_text.strip()
        
        # Standard format: "5 x 3 mm" -> "5x3mm"
        size_match = re.search(r'(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*mm', size_lower)
        if size_match:
            return f"{size_match.group(1)}x{size_match.group(2)}mm"
        
        # Single dimension: "4mm" or "4.0 mm"
        size_match = re.search(r'(\d+\.?\d*)\s*mm', size_lower)
        if size_match:
            return f"{size_match.group(1)}mm"
        
        return size_text.strip()
    
    async def get_product_urls_from_page(self, page, page_num):
        """Extract product URLs from a collection page"""
        url = f"{self.collection_url}?page={page_num}"
        logger.info(f"Scraping collection page {page_num}: {url}")
        
        try:
            await page.goto(url, wait_until='load', timeout=60000)
            await asyncio.sleep(1)
            
            # Get all product cards
            product_cards = await page.query_selector_all('[data-product-id]')
            product_urls = []
            
            for card in product_cards:
                link = await card.query_selector('a[href*="/products/"]')
                if link:
                    href = await link.get_attribute('href')
                    if href:
                        full_url = href if href.startswith('http') else f"{self.base_url}{href}"
                        product_urls.append(full_url)
            
            logger.info(f"  Found {len(product_urls)} products on page {page_num}")
            return product_urls
            
        except Exception as e:
            error_msg = f"Error scraping collection page {page_num}: {str(e)}"
            logger.error(error_msg)
            self.errors.append(error_msg)
            return []
    
    async def scrape_product_page(self, page, product_url):
        """Scrape detailed product data from individual product page"""
        try:
            logger.info(f"  Scraping product: {product_url}")
            await page.goto(product_url, wait_until='load', timeout=60000)
            await asyncio.sleep(1)
            
            # Try to find Shopify product JSON
            product_data = None
            script_tags = await page.query_selector_all('script[type="application/json"]')
            
            for script in script_tags:
                content = await script.inner_text()
                try:
                    data = json.loads(content)
                    # Look for product data structure
                    if isinstance(data, dict) and 'product' in content.lower() and 'variants' in content.lower():
                        # This might be embedded in a larger structure
                        if 'product' in data:
                            product_data = data['product']
                            break
                except:
                    continue
            
            # If no JSON found, try extracting from page elements
            if not product_data:
                product_data = await self.extract_product_from_html(page)
            
            if product_data:
                return await self.parse_product_data(product_data, product_url)
            
            return None
            
        except Exception as e:
            error_msg = f"Error scraping product {product_url}: {str(e)}"
            logger.error(error_msg)
            self.errors.append(error_msg)
            return None
    
    async def extract_product_from_html(self, page):
        """Extract product data from HTML when JSON is not available"""
        try:
            # Get product title
            title_elem = await page.query_selector('h1.product-title, h1[class*="title"], .product-single__title')
            title = await title_elem.inner_text() if title_elem else "Unknown"
            
            # Get variants from select dropdown
            variants = []
            variant_select = await page.query_selector('select[name="id"], select.product-form__variants')
            
            if variant_select:
                options = await variant_select.query_selector_all('option')
                for option in options:
                    option_text = await option.inner_text()
                    option_value = await option.get_attribute('value')
                    
                    # Skip disabled/unavailable options
                    is_disabled = await option.get_attribute('disabled')
                    
                    # Parse option text (usually format: "Size - Price")
                    size_match = re.search(r'([\d.]+\s*x?\s*[\d.]*\s*mm|[\d.]+mm)', option_text, re.IGNORECASE)
                    price_match = re.search(r'\$?([\d.]+)', option_text)
                    
                    if size_match:
                        variants.append({
                            'title': option_text.strip(),
                            'price': price_match.group(1) if price_match else None,
                            'available': is_disabled is None,
                            'id': option_value
                        })
            
            return {
                'title': title.strip(),
                'variants': variants
            }
            
        except Exception as e:
            logger.error(f"Error extracting HTML product data: {str(e)}")
            return None
    
    async def parse_product_data(self, product_data, product_url):
        """Parse product data into our format"""
        try:
            product_name = product_data.get('title', '')
            
            # Filter cabochons
            if self.filter_cabochon(product_name):
                logger.info(f"    Skipping cabochon: {product_name}")
                return None
            
            # Extract basic info
            material = self.extract_material_from_name(product_name)
            shape = self.extract_shape_from_name(product_name)
            
            # Extract color (basic extraction from name)
            color = None
            color_keywords = {
                'emerald': 'Green',
                'ruby': 'Red',
                'sapphire': 'Blue',
                'garnet': 'Red',
                'peridot': 'Green',
                'topaz': 'Blue',
                'amethyst': 'Purple',
                'citrine': 'Yellow',
                'aquamarine': 'Blue',
                'tanzanite': 'Blue',
                'zircon': 'Blue',
                'white': 'White',
                'pink': 'Pink',
                'green': 'Green',
                'blue': 'Blue',
                'red': 'Red',
                'yellow': 'Yellow',
                'purple': 'Purple',
                'orange': 'Orange'
            }
            
            name_lower = product_name.lower()
            for keyword, color_value in color_keywords.items():
                if keyword in name_lower:
                    color = color_value
                    break
            
            # Parse variations
            variations = []
            variants = product_data.get('variants', [])
            
            for variant in variants:
                # Get size from variant title or option
                variant_title = variant.get('title', '')
                size = self.normalize_size(variant_title)
                
                # Get price (convert from cents if needed)
                price = variant.get('price')
                if price:
                    # Shopify often stores price in cents
                    if isinstance(price, (int, float)) and price > 1000:
                        price = price / 100
                    else:
                        price = float(price)
                
                # Check availability
                available = variant.get('available', True)
                
                if size and price:
                    variations.append({
                        'size': size,
                        'price': price,
                        'in_stock': available
                    })
            
            # Only add product if it has variations
            if not variations:
                logger.warning(f"    No variations found for: {product_name}")
                return None
            
            product = {
                'name': product_name,
                'material': material,
                'color': color,
                'shape': shape,
                'variations': variations,
                'url': product_url
            }
            
            logger.info(f"    ✓ Parsed: {product_name} ({len(variations)} variations)")
            return product
            
        except Exception as e:
            logger.error(f"Error parsing product data: {str(e)}")
            return None
    
    async def scrape_all(self):
        """Main scraping function"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            page.set_default_timeout(60000)  # Set 60s default timeout
            
            logger.info("Starting OttoFrei scraper...")
            logger.info(f"Target: {self.collection_url}")
            
            # Collect all product URLs from all pages
            all_product_urls = []
            total_pages = 12  # From our inspection
            
            for page_num in range(1, total_pages + 1):
                urls = await self.get_product_urls_from_page(page, page_num)
                all_product_urls.extend(urls)
            
            logger.info(f"\nTotal product URLs collected: {len(all_product_urls)}")
            logger.info("Starting detailed product scraping...\n")
            
            # Scrape each product page
            for i, product_url in enumerate(all_product_urls, 1):
                logger.info(f"[{i}/{len(all_product_urls)}]")
                
                # Retry logic for timeouts
                max_retries = 2
                product = None
                
                for retry in range(max_retries):
                    try:
                        product = await self.scrape_product_page(page, product_url)
                        break  # Success, exit retry loop
                    except Exception as e:
                        if retry < max_retries - 1:
                            logger.warning(f"  Retry {retry + 1}/{max_retries} for {product_url}")
                            await asyncio.sleep(2)
                        else:
                            logger.error(f"  Failed after {max_retries} retries: {product_url}")
                            self.errors.append(f"Failed after retries: {product_url} - {str(e)}")
                
                if product:
                    self.products.append(product)
                
                # Small delay to be respectful
                await asyncio.sleep(0.3)
            
            await browser.close()
            
            logger.info(f"\n{'='*60}")
            logger.info(f"Scraping complete!")
            logger.info(f"Total products scraped: {len(self.products)}")
            logger.info(f"Total variations: {sum(len(p['variations']) for p in self.products)}")
            logger.info(f"Errors encountered: {len(self.errors)}")
            logger.info(f"{'='*60}\n")
    
    def save_to_json(self, filename):
        """Save scraped data to JSON file"""
        output = {
            'scraped_at': datetime.now().isoformat(),
            'total_products': len(self.products),
            'categories_scraped': 1,
            'source_url': self.collection_url,
            'products': self.products
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Data saved to: {filename}")
        
        if self.errors:
            error_filename = filename.replace('.json', '_errors.log')
            with open(error_filename, 'w', encoding='utf-8') as f:
                f.write('\n'.join(self.errors))
            logger.info(f"Errors logged to: {error_filename}")

async def main():
    scraper = OttoFreiScraper()
    await scraper.scrape_all()
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d')
    filename = f"OttoFreiGemstonesJan11202603.json"
    
    scraper.save_to_json(filename)

if __name__ == '__main__':
    asyncio.run(main())

import re
import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from EnhancedInventory.models import Component  # Assuming your app is named 'inventory'

class Command(BaseCommand):
    help = 'Runs the Sourcing Agents to populate Supabase'

    def handle(self, *args, **options):
        self.stdout.write("Starting Sourcing Agents...")
        
        # 1. Define Sources
        sources = [
            {
                "url": "https://diyjewelry.us/collections/earrings-settings",
                "strategy": self.scrape_diy_jewelry,
                "type": Component.Type.SETTING
            },
            {
                "url": "https://www.gemsngems.com/product-category/cubic-zirconia-gemstones/",
                "strategy": self.scrape_gems_n_gems,
                "type": Component.Type.GEMSTONE
            },
            {
                "url": "https://www.gemsngems.com/product-category/lab-created/",
                "strategy": self.scrape_gems_n_gems,
                "type": Component.Type.GEMSTONE
            }
        ]

        # 2. Execution Loop
        for source in sources:
            self.stdout.write(f"Scraping {source['url']}...")
            try:
                items = source['strategy'](source['url'])
                self.save_batch(items, source['type'])
                self.stdout.write(self.style.SUCCESS(f"Processed {len(items)} items from {source['url']}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to scrape {source['url']}: {e}"))

    # --- Strategy A: DIY Jewelry (Shopify) ---
    def scrape_diy_jewelry(self, url):
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        results = []

        # Target Shopify Product Cards
        for card in soup.select('.product-card, .grid-view-item'):
            title_tag = card.select_one('.grid-view-item__title, .product-card__title')
            if not title_tag: continue
            
            title = title_tag.get_text(strip=True)
            price_tag = card.select_one('.price-item--regular')
            price_str = price_tag.get_text(strip=True) if price_tag else "0"
            
            # Extract clean price
            price = self.parse_price(price_str)
            
            link_tag = card.select_one('a')
            link = f"https://diyjewelry.us{link_tag['href']}" if link_tag else url

            specs = self.extract_specs(title)
            
            results.append({
                "name": title,
                "price": price,
                "url": link,
                "specs": specs
            })
        return results

    # --- Strategy B: GemsNGems (WooCommerce) ---
    def scrape_gems_n_gems(self, url):
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.content, 'html.parser')
        results = []

        for card in soup.select('.product-type-simple, .product'):
            title_tag = card.select_one('.woocommerce-loop-product__title')
            if not title_tag: continue
            
            title = title_tag.get_text(strip=True)
            price_tag = card.select_one('.price .amount')
            price_str = price_tag.get_text(strip=True) if price_tag else "0"
            
            price = self.parse_price(price_str)
            link_tag = card.select_one('a')
            link = link_tag['href'] if link_tag else url

            specs = self.extract_specs(title)

            results.append({
                "name": title,
                "price": price,
                "url": link,
                "specs": specs
            })
        return results

    # --- Utilities ---
    def parse_price(self, price_str):
        # Remove currency symbols and commas
        clean = re.sub(r'[^\d.]', '', price_str)
        try:
            return float(clean)
        except ValueError:
            return 0.0

    def extract_specs(self, title):
        # Logic: Find "8x10mm" or "6mm"
        dim_match = re.search(r'(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)\s*mm', title, re.IGNORECASE)
        single_dim_match = re.search(r'(\d+(?:\.\d+)?)\s*mm', title, re.IGNORECASE)
        
        # Logic: Find Shape
        shape_match = re.search(r'(Round|Oval|Pear|Square|Emerald|Marquise|Cushion)', title, re.IGNORECASE)
        
        dims = {}
        if dim_match:
            dims = {'length': float(dim_match.group(1)), 'width': float(dim_match.group(2))}
        elif single_dim_match:
            val = float(single_dim_match.group(1))
            dims = {'length': val, 'width': val} # Assume symmetrical if one dim
            
        return {
            "shape": shape_match.group(1).upper() if shape_match else "UNKNOWN",
            "dimensions": dims,
            "raw_title": title # Keep raw data for debugging
        }

    def save_batch(self, items, type_enum):
        # Upsert Logic: Update price if exists, Create if new
        for item in items:
            Component.objects.update_or_create(
                supplier_url=item['url'],
                defaults={
                    'name': item['name'],
                    'component_type': type_enum,
                    'cost_per_unit': item['price'],
                    'specs': item['specs']
                }
            )
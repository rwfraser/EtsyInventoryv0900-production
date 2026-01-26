"""
Generate Product Images for Gemstone Earrings E-commerce Site

This script:
1. Reads product data from OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json
2. Scrapes gemstone photos from ottofrei.com
3. Scrapes setting photos from diyjewelry.us
4. Uses Nano Banana Pro API to generate finished earring images
5. Saves images to gemstone-earrings/public/images/products/
"""

import json
import os
import requests
from pathlib import Path
from urllib.parse import urlparse
import time
from bs4 import BeautifulSoup
import base64
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

# Load environment variables from .env.misc
load_dotenv('.env.misc')

# Configuration
DATA_FILE = "OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json"
OUTPUT_DIR = "gemstone-earrings/public/images/products"
CACHE_DIR = "image_cache"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")  # Try Gemini first, fallback to OpenAI

# Create directories
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
Path(CACHE_DIR).mkdir(parents=True, exist_ok=True)
Path(f"{CACHE_DIR}/gemstones").mkdir(parents=True, exist_ok=True)
Path(f"{CACHE_DIR}/settings").mkdir(parents=True, exist_ok=True)

# Rate limiting
DELAY_BETWEEN_REQUESTS = 2  # seconds


def load_product_data():
    """Load product combinations from JSON file."""
    print(f"Loading product data from {DATA_FILE}...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {data['total_combinations']} product combinations")
    return data['combinations']


def scrape_image_from_url(url, cache_subdir, filename):
    """
    Scrape product image from a URL and save to cache.
    Returns path to cached image or None if failed.
    """
    cache_path = f"{CACHE_DIR}/{cache_subdir}/{filename}"
    
    # Check if already cached
    if os.path.exists(cache_path):
        print(f"  Using cached image: {filename}")
        return cache_path
    
    try:
        print(f"  Scraping image from: {url}")
        
        # Get the product page
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find main product image (common selectors)
        img = None
        for selector in [
            'meta[property="og:image"]',
            '.product-image img',
            '.main-image img',
            '#product-image',
            'img.product',
            '.gallery img'
        ]:
            element = soup.select_one(selector)
            if element:
                img_url = element.get('content') or element.get('src') or element.get('data-src')
                if img_url:
                    img = img_url
                    break
        
        if not img:
            print(f"  ⚠️  Could not find image on page")
            return None
        
        # Make image URL absolute if needed
        if img.startswith('//'):
            img = 'https:' + img
        elif img.startswith('/'):
            parsed = urlparse(url)
            img = f"{parsed.scheme}://{parsed.netloc}{img}"
        
        # Download image
        print(f"  Downloading image: {img}")
        img_response = requests.get(img, headers=headers, timeout=10)
        img_response.raise_for_status()
        
        # Save to cache
        with open(cache_path, 'wb') as f:
            f.write(img_response.content)
        
        print(f"  ✓ Cached image: {filename}")
        time.sleep(DELAY_BETWEEN_REQUESTS)  # Rate limiting
        return cache_path
        
    except Exception as e:
        print(f"  ✗ Error scraping image: {e}")
        return None


def image_to_base64(image_path):
    """Convert image file to base64 string for API."""
    with open(image_path, 'rb') as f:
        img_bytes = f.read()
        return base64.b64encode(img_bytes).decode('utf-8')


def get_mime_type(image_path):
    """Determine MIME type from image file extension."""
    ext = os.path.splitext(image_path)[1].lower()
    mime_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
    }
    return mime_types.get(ext, 'image/jpeg')


def generate_earring_image_with_api(gemstone_img_path, setting_img_path, output_path):
    """
    Call Google Gemini API (Nano Banana Pro) to generate finished earring image.
    Uses gemini-3-pro-image-preview model for high-quality jewelry photography.
    """
    if not GEMINI_API_KEY:
        print("  ⚠️  GEMINI_API_KEY not set. Skipping API call.")
        print("     Add to .env.misc: GEMINI_API_KEY='your-api-key'")
        return False
    
    try:
        # Convert images to base64
        gemstone_b64 = image_to_base64(gemstone_img_path)
        setting_b64 = image_to_base64(setting_img_path)
        
        gemstone_mime = get_mime_type(gemstone_img_path)
        setting_mime = get_mime_type(setting_img_path)
        
        # Google Gemini API endpoint for Nano Banana Pro
        api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent"
        
        # Build prompt
        prompt = (
            "Using the gemstone photo and earring setting photo provided, create a photorealistic "
            "product image of a finished pair of earrings with the gemstones mounted in the settings. "
            "Requirements: white background, professional jewelry photography lighting, high resolution, "
            "sharp focus on the earrings, studio quality. The gemstones should be properly seated in "
            "the settings showing a complete, finished jewelry product ready for sale."
        )
        
        # Gemini API payload format
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": gemstone_mime,
                            "data": gemstone_b64
                        }
                    },
                    {
                        "inline_data": {
                            "mime_type": setting_mime,
                            "data": setting_b64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "response_modalities": ["IMAGE"]
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        }
        
        print("  Calling Google Gemini API (Nano Banana Pro)...")
        response = requests.post(api_url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        
        # Extract generated image from Gemini response
        # Gemini returns: candidates[0].content.parts[0].inline_data.data
        if 'candidates' in result and len(result['candidates']) > 0:
            candidate = result['candidates'][0]
            if 'content' in candidate and 'parts' in candidate['content']:
                for part in candidate['content']['parts']:
                    if 'inline_data' in part and 'data' in part['inline_data']:
                        img_data = base64.b64decode(part['inline_data']['data'])
                        with open(output_path, 'wb') as f:
                            f.write(img_data)
                        print(f"  ✓ Generated image saved: {output_path}")
                        return True
        
        print(f"  ✗ Unexpected API response format")
        print(f"      Response: {result}")
        return False
            
    except requests.exceptions.HTTPError as e:
        print(f"  ✗ API HTTP error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"      Response: {e.response.text}")
        return False
    except Exception as e:
        print(f"  ✗ API error: {e}")
        return False


def process_product(product, index, total):
    """Process a single product: scrape images and generate final product photo."""
    pair_id = product['pair_id']
    print(f"\n[{index}/{total}] Processing: {pair_id}")
    
    # Check if output image already exists
    output_path = f"{OUTPUT_DIR}/{pair_id}.jpg"
    if os.path.exists(output_path):
        print("  ✓ Image already exists, skipping")
        return True
    
    # Scrape gemstone image
    gemstone_url = product['gemstone']['product_url']
    gemstone_filename = f"{product['gemstone']['name']}_{product['gemstone']['size']}.jpg".replace(' ', '_').replace('/', '-')
    gemstone_img = scrape_image_from_url(gemstone_url, 'gemstones', gemstone_filename)
    
    if not gemstone_img:
        print("  ✗ Failed to get gemstone image")
        return False
    
    # Scrape setting image
    setting_url = product['setting']['product_url']
    setting_filename = f"{product['setting']['product_number']}_{product['setting']['gemstone_dimensions']}.jpg".replace(' ', '_')
    setting_img = scrape_image_from_url(setting_url, 'settings', setting_filename)
    
    if not setting_img:
        print("  ✗ Failed to get setting image")
        return False
    
    # Generate final product image using API
    success = generate_earring_image_with_api(gemstone_img, setting_img, output_path)
    
    return success


def main():
    """Main execution function."""
    print("=" * 70)
    print("Gemstone Earrings Product Image Generator")
    print("=" * 70)
    
    # Check API key
    if not GEMINI_API_KEY:
        print("\n⚠️  WARNING: GEMINI_API_KEY not found!")
        print("Images will be scraped but NOT generated.")
        print("Add GEMINI_API_KEY to .env.misc file to enable image generation.\n")
    
    # Load product data
    products = load_product_data()
    
    # Process products
    total = len(products)
    successful = 0
    failed = 0
    
    for index, product in enumerate(products, 1):
        try:
            if process_product(product, index, total):
                successful += 1
            else:
                failed += 1
        except KeyboardInterrupt:
            print("\n\nProcess interrupted by user")
            break
        except Exception as e:
            print(f"  ✗ Unexpected error: {e}")
            failed += 1
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total products: {total}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Images saved to: {OUTPUT_DIR}")
    print("=" * 70)


if __name__ == "__main__":
    main()

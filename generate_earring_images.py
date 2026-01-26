"""
AI Earring Image Generation Pipeline
=====================================
This script processes earring combinations from JSON, scrapes setting and gemstone images,
generates composite earring images using Google's Gemini Nano Banana Pro AI,
and prepares data for deployment to the Next.js gemstone-earrings website on Vercel.

Requirements:
- pip install google-genai pillow requests python-dotenv beautifulsoup4
"""

import json
import os
import time
import logging
from datetime import datetime
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image

# ============================================================================
# Configuration
# ============================================================================

# Load environment variables
load_dotenv()

# Setup logging
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)
log_file = log_dir / f"earring_generation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Directories
OUTPUT_DIR = Path("generated_earrings")
OUTPUT_DIR.mkdir(exist_ok=True)

IMAGES_DIR = OUTPUT_DIR / "images"
IMAGES_DIR.mkdir(exist_ok=True)

SETTINGS_CACHE = IMAGES_DIR / "settings"
SETTINGS_CACHE.mkdir(exist_ok=True)

GEMSTONES_CACHE = IMAGES_DIR / "gemstones"
GEMSTONES_CACHE.mkdir(exist_ok=True)

GENERATED_CACHE = IMAGES_DIR / "generated"
GENERATED_CACHE.mkdir(exist_ok=True)

# Constants
INPUT_JSON = "OttoFreiGems_DIYSettings_EarringPairs_2026_01_18_001.json"
OUTPUT_JSON = OUTPUT_DIR / "processed_earrings.json"
RATE_LIMIT_DELAY = 2  # seconds between API calls
API_RETRY_WAIT = 30 * 60  # 30 minutes in seconds
MAX_RETRIES = 3

# ============================================================================
# Helper Functions
# ============================================================================

def download_image(url, save_path, image_type="image"):
    """
    Download an image from a URL and save it locally.
    
    Args:
        url: Product page URL
        save_path: Local path to save the image
        image_type: 'setting' or 'gemstone' for logging
    
    Returns:
        Path to saved image or None on failure
    """
    try:
        logger.info(f"[READ] Fetching {image_type} page: {url}")
        
        # Fetch the product page
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        logger.info(f"[READ] Parsing HTML for {image_type} image")
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the main product image - try multiple selectors
        img_url = None
        
        # Common selectors for product images
        selectors = [
            'meta[property="og:image"]',
            'img.product-image',
            'img.main-image',
            'img[data-zoom-image]',
            '.product-single__photo img',
            '.product-photo img',
            'img[alt*="product"]',
            'img[itemprop="image"]'
        ]
        
        for selector in selectors:
            img_tag = soup.select_one(selector)
            if img_tag:
                img_url = img_tag.get('content') or img_tag.get('src') or img_tag.get('data-src')
                if img_url:
                    break
        
        if not img_url:
            logger.error(f"[ERROR] No image found on {image_type} page")
            return None
        
        # Make URL absolute if needed
        if img_url.startswith('//'):
            img_url = 'https:' + img_url
        elif img_url.startswith('/'):
            from urllib.parse import urlparse, urljoin
            base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
            img_url = urljoin(base_url, img_url)
        
        logger.info(f"[READ] Downloading {image_type} image: {img_url}")
        
        # Download the image
        img_response = requests.get(img_url, headers=headers, timeout=30)
        img_response.raise_for_status()
        
        # Save the image
        logger.info(f"[WRITE] Saving {image_type} image: {save_path}")
        with open(save_path, 'wb') as f:
            f.write(img_response.content)
        
        # Verify it's a valid image
        Image.open(save_path).verify()
        
        logger.info(f"[SUCCESS] {image_type.capitalize()} image saved successfully")
        return save_path
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to download {image_type} image from {url}: {e}")
        return None


def generate_ai_earring_image(setting_path, gemstone_path, output_path, pair_id):
    """
    Generate a composite earring image using Gemini Nano Banana Pro.
    
    Args:
        setting_path: Path to setting image
        gemstone_path: Path to gemstone image
        output_path: Path to save generated image
        pair_id: Unique identifier for the pair
    
    Returns:
        Path to generated image or None on failure
    """
    try:
        logger.info(f"[API] Initializing Gemini client for {pair_id}")
        
        # Get API key from environment
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Initialize Gemini client
        client = genai.Client(api_key=api_key)
        
        # Load images
        logger.info(f"[READ] Loading images for AI generation: {pair_id}")
        setting_img = Image.open(setting_path)
        gemstone_img = Image.open(gemstone_path)
        
        # Prepare prompt
        prompt = "Using the gemstone photo and earring setting photo provided. Create an image of a finished pair of earrings"
        
        logger.info(f"[API] Sending request to Gemini Nano Banana Pro: {pair_id}")
        
        # Generate content with images
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[
                prompt,
                setting_img,
                gemstone_img,
            ],
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE'],
                image_config=types.ImageConfig(
                    aspect_ratio="1:1",
                    image_size="2K"
                ),
            )
        )
        
        logger.info(f"[API] Response received from Gemini: {pair_id}")
        
        # Extract and save generated image
        for part in response.parts:
            if part.text is not None:
                logger.info(f"[API] Response text: {part.text}")
            elif image := part.as_image():
                logger.info(f"[WRITE] Saving generated earring image: {output_path}")
                image.save(output_path)
                logger.info(f"[SUCCESS] AI image generated: {pair_id}")
                return output_path
        
        logger.error(f"[ERROR] No image generated in response: {pair_id}")
        return None
        
    except Exception as e:
        logger.error(f"[ERROR] AI generation failed for {pair_id}: {e}")
        return None


def process_earring_combination(combo, index, total):
    """
    Process a single earring combination through the complete pipeline.
    
    Args:
        combo: Earring combination dictionary
        index: Current index (0-based)
        total: Total combinations to process
    
    Returns:
        Updated combination dict with image paths, or None on failure
    """
    try:
        pair_id = combo['pair_id']
        logger.info(f"\n{'='*70}")
        logger.info(f"[{index + 1}/{total}] Processing: {pair_id}")
        logger.info(f"{'='*70}")
        
        # File paths
        setting_url = combo['setting']['product_url']
        gemstone_url = combo['gemstone']['product_url']
        
        setting_filename = f"{combo['setting']['product_number']}.jpg"
        gemstone_filename = f"{combo['gemstone']['name'].replace(' ', '_')}.jpg"
        generated_filename = f"{pair_id}.jpg"
        
        setting_path = SETTINGS_CACHE / setting_filename
        gemstone_path = GEMSTONES_CACHE / gemstone_filename
        generated_path = GENERATED_CACHE / generated_filename
        
        # Step 1: Download setting image (with caching)
        if not setting_path.exists():
            setting_path = download_image(setting_url, setting_path, "setting")
            if not setting_path:
                return None
        else:
            logger.info(f"[CACHE] Using cached setting image: {setting_path}")
        
        # Step 2: Download gemstone image (with caching)
        if not gemstone_path.exists():
            gemstone_path = download_image(gemstone_url, gemstone_path, "gemstone")
            if not gemstone_path:
                return None
        else:
            logger.info(f"[CACHE] Using cached gemstone image: {gemstone_path}")
        
        # Step 3: Generate AI composite image
        if not generated_path.exists():
            generated_path = generate_ai_earring_image(
                setting_path, 
                gemstone_path, 
                generated_path, 
                pair_id
            )
            if not generated_path:
                return None
            
            # Rate limiting
            logger.info(f"[WAIT] Rate limiting delay: {RATE_LIMIT_DELAY}s")
            time.sleep(RATE_LIMIT_DELAY)
        else:
            logger.info(f"[CACHE] Using cached generated image: {generated_path}")
        
        # Add image paths to combination data
        combo['images'] = {
            'setting_local': str(setting_path),
            'gemstone_local': str(gemstone_path),
            'generated_local': str(generated_path),
            'generated_web': f"/images/generated/{generated_filename}"
        }
        
        logger.info(f"[SUCCESS] Completed processing: {pair_id}")
        return combo
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to process combination: {e}")
        return None


def main():
    """
    Main execution function.
    """
    try:
        logger.info("="*70)
        logger.info("AI EARRING IMAGE GENERATION PIPELINE")
        logger.info("="*70)
        logger.info(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"Log file: {log_file}")
        
        # Load input JSON
        logger.info(f"\n[READ] Loading input JSON: {INPUT_JSON}")
        with open(INPUT_JSON, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        total_combinations = len(data['combinations'])
        logger.info(f"[INFO] Total combinations to process: {total_combinations}")
        
        # Process from 2nd to last combination (skipping the first one)
        logger.info("\n[PROCESSING] Processing from 2nd to last combination")
        combinations_to_process = data['combinations'][1:]
        
        # Process combinations
        processed_combinations = []
        failed_combinations = []
        
        for idx, combo in enumerate(combinations_to_process):
            retry_count = 0
            success = False
            
            while retry_count < MAX_RETRIES and not success:
                try:
                    result = process_earring_combination(combo, idx, len(combinations_to_process))
                    
                    if result:
                        processed_combinations.append(result)
                        success = True
                    else:
                        retry_count += 1
                        if retry_count < MAX_RETRIES:
                            logger.warning(f"[RETRY] Attempt {retry_count + 1}/{MAX_RETRIES}")
                            time.sleep(5)
                        
                except Exception as e:
                    logger.error(f"[ERROR] Exception during processing: {e}")
                    retry_count += 1
                    
                    # Check if it's a quota error
                    if "quota" in str(e).lower() or "rate limit" in str(e).lower():
                        logger.warning(f"[QUOTA] API quota exceeded, waiting {API_RETRY_WAIT}s")
                        time.sleep(API_RETRY_WAIT)
            
            if not success:
                failed_combinations.append(combo['pair_id'])
                logger.error(f"[FAILED] Could not process: {combo['pair_id']}")
        
        # Save processed data
        output_data = {
            'generated_at': datetime.now().isoformat(),
            'total_combinations': len(processed_combinations),
            'failed_count': len(failed_combinations),
            'failed_ids': failed_combinations,
            'combinations': processed_combinations
        }
        
        logger.info(f"\n[WRITE] Saving processed data: {OUTPUT_JSON}")
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        # Summary
        logger.info("\n" + "="*70)
        logger.info("PROCESSING COMPLETE")
        logger.info("="*70)
        logger.info(f"Successfully processed: {len(processed_combinations)}")
        logger.info(f"Failed: {len(failed_combinations)}")
        logger.info(f"Output saved to: {OUTPUT_JSON}")
        logger.info(f"Generated images in: {GENERATED_CACHE}")
        logger.info(f"Log file: {log_file}")
        logger.info(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("="*70)
        
        if failed_combinations:
            logger.warning(f"\nFailed IDs: {', '.join(failed_combinations)}")
        
        logger.info("\nNext steps:")
        logger.info("1. Review generated images in: generated_earrings/images/generated/")
        logger.info("2. Copy images to: gemstone-earrings/public/images/generated/")
        logger.info("3. Merge data into: gemstone-earrings/public/products.json")
        logger.info("4. Commit and push to GitHub for Vercel deployment")
        
    except Exception as e:
        logger.error(f"[FATAL] Fatal error in main: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()

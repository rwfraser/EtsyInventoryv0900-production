"""
Deploy Generated Earrings to Next.js Website
=============================================
This script copies generated images and updates the products.json file
in the gemstone-earrings Next.js project for Vercel deployment.

Usage:
    python deploy_to_website.py
"""

import json
import shutil
import logging
from pathlib import Path
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
GENERATED_DATA = Path("generated_earrings/processed_earrings.json")
GENERATED_IMAGES = Path("generated_earrings/images/generated")
NEXTJS_PUBLIC = Path("gemstone-earrings/public")
NEXTJS_IMAGES = NEXTJS_PUBLIC / "images" / "generated"
NEXTJS_PRODUCTS = NEXTJS_PUBLIC / "products.json"

def main():
    try:
        logger.info("="*70)
        logger.info("DEPLOYING GENERATED EARRINGS TO NEXT.JS WEBSITE")
        logger.info("="*70)
        
        # Check if generated data exists
        if not GENERATED_DATA.exists():
            logger.error(f"Generated data not found: {GENERATED_DATA}")
            logger.error("Run generate_earring_images.py first!")
            return
        
        # Create images directory in Next.js public folder
        NEXTJS_IMAGES.mkdir(parents=True, exist_ok=True)
        logger.info(f"Ensured directory exists: {NEXTJS_IMAGES}")
        
        # Load generated data
        logger.info(f"Loading generated data: {GENERATED_DATA}")
        with open(GENERATED_DATA, 'r', encoding='utf-8') as f:
            generated_data = json.load(f)
        
        # Copy images
        logger.info(f"\nCopying {len(generated_data['combinations'])} generated images...")
        for combo in generated_data['combinations']:
            if 'images' in combo and 'generated_local' in combo['images']:
                src = Path(combo['images']['generated_local'])
                dst = NEXTJS_IMAGES / src.name
                
                if src.exists():
                    shutil.copy2(src, dst)
                    logger.info(f"  Copied: {src.name}")
                else:
                    logger.warning(f"  Missing: {src}")
        
        # Load existing products.json
        logger.info(f"\nLoading existing products: {NEXTJS_PRODUCTS}")
        with open(NEXTJS_PRODUCTS, 'r', encoding='utf-8') as f:
            products_data = json.load(f)
        
        # Prepare new combinations for merge
        new_combinations = []
        for combo in generated_data['combinations']:
            # Update image path for web
            if 'images' in combo:
                combo['images'] = [combo['images']['generated_web']]
            
            # Add vendor field if missing
            if 'vendor' not in combo:
                combo['vendor'] = 'OttoFreiGemsDIYSettings'
            
            new_combinations.append(combo)
        
        # Merge with existing products - update images if product exists
        existing_products = {c['pair_id']: c for c in products_data['combinations']}
        for combo in new_combinations:
            if combo['pair_id'] not in existing_products:
                products_data['combinations'].append(combo)
                logger.info(f"  Added: {combo['pair_id']}")
            else:
                # Update existing product with images field
                if 'images' in combo:
                    existing_products[combo['pair_id']]['images'] = combo['images']
                    logger.info(f"  Updated images: {combo['pair_id']}")
                else:
                    logger.info(f"  Skipped (no images): {combo['pair_id']}")
        
        # Update metadata
        products_data['total_combinations'] = len(products_data['combinations'])
        products_data['generated_at'] = datetime.now().isoformat()
        
        # Save updated products.json
        logger.info(f"\nSaving updated products.json...")
        with open(NEXTJS_PRODUCTS, 'w', encoding='utf-8') as f:
            json.dump(products_data, f, indent=2, ensure_ascii=False)
        
        logger.info("\n" + "="*70)
        logger.info("DEPLOYMENT COMPLETE")
        logger.info("="*70)
        logger.info(f"Total products in website: {products_data['total_combinations']}")
        logger.info(f"Images copied to: {NEXTJS_IMAGES}")
        logger.info(f"Products updated: {NEXTJS_PRODUCTS}")
        logger.info("\nNext steps:")
        logger.info("1. cd gemstone-earrings")
        logger.info("2. git add .")
        logger.info("3. git commit -m 'Add new AI-generated earrings'")
        logger.info("4. git push")
        logger.info("5. Vercel will auto-deploy from GitHub")
        logger.info("="*70)
        
    except Exception as e:
        logger.error(f"Error during deployment: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    main()

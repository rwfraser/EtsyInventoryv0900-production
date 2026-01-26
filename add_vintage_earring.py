"""
Add Vintage Blue Cabochon Earrings to products.json
"""
import json
from datetime import datetime
from pathlib import Path

# Load the enhanced photo data
with open('EnhancedPhotoSample.json', 'r', encoding='utf-8') as f:
    enhanced_data = json.load(f)

# Extract details from the JSON
item = enhanced_data['item_description']

# Create the new product entry
new_product = {
    "pair_id": "VINTAGE_Blue_Cabochon_Statement_Earrings",
    "setting": {
        "product_number": "VINTAGE002",
        "product_title": "Vintage Blue Cabochon Statement Earrings with Multi-Colored Gemstone Halo",
        "price_per_setting": 0,
        "material": item['materials']['metal_type'],
        "gemstone_dimensions": "Oval",
        "gemstone_shape": item['overall_shape'].lower(),
        "variant_id": 0,
        "product_url": "",
        "quantity_needed": 2
    },
    "gemstone": {
        "name": "Blue Cabochon with Multi-Colored Gemstone Halo",
        "material": "Natural Gemstones",
        "color": item['gemstones']['center_stone']['color'],
        "shape": item['gemstones']['center_stone']['shape'],
        "size": "Oval Cabochon",
        "price_per_stone": 0,
        "product_url": "",
        "quantity_needed": 2
    },
    "pricing": {
        "settings_subtotal": 0,
        "gemstones_subtotal": 0,
        "subtotal": 89.99,
        "markup": 0,
        "total_pair_price": 89.99
    },
    "compatibility": {
        "size_match": "Oval statement size",
        "shape_match": "oval cabochon"
    },
    "vendor": "Vintage",
    "category": "Vintage / Statement Earrings",
    "style": item['style'],
    "description": f"Stunning vintage statement earrings featuring {item['gemstones']['center_stone']['color']} oval cabochon center stones surrounded by a halo of multi-colored gemstones including {', '.join(item['gemstones']['accent_stones']['colors'])}. Set in {item['materials']['metal_type']} with {item['materials']['metal_finish']}. Perfect for collectors and those who appreciate vintage jewelry artistry.",
    "images": [
        "/images/generated/VINTAGE_Blue_Cabochon_Statement_Earrings.png"
    ]
}

# Load existing products.json
products_file = Path('gemstone-earrings/public/products.json')
with open(products_file, 'r', encoding='utf-8') as f:
    products_data = json.load(f)

# Add the new product at the beginning for visibility
products_data['combinations'].insert(0, new_product)
products_data['total_combinations'] = len(products_data['combinations'])
products_data['generated_at'] = datetime.now().isoformat()

# Save updated products.json
with open(products_file, 'w', encoding='utf-8') as f:
    json.dump(products_data, f, indent=2, ensure_ascii=False)

print(f"✅ Added new product: {new_product['pair_id']}")
print(f"📊 Total products now: {products_data['total_combinations']}")
print(f"🖼️ Image: {new_product['images'][0]}")
print(f"💰 Price: ${new_product['pricing']['total_pair_price']}")

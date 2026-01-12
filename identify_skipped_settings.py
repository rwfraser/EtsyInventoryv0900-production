"""
Identify settings that are skipped during combination generation.
"""

import json
import re
from collections import defaultdict

def normalize_size(size_str):
    if not size_str or size_str.lower() == 'default title':
        return None
    
    normalized = size_str.lower().strip()
    normalized = re.sub(r'\s+', '', normalized)
    normalized = normalized.replace('x', 'x')
    
    match = re.match(r'^(\d+\.?\d*)mm$', normalized)
    if match:
        num = match.group(1)
        return f"{num}x{num}mm"
    
    match = re.match(r'^(\d+\.?\d*)x(\d+\.?\d*)(mm)?$', normalized)
    if match:
        w, h = match.group(1), match.group(2)
        return f"{w}x{h}mm"
    
    return None

def normalize_shape(shape_str):
    if not shape_str:
        return None
    return shape_str.lower().strip()

def is_in_stock(availability_str):
    if not availability_str:
        return False
    return 'in stock' in availability_str.lower()

def extract_dimensions_from_title(title):
    if not title:
        return None
    
    patterns = [
        r'(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*mm',
        r'(\d+\.?\d*)\s*mm',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            if len(match.groups()) == 2:
                return f"{match.group(1)}x{match.group(2)}mm"
            else:
                return f"{match.group(1)}mm"
    
    return None

# Load settings
print("Loading settings file...")
with open('earring_settings_faceted.json', 'r', encoding='utf-8') as f:
    settings_data = json.load(f)

settings = settings_data if isinstance(settings_data, list) else []
print(f"Total settings: {len(settings)}")

# Filter in-stock
in_stock_settings = [s for s in settings if is_in_stock(s.get('available_quantity', ''))]
print(f"In-stock settings: {len(in_stock_settings)}\n")

# Categorize skipped settings
vague_shapes = ['not specified', 'various', 'various (up to approximately 6-7mm thick)', 
                'various (beads, briolets, top-drilled stones or pendants)']

skipped = {
    'default_title': [],
    'no_dimension': [],
    'no_shape': [],
    'vague_shape': [],
    'dimension_not_normalized': []
}

valid_settings = []

for setting in in_stock_settings:
    product_num = setting.get('product_number', 'UNKNOWN')
    product_title = setting.get('product_title', 'No title')
    setting_dims = setting.get('gemstone_dimensions', '')
    setting_shape = setting.get('gemstone_shape', '')
    
    # Check for Default Title
    if setting_dims == 'Default Title':
        extracted = extract_dimensions_from_title(product_title)
        if extracted:
            skipped['default_title'].append({
                'product_number': product_num,
                'product_title': product_title,
                'current_dimension': setting_dims,
                'extracted_dimension': extracted,
                'shape': setting_shape,
                'can_fix': True
            })
        else:
            skipped['default_title'].append({
                'product_number': product_num,
                'product_title': product_title,
                'current_dimension': setting_dims,
                'extracted_dimension': None,
                'shape': setting_shape,
                'can_fix': False
            })
        continue
    
    # Try to normalize dimension
    norm_setting_size = normalize_size(setting_dims)
    if not norm_setting_size:
        skipped['dimension_not_normalized'].append({
            'product_number': product_num,
            'product_title': product_title,
            'current_dimension': setting_dims,
            'shape': setting_shape
        })
        continue
    
    # Check for missing/empty shape
    norm_shape = normalize_shape(setting_shape)
    if not norm_shape:
        skipped['no_shape'].append({
            'product_number': product_num,
            'product_title': product_title,
            'dimension': setting_dims,
            'shape': setting_shape
        })
        continue
    
    # Check for vague shape
    if norm_shape in vague_shapes:
        skipped['vague_shape'].append({
            'product_number': product_num,
            'product_title': product_title,
            'dimension': setting_dims,
            'shape': setting_shape
        })
        continue
    
    # Valid setting
    valid_settings.append({
        'product_number': product_num,
        'product_title': product_title,
        'dimension': setting_dims,
        'shape': setting_shape
    })

# Print summary
print("="*80)
print("SKIPPED SETTINGS SUMMARY")
print("="*80)
print(f"\nTotal skipped: {sum(len(v) for v in skipped.values())}")
print(f"Valid settings: {len(valid_settings)}\n")

for category, items in skipped.items():
    if items:
        print(f"\n{category.upper().replace('_', ' ')}: {len(items)} settings")
        print("-"*80)

# Detail each category
print("\n\n" + "="*80)
print("DETAILED LISTING")
print("="*80)

# Default Title settings
if skipped['default_title']:
    print(f"\n1. DEFAULT TITLE DIMENSIONS ({len(skipped['default_title'])} settings)")
    print("-"*80)
    
    can_fix = [s for s in skipped['default_title'] if s['can_fix']]
    cannot_fix = [s for s in skipped['default_title'] if not s['can_fix']]
    
    if can_fix:
        print(f"\nCAN BE FIXED ({len(can_fix)}):")
        for i, item in enumerate(can_fix, 1):
            print(f"\n  {i}. {item['product_number']}")
            print(f"     Title: {item['product_title']}")
            print(f"     Current dimension: '{item['current_dimension']}'")
            print(f"     Extracted dimension: {item['extracted_dimension']}")
            print(f"     Shape: {item['shape']}")
            print(f"     → FIX: Set dimension to '{item['extracted_dimension']}'")
    
    if cannot_fix:
        print(f"\n\nCANNOT BE AUTO-FIXED ({len(cannot_fix)}) - Manual review needed:")
        for i, item in enumerate(cannot_fix, 1):
            print(f"\n  {i}. {item['product_number']}")
            print(f"     Title: {item['product_title']}")
            print(f"     Shape: {item['shape']}")
            print(f"     → MANUAL: Check product details or title for size")

# Dimension not normalized
if skipped['dimension_not_normalized']:
    print(f"\n\n2. DIMENSION NOT NORMALIZED ({len(skipped['dimension_not_normalized'])} settings)")
    print("-"*80)
    for i, item in enumerate(skipped['dimension_not_normalized'], 1):
        print(f"\n  {i}. {item['product_number']}")
        print(f"     Title: {item['product_title']}")
        print(f"     Current dimension: '{item['current_dimension']}'")
        print(f"     Shape: {item['shape']}")
        print(f"     → MANUAL: Dimension format not recognized")

# No shape
if skipped['no_shape']:
    print(f"\n\n3. NO SHAPE ({len(skipped['no_shape'])} settings)")
    print("-"*80)
    for i, item in enumerate(skipped['no_shape'], 1):
        print(f"\n  {i}. {item['product_number']}")
        print(f"     Title: {item['product_title']}")
        print(f"     Dimension: {item['dimension']}")
        print(f"     Shape: '{item['shape']}'")
        print(f"     → MANUAL: Add shape based on product details")

# Vague shape
if skipped['vague_shape']:
    print(f"\n\n4. VAGUE SHAPE ({len(skipped['vague_shape'])} settings)")
    print("-"*80)
    for i, item in enumerate(skipped['vague_shape'], 1):
        print(f"\n  {i}. {item['product_number']}")
        print(f"     Title: {item['product_title']}")
        print(f"     Dimension: {item['dimension']}")
        print(f"     Shape: '{item['shape']}'")
        print(f"     → MANUAL: These settings may not be suitable for matching")

# Save to JSON for easier processing
output = {
    'summary': {
        'total_in_stock': len(in_stock_settings),
        'total_skipped': sum(len(v) for v in skipped.values()),
        'total_valid': len(valid_settings),
        'skipped_by_category': {k: len(v) for k, v in skipped.items()}
    },
    'skipped': skipped,
    'valid': valid_settings
}

with open('skipped_settings_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("\n\n" + "="*80)
print(f"Full analysis saved to: skipped_settings_analysis.json")
print("="*80)

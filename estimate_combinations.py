"""
Estimate the number of earring combinations that will be generated.
"""

import json
import re
from collections import defaultdict

# Shape synonym groups (from generate_earring_combinations.py)
SHAPE_SYNONYMS = {
    'square': ['square', 'cushion'],
    'cushion': ['square', 'cushion'],
    'triangular': ['triangular', 'trillion', 'trillium'],
    'trillion': ['triangular', 'trillion', 'trillium'],
    'trillium': ['triangular', 'trillion', 'trillium'],
    'octagon': ['octagon', 'rectangular'],
    'rectangular': ['octagon', 'rectangular'],
    'round': ['round'],
    'oval': ['oval'],
    'pear': ['pear'],
    'marquise': ['marquise'],
}

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

def shapes_are_compatible(shape1, shape2):
    norm_shape1 = normalize_shape(shape1)
    norm_shape2 = normalize_shape(shape2)
    
    if not norm_shape1 or not norm_shape2:
        return False
    
    compatible_shapes = SHAPE_SYNONYMS.get(norm_shape1, [norm_shape1])
    return norm_shape2 in compatible_shapes

def is_in_stock(availability_str):
    if not availability_str:
        return False
    return 'in stock' in availability_str.lower()

# Load files
print("Loading input files...")
with open('earring_settings_faceted.json', 'r', encoding='utf-8') as f:
    settings_data = json.load(f)

with open('OttoFreiGemstonesJan11202603.json', 'r', encoding='utf-8') as f:
    gemstones_data = json.load(f)

settings = settings_data if isinstance(settings_data, list) else []
gemstones = gemstones_data.get('products', [])

print(f"\nTotal settings loaded: {len(settings)}")
print(f"Total gemstone products: {len(gemstones)}")

# Filter in-stock settings
in_stock_settings = [s for s in settings if is_in_stock(s.get('available_quantity', ''))]
print(f"In-stock settings: {len(in_stock_settings)}")

# Analyze settings by shape and size
settings_by_shape_size = defaultdict(list)
skipped_settings = 0
vague_shapes = ['not specified', 'various', 'various (up to approximately 6-7mm thick)', 
                'various (beads, briolets, top-drilled stones or pendants)']

for setting in in_stock_settings:
    setting_dims = setting.get('gemstone_dimensions', '')
    
    if setting_dims == 'Default Title':
        skipped_settings += 1
        continue
    
    norm_setting_size = normalize_size(setting_dims)
    setting_shape = normalize_shape(setting.get('gemstone_shape', ''))
    
    if not norm_setting_size or not setting_shape:
        skipped_settings += 1
        continue
    
    if setting_shape in vague_shapes:
        skipped_settings += 1
        continue
    
    settings_by_shape_size[(setting_shape, norm_setting_size)].append(setting)

print(f"Valid settings for matching: {sum(len(v) for v in settings_by_shape_size.values())}")
print(f"Skipped settings: {skipped_settings}")
print(f"Unique (shape, size) combinations in settings: {len(settings_by_shape_size)}")

# Analyze gemstones
gem_variations_by_shape_size = defaultdict(list)
total_gem_variations = 0
in_stock_gem_variations = 0

for gemstone in gemstones:
    gem_shape = normalize_shape(gemstone.get('shape', ''))
    
    if not gem_shape:
        continue
    
    for variation in gemstone.get('variations', []):
        total_gem_variations += 1
        
        if not variation.get('in_stock', False):
            continue
        
        in_stock_gem_variations += 1
        gem_size = variation.get('size', '')
        norm_gem_size = normalize_size(gem_size)
        
        if not norm_gem_size:
            continue
        
        gem_variations_by_shape_size[(gem_shape, norm_gem_size)].append({
            'gemstone': gemstone,
            'variation': variation
        })

print(f"\nTotal gemstone variations: {total_gem_variations}")
print(f"In-stock gemstone variations: {in_stock_gem_variations}")
print(f"Valid in-stock variations for matching: {sum(len(v) for v in gem_variations_by_shape_size.values())}")
print(f"Unique (shape, size) combinations in gemstones: {len(gem_variations_by_shape_size)}")

# Estimate combinations
print("\n" + "="*70)
print("ESTIMATING COMBINATIONS")
print("="*70)

estimated_combinations = 0
matches_by_shape = defaultdict(int)

for (setting_shape, setting_size), settings_list in settings_by_shape_size.items():
    for (gem_shape, gem_size), gem_list in gem_variations_by_shape_size.items():
        # Check compatibility
        if not shapes_are_compatible(setting_shape, gem_shape):
            continue
        
        # Check size match
        if setting_size != gem_size:
            continue
        
        # Count combinations
        num_matches = len(settings_list) * len(gem_list)
        estimated_combinations += num_matches
        matches_by_shape[f"{setting_shape} ↔ {gem_shape}"] += num_matches

print(f"\nEstimated total combinations: {estimated_combinations}")

print("\nBreakdown by shape compatibility:")
for shape_pair, count in sorted(matches_by_shape.items(), key=lambda x: x[1], reverse=True):
    print(f"  {shape_pair}: {count} combinations")

# Show some detailed matching info
print("\n" + "="*70)
print("DETAILED MATCHING ANALYSIS")
print("="*70)

print("\nSettings by shape:")
shape_counts = defaultdict(int)
for (shape, size), settings_list in settings_by_shape_size.items():
    shape_counts[shape] += len(settings_list)
for shape, count in sorted(shape_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {shape}: {count} settings")

print("\nGemstones by shape:")
gem_shape_counts = defaultdict(int)
for (shape, size), gem_list in gem_variations_by_shape_size.items():
    gem_shape_counts[shape] += len(gem_list)
for shape, count in sorted(gem_shape_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {shape}: {count} variations")

print("\nCommon sizes in settings:")
size_counts_settings = defaultdict(int)
for (shape, size), settings_list in settings_by_shape_size.items():
    size_counts_settings[size] += len(settings_list)
for size, count in sorted(size_counts_settings.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"  {size}: {count} settings")

print("\nCommon sizes in gemstones:")
size_counts_gems = defaultdict(int)
for (shape, size), gem_list in gem_variations_by_shape_size.items():
    size_counts_gems[size] += len(gem_list)
for size, count in sorted(size_counts_gems.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"  {size}: {count} variations")

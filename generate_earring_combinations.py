"""
Generate complete earring pair combinations from settings and gemstones.
Combines compatible earring settings with faceted gemstones based on size and shape matching.
"""

import json
import re
from typing import Dict, List, Tuple, Optional


# Shape synonym groups for compatibility matching
SHAPE_SYNONYMS = {
    'square': ['square', 'cushion'],
    'cushion': ['square', 'cushion'],
    'triangular': ['triangular', 'trillion', 'trillium'],
    'trillion': ['triangular', 'trillion', 'trillium'],
    'trillium': ['triangular', 'trillion', 'trillium'],
    'octagon': ['octagon', 'rectangular'],
    'rectangular': ['octagon', 'rectangular'],
    'round': ['round'],  # Round only matches round
    'oval': ['oval'],
    'pear': ['pear'],
    'marquise': ['marquise'],
}


def normalize_size(size_str: str) -> str:
    """
    Normalize size strings to a standard format: 'WxHmm' (lowercase, no spaces).
    Examples:
        '4mm' -> '4x4mm'
        '5x7mm' -> '5x7mm'
        '4 X 4 mm' -> '4x4mm'
        '5 X 7 mm' -> '5x7mm'
    """
    if not size_str or size_str.lower() == 'default title':
        return None
    
    # Remove all spaces and convert to lowercase
    normalized = size_str.lower().strip()
    normalized = re.sub(r'\s+', '', normalized)
    
    # Replace capital X with lowercase x
    normalized = normalized.replace('x', 'x')
    
    # If it's just a single number followed by mm (e.g., '4mm'), convert to '4x4mm'
    match = re.match(r'^(\d+\.?\d*)mm$', normalized)
    if match:
        num = match.group(1)
        return f"{num}x{num}mm"
    
    # If it's already in format like '5x7mm', just ensure it has 'mm' at the end
    match = re.match(r'^(\d+\.?\d*)x(\d+\.?\d*)(mm)?$', normalized)
    if match:
        w, h = match.group(1), match.group(2)
        return f"{w}x{h}mm"
    
    return None


def normalize_shape(shape_str: str) -> str:
    """Normalize shape string to lowercase and handle variations."""
    if not shape_str:
        return None
    return shape_str.lower().strip()


def shapes_are_compatible(shape1: str, shape2: str) -> bool:
    """Check if two shapes are compatible based on synonym groups."""
    norm_shape1 = normalize_shape(shape1)
    norm_shape2 = normalize_shape(shape2)
    
    if not norm_shape1 or not norm_shape2:
        return False
    
    # Get compatible shapes for shape1
    compatible_shapes = SHAPE_SYNONYMS.get(norm_shape1, [norm_shape1])
    
    # Check if shape2 is in the compatible list
    return norm_shape2 in compatible_shapes


def extract_dimensions_from_title(title: str) -> Optional[str]:
    """
    Extract gemstone dimensions from product title.
    Look for patterns like '4mm', '5x7mm', '3x5mm', etc.
    """
    if not title:
        return None
    
    # Look for patterns like '4mm', '5.5mm', '4x6mm', '5 x 7mm', etc.
    patterns = [
        r'(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*mm',  # '5x7mm' or '5 x 7 mm'
        r'(\d+\.?\d*)\s*mm',  # '4mm'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            if len(match.groups()) == 2:
                # Two dimensions found
                return f"{match.group(1)}x{match.group(2)}mm"
            else:
                # Single dimension - assume square
                return f"{match.group(1)}mm"
    
    return None


def parse_price(price_str) -> float:
    """Parse price string to float, handling $ symbols."""
    if isinstance(price_str, (int, float)):
        return float(price_str)
    if isinstance(price_str, str):
        # Remove $ and convert to float
        cleaned = price_str.replace('$', '').replace(',', '').strip()
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
    return 0.0


def calculate_pair_price(setting_price: float, gemstone_price: float) -> float:
    """
    Calculate total price for a complete earring pair.
    Formula: (2 × setting_price) + (2 × gemstone_price) + max($20, 20% of subtotal)
    """
    subtotal = (2 * setting_price) + (2 * gemstone_price)
    markup = max(20.0, subtotal * 0.20)
    total = subtotal + markup
    return round(total, 2)


def is_in_stock(availability_str: str) -> bool:
    """Check if item is in stock based on availability string."""
    if not availability_str:
        return False
    return 'in stock' in availability_str.lower()


def load_json_file(filepath: str) -> dict:
    """Load and parse JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_combinations(settings_file: str, gemstones_file: str, output_file: str):
    """
    Main function to generate earring combinations.
    """
    print("Loading data files...")
    settings_data = load_json_file(settings_file)
    gemstones_data = load_json_file(gemstones_file)
    
    settings = settings_data if isinstance(settings_data, list) else []
    gemstones = gemstones_data.get('products', []) if isinstance(gemstones_data, dict) else []
    
    print(f"Loaded {len(settings)} earring settings")
    print(f"Loaded {len(gemstones)} gemstone types")
    
    # Filter out-of-stock settings
    in_stock_settings = [s for s in settings if is_in_stock(s.get('available_quantity', ''))]
    print(f"In-stock settings: {len(in_stock_settings)}")
    
    combinations = []
    skipped_count = 0
    
    print("\nGenerating combinations...")
    
    for setting in in_stock_settings:
        # Get setting dimensions
        setting_dims = setting.get('gemstone_dimensions', '')
        
        # If dimensions are "Default Title", try to extract from title
        if setting_dims == 'Default Title':
            setting_dims = extract_dimensions_from_title(setting.get('product_title', ''))
            if not setting_dims:
                skipped_count += 1
                continue
        
        # Normalize setting dimensions and shape
        norm_setting_size = normalize_size(setting_dims)
        setting_shape = normalize_shape(setting.get('gemstone_shape', ''))
        
        if not norm_setting_size or not setting_shape:
            skipped_count += 1
            continue
        
        # Skip settings with vague shapes
        if setting_shape in ['not specified', 'various', 'various (up to approximately 6-7mm thick)', 
                             'various (beads, briolets, top-drilled stones or pendants)']:
            skipped_count += 1
            continue
        
        setting_price = parse_price(setting.get('price', 0))
        
        # Search through all gemstones
        for gemstone in gemstones:
            gem_shape = normalize_shape(gemstone.get('shape', ''))
            
            # Check shape compatibility
            if not shapes_are_compatible(setting_shape, gem_shape):
                continue
            
            # Check each variation of the gemstone
            for variation in gemstone.get('variations', []):
                # Skip out-of-stock variations
                if not variation.get('in_stock', False):
                    continue
                
                # Normalize gemstone size
                gem_size = variation.get('size', '')
                norm_gem_size = normalize_size(gem_size)
                
                if not norm_gem_size:
                    continue
                
                # Check if sizes match
                if norm_setting_size != norm_gem_size:
                    continue
                
                # We have a match! Create combination
                gem_price = variation.get('price', 0)
                total_price = calculate_pair_price(setting_price, gem_price)
                
                combination = {
                    'pair_id': f"{setting.get('product_number', 'UNK')}_{gemstone.get('name', 'unknown').replace(' ', '_').replace(',', '')}_{gem_size.replace(' ', '')}",
                    'setting': {
                        'product_number': setting.get('product_number'),
                        'product_title': setting.get('product_title'),
                        'price_per_setting': setting_price,
                        'material': setting.get('material'),
                        'gemstone_dimensions': setting_dims,
                        'gemstone_shape': setting.get('gemstone_shape'),
                        'variant_id': setting.get('variant_id'),
                        'product_url': setting.get('product_url'),
                        'quantity_needed': 2
                    },
                    'gemstone': {
                        'name': gemstone.get('name'),
                        'material': gemstone.get('material'),
                        'color': gemstone.get('color'),
                        'shape': gemstone.get('shape'),
                        'size': gem_size,
                        'price_per_stone': gem_price,
                        'product_url': gemstone.get('url'),
                        'quantity_needed': 2
                    },
                    'pricing': {
                        'settings_subtotal': 2 * setting_price,
                        'gemstones_subtotal': 2 * gem_price,
                        'subtotal': (2 * setting_price) + (2 * gem_price),
                        'markup': round(max(20.0, ((2 * setting_price) + (2 * gem_price)) * 0.20), 2),
                        'total_pair_price': total_price
                    },
                    'compatibility': {
                        'size_match': norm_setting_size,
                        'shape_match': f"{setting_shape} ↔ {gem_shape}"
                    }
                }
                
                combinations.append(combination)
    
    print(f"\nGenerated {len(combinations)} earring pair combinations")
    print(f"Skipped {skipped_count} settings (no valid dimensions/shape)")
    
    # Write output file
    output_data = {
        'generated_at': gemstones_data.get('scraped_at', 'unknown'),
        'total_combinations': len(combinations),
        'combinations': combinations
    }
    
    print(f"\nWriting results to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Complete! {len(combinations)} combinations saved to {output_file}")
    
    # Print some statistics
    if combinations:
        prices = [c['pricing']['total_pair_price'] for c in combinations]
        print(f"\nPrice range: ${min(prices):.2f} - ${max(prices):.2f}")
        print(f"Average pair price: ${sum(prices)/len(prices):.2f}")


if __name__ == "__main__":
    # File paths
    settings_file = "earring_settings_faceted.json"
    gemstones_file = "complete_gemstone_data_20260110_095929.json"
    output_file = "all_earring_pair_combinations001.json"
    
    try:
        generate_combinations(settings_file, gemstones_file, output_file)
    except FileNotFoundError as e:
        print(f"Error: Could not find file - {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format - {e}")
    except Exception as e:
        print(f"Error: {e}")

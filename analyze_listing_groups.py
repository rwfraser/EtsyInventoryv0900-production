"""
Analyze earring combinations to group them for Etsy listings with variations.
Each Etsy listing can have 2 variation types (e.g., Size and Color/Gemstone).
This script groups combinations by setting shape to create optimal listings.
"""

import json
from collections import defaultdict
from typing import Dict, List


def extract_gemstone_base_name(full_name: str) -> str:
    """
    Extract base gemstone name without shape descriptor.
    Example: 'Round Faceted Pink Amethyst' -> 'Pink Amethyst'
    """
    # Remove common shape words from the beginning
    shapes = ['round', 'oval', 'pear', 'marquise', 'cushion', 'square', 
              'triangular', 'trillion', 'octagon', 'rectangular']
    
    name = full_name.lower()
    for shape in shapes:
        if name.startswith(shape + ' '):
            name = name[len(shape) + 1:]
            break
    
    # Remove 'faceted' if present
    name = name.replace('faceted ', '').strip()
    
    # Capitalize properly
    return ' '.join(word.capitalize() for word in name.split())


def analyze_combinations(combinations_file: str):
    """
    Analyze combinations and group them for Etsy listings.
    Group by: Setting Product Number + Shape
    Variations: Size (variation 1) and Gemstone/Color (variation 2)
    """
    print(f"Loading {combinations_file}...")
    with open(combinations_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    combinations = data.get('combinations', [])
    print(f"Total combinations: {len(combinations)}")
    
    # Group by setting + shape
    # Key: (setting_product_number, normalized_shape)
    groups = defaultdict(lambda: {
        'setting_info': None,
        'shape': None,
        'material': None,
        'variations': []  # Each variation is a (size, gemstone, color, price, combination) tuple
    })
    
    for combo in combinations:
        setting = combo['setting']
        gemstone = combo['gemstone']
        
        # Create grouping key
        setting_num = setting['product_number']
        shape = setting['gemstone_shape'].lower()
        group_key = (setting_num, shape)
        
        # Initialize group if first item
        if groups[group_key]['setting_info'] is None:
            groups[group_key]['setting_info'] = {
                'product_number': setting_num,
                'title': setting['product_title'],
                'url': setting['product_url']
            }
            groups[group_key]['shape'] = shape
            groups[group_key]['material'] = setting['material']
        
        # Add variation
        size = gemstone['size']
        gem_name = extract_gemstone_base_name(gemstone['name'])
        color = gemstone.get('color', 'N/A')
        price = combo['pricing']['total_pair_price']
        
        groups[group_key]['variations'].append({
            'size': size,
            'gemstone': gem_name,
            'color': color,
            'price': price,
            'pair_id': combo['pair_id'],
            'full_combo': combo
        })
    
    print(f"\nTotal listing groups: {len(groups)}")
    print("=" * 80)
    
    # Analyze each group
    group_stats = []
    for group_key, group_data in groups.items():
        setting_num, shape = group_key
        variations = group_data['variations']
        
        # Get unique sizes and gemstones
        unique_sizes = set(v['size'] for v in variations)
        unique_gemstones = set(v['gemstone'] for v in variations)
        
        group_stats.append({
            'setting': setting_num,
            'shape': shape,
            'material': group_data['material'],
            'num_variations': len(variations),
            'unique_sizes': len(unique_sizes),
            'unique_gemstones': len(unique_gemstones),
            'size_list': sorted(unique_sizes),
            'gemstone_list': sorted(unique_gemstones),
            'price_range': (
                min(v['price'] for v in variations),
                max(v['price'] for v in variations)
            )
        })
    
    # Sort by number of variations (descending)
    group_stats.sort(key=lambda x: x['num_variations'], reverse=True)
    
    # Print summary
    print("\nLISTING GROUP SUMMARY")
    print("=" * 80)
    for i, stat in enumerate(group_stats, 1):
        print(f"\n{i}. Setting {stat['setting']} - {stat['shape'].upper()} - {stat['material']}")
        print(f"   Variations: {stat['num_variations']} combinations")
        print(f"   Sizes: {stat['unique_sizes']} ({', '.join(stat['size_list'])})")
        print(f"   Gemstones: {stat['unique_gemstones']} types")
        print(f"   Price range: ${stat['price_range'][0]:.2f} - ${stat['price_range'][1]:.2f}")
        
        # Show gemstone list if not too long
        if stat['unique_gemstones'] <= 10:
            print(f"   Gemstones: {', '.join(stat['gemstone_list'])}")
    
    # Detailed breakdown
    print("\n" + "=" * 80)
    print("ETSY VARIATION STRUCTURE")
    print("=" * 80)
    print("\nEtsy allows 2 variation types per listing:")
    print("  - Variation 1: SIZE (e.g., 4mm, 5mm, 6mm)")
    print("  - Variation 2: GEMSTONE/COLOR (e.g., Amethyst, Topaz, Emerald)")
    print("\nEach listing will have Size × Gemstone combinations as purchasable options.")
    
    # Check for potential issues
    print("\n" + "=" * 80)
    print("ETSY LIMITATIONS CHECK")
    print("=" * 80)
    
    issues = []
    for stat in group_stats:
        total_variations = stat['unique_sizes'] * stat['unique_gemstones']
        if total_variations > 100:  # Etsy typically limits to 100 variations per listing
            issues.append({
                'setting': stat['setting'],
                'shape': stat['shape'],
                'total_variations': total_variations,
                'recommendation': 'Split into multiple listings by size or gemstone group'
            })
    
    if issues:
        print("\n⚠ WARNING: Some groups exceed Etsy's variation limits (typically 100):")
        for issue in issues:
            print(f"\n  Setting {issue['setting']} ({issue['shape']}): {issue['total_variations']} variations")
            print(f"  → {issue['recommendation']}")
    else:
        print("\n✓ All groups are within Etsy's variation limits!")
    
    # Save detailed output
    output_file = "etsy_listing_groups.json"
    output_data = {
        'total_combinations': len(combinations),
        'total_listings': len(groups),
        'groups': []
    }
    
    for group_key, group_data in groups.items():
        setting_num, shape = group_key
        output_data['groups'].append({
            'setting': setting_num,
            'shape': shape,
            'material': group_data['material'],
            'setting_info': group_data['setting_info'],
            'num_variations': len(group_data['variations']),
            'variations': group_data['variations']
        })
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Detailed grouping saved to: {output_file}")
    print(f"\nSUMMARY: {len(combinations)} combinations → {len(groups)} Etsy listings")


if __name__ == "__main__":
    combinations_file = "OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json"
    
    try:
        analyze_combinations(combinations_file)
    except FileNotFoundError:
        print(f"Error: Could not find {combinations_file}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

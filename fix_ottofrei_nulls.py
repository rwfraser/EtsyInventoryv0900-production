"""
Fix null material and shape fields in OttoFrei gemstone data.
Extracts values from product names and applies corrections.
"""

import json

def fix_null_fields(data):
    """Fix null material and shape fields based on product names."""
    corrections_made = {
        'material': 0,
        'shape': 0
    }
    
    for product in data['products']:
        name = product['name']
        name_lower = name.lower()
        
        # Fix material if null
        if product.get('material') is None:
            if 'lab-created' in name_lower or 'lab created' in name_lower:
                product['material'] = 'Lab Created'
                corrections_made['material'] += 1
            elif 'imitation' in name_lower or 'synthetic' in name_lower:
                product['material'] = 'Synthetic'
                corrections_made['material'] += 1
        
        # Fix shape if null
        if product.get('shape') is None:
            if 'round' in name_lower and 'faceted' in name_lower:
                product['shape'] = 'Round'
                corrections_made['shape'] += 1
            elif 'square' in name_lower and 'faceted' in name_lower:
                product['shape'] = 'Square'
                corrections_made['shape'] += 1
            elif 'cushion' in name_lower and 'faceted' in name_lower:
                product['shape'] = 'Cushion'
                corrections_made['shape'] += 1
            elif 'emerald cut' in name_lower:
                product['shape'] = 'Emerald'
                corrections_made['shape'] += 1
        
        # Special case: Fix "Cushion Faceted Imitation Emerald" 
        # Currently has shape="Emerald" but should be "Cushion"
        if 'cushion faceted' in name_lower and product.get('shape') == 'Emerald':
            product['shape'] = 'Cushion'
            print(f"Special fix: {name} - Changed shape from 'Emerald' to 'Cushion'")
    
    return corrections_made

def main():
    print("="*80)
    print("Fixing OttoFrei JSON - Null Field Corrections")
    print("="*80)
    print()
    
    # Load the data
    input_file = 'OttoFreiGemstonesJan11202601.json'
    print(f"Loading: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    original_products = len(data['products'])
    print(f"Total products: {original_products}")
    
    # Count nulls before
    null_materials_before = sum(1 for p in data['products'] if p.get('material') is None)
    null_shapes_before = sum(1 for p in data['products'] if p.get('shape') is None)
    
    print(f"\nBefore corrections:")
    print(f"  Null materials: {null_materials_before}")
    print(f"  Null shapes: {null_shapes_before}")
    
    # Apply fixes
    print("\nApplying corrections...")
    corrections = fix_null_fields(data)
    
    # Count nulls after
    null_materials_after = sum(1 for p in data['products'] if p.get('material') is None)
    null_shapes_after = sum(1 for p in data['products'] if p.get('shape') is None)
    
    print(f"\nAfter corrections:")
    print(f"  Null materials: {null_materials_after}")
    print(f"  Null shapes: {null_shapes_after}")
    
    print(f"\nCorrections applied:")
    print(f"  Materials fixed: {corrections['material']}")
    print(f"  Shapes fixed: {corrections['shape']}")
    
    # Save corrected data
    output_file = input_file  # Overwrite original
    print(f"\nSaving corrected data to: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*80)
    print("✓ Corrections complete!")
    print("="*80)
    
    # Show sample of corrected products
    print("\nSample of corrected products:")
    count = 0
    for product in data['products']:
        if count >= 5:
            break
        if product['name'].lower().startswith('square'):
            print(f"  • {product['name']}")
            print(f"    material: {product.get('material')}, shape: {product.get('shape')}")
            count += 1

if __name__ == "__main__":
    main()

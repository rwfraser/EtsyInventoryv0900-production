"""
Fix 100x pricing error in OttoFrei gemstone data.

The scraper captured some prices as whole dollars instead of cents.
This script identifies and corrects those prices by dividing by 100.

Strategy:
- If price > $100 and is a whole number (no cents), divide by 100
- Prices like $850.0 become $8.50
- Prices like $10.4 remain unchanged (already correct)
"""

import json
import shutil
from datetime import datetime


def needs_price_fix(price: float) -> bool:
    """
    Determine if a price needs to be fixed (divided by 100).
    
    Heuristic: Price is suspicious if:
    - Greater than $100 AND
    - Is a whole dollar amount (no cents)
    
    Examples:
    - $850.0 -> True (needs fix)
    - $10.4 -> False (already correct)
    - $10.32 -> False (already correct)
    - $15.5 -> False (already correct)
    """
    # Whole number check: price == int(price)
    return price > 100 and price == int(price)


def fix_pricing(input_file: str, output_file: str, backup: bool = True):
    """
    Fix pricing in gemstone data file.
    
    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file
        backup: Whether to create backup of original file
    """
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Backup original if requested
    if backup:
        backup_file = input_file.replace('.json', f'_BACKUP_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        print(f"Creating backup: {backup_file}")
        shutil.copy2(input_file, backup_file)
    
    products = data.get('products', [])
    total_products = len(products)
    products_fixed = 0
    variations_fixed = 0
    
    print(f"\nProcessing {total_products} products...")
    print("=" * 80)
    
    for product in products:
        product_name = product.get('name', 'Unknown')
        variations = product.get('variations', [])
        product_had_fixes = False
        
        for variation in variations:
            original_price = variation.get('price', 0)
            
            if needs_price_fix(original_price):
                corrected_price = original_price / 100
                variation['price'] = corrected_price
                variations_fixed += 1
                product_had_fixes = True
                
                print(f"✓ {product_name}")
                print(f"  Size: {variation.get('size', 'N/A')}")
                print(f"  Fixed: ${original_price:.2f} -> ${corrected_price:.2f}")
        
        if product_had_fixes:
            products_fixed += 1
    
    print("=" * 80)
    print(f"\nFIX SUMMARY:")
    print(f"  Products processed: {total_products}")
    print(f"  Products fixed: {products_fixed}")
    print(f"  Variations fixed: {variations_fixed}")
    
    # Write corrected data
    print(f"\nWriting corrected data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Complete! Corrected data saved to: {output_file}")
    
    return {
        'products_processed': total_products,
        'products_fixed': products_fixed,
        'variations_fixed': variations_fixed
    }


def regenerate_combinations():
    """
    Regenerate earring combinations with corrected pricing.
    """
    print("\n" + "=" * 80)
    print("REGENERATING EARRING COMBINATIONS")
    print("=" * 80)
    print("\nRunning generate_earring_combinations.py with corrected data...")
    
    import subprocess
    result = subprocess.run(['python', 'generate_earring_combinations.py'], 
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✓ Combinations regenerated successfully!")
        print(result.stdout)
    else:
        print("✗ Error regenerating combinations:")
        print(result.stderr)
    
    return result.returncode == 0


if __name__ == "__main__":
    # Input and output files
    input_file = "OttoFreiGemstonesJan11202603.json"
    output_file = "OttoFreiGemstonesJan11202603_CORRECTED.json"
    
    print("GEMSTONE PRICING CORRECTION TOOL")
    print("=" * 80)
    print("This script will fix 100x pricing errors in the OttoFrei data.")
    print(f"Input:  {input_file}")
    print(f"Output: {output_file}")
    print("=" * 80)
    
    try:
        # Fix pricing
        stats = fix_pricing(input_file, output_file, backup=True)
        
        # Ask if user wants to regenerate combinations
        print("\n" + "=" * 80)
        response = input("Regenerate earring combinations with corrected pricing? (yes/no): ")
        
        if response.lower() in ['yes', 'y']:
            # Update generate_earring_combinations.py to use corrected file
            print("\nNote: Update generate_earring_combinations.py line 291 to use:")
            print(f'    gemstones_file = "{output_file}"')
            print("\nThen run: python generate_earring_combinations.py")
        
        print("\n✓ Pricing correction complete!")
        print(f"  - {stats['products_fixed']} products fixed")
        print(f"  - {stats['variations_fixed']} price variations corrected")
        
    except FileNotFoundError:
        print(f"Error: Could not find {input_file}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

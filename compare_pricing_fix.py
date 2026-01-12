"""
Compare pricing before and after correction to verify improvements.
"""

import json

def compare_pricing():
    # Load both files
    with open('OttoFreiGems_DIYSettings_EarringPairs2026011102.json', 'r') as f:
        old_data = json.load(f)
    
    with open('OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json', 'r') as f:
        new_data = json.load(f)
    
    old_combos = old_data['combinations']
    new_combos = new_data['combinations']
    
    print("\nPRICING CORRECTION COMPARISON")
    print("=" * 80)
    print(f"Total combinations: {len(old_combos)}")
    
    # Calculate statistics
    old_prices = [c['pricing']['total_pair_price'] for c in old_combos]
    new_prices = [c['pricing']['total_pair_price'] for c in new_combos]
    
    print("\nBEFORE CORRECTION:")
    print(f"  Price range: ${min(old_prices):.2f} - ${max(old_prices):.2f}")
    print(f"  Average: ${sum(old_prices)/len(old_prices):.2f}")
    
    print("\nAFTER CORRECTION:")
    print(f"  Price range: ${min(new_prices):.2f} - ${max(new_prices):.2f}")
    print(f"  Average: ${sum(new_prices)/len(new_prices):.2f}")
    
    # Show examples of fixed items
    print("\n" + "=" * 80)
    print("EXAMPLES OF CORRECTED PRICING (first 5 that changed):")
    print("=" * 80)
    
    count = 0
    for old, new in zip(old_combos, new_combos):
        if old['pricing']['total_pair_price'] != new['pricing']['total_pair_price']:
            count += 1
            print(f"\n{count}. {old['gemstone']['name']}")
            print(f"   BEFORE: Gem ${old['gemstone']['price_per_stone']:.2f} → Total ${old['pricing']['total_pair_price']:.2f}")
            print(f"   AFTER:  Gem ${new['gemstone']['price_per_stone']:.2f} → Total ${new['pricing']['total_pair_price']:.2f}")
            print(f"   SAVINGS: ${old['pricing']['total_pair_price'] - new['pricing']['total_pair_price']:.2f} per pair")
            
            if count >= 5:
                break
    
    # Count how many changed
    changes = sum(1 for old, new in zip(old_combos, new_combos) 
                  if old['pricing']['total_pair_price'] != new['pricing']['total_pair_price'])
    
    print("\n" + "=" * 80)
    print(f"Total combinations with corrected pricing: {changes} out of {len(old_combos)}")
    print(f"Percentage corrected: {(changes/len(old_combos))*100:.1f}%")
    
    # Calculate total savings
    total_old = sum(old_prices)
    total_new = sum(new_prices)
    print(f"\nTotal pricing adjustment across all items:")
    print(f"  Before: ${total_old:.2f}")
    print(f"  After: ${total_new:.2f}")
    print(f"  Difference: ${total_old - total_new:.2f}")

if __name__ == "__main__":
    compare_pricing()

"""
Analyze gemstone pricing to identify the 100x price error.
"""

import json

def analyze_pricing(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    combinations = data.get('combinations', [])
    
    print("Sample gemstone prices (first 20):")
    print("=" * 80)
    
    for i, combo in enumerate(combinations[:20], 1):
        gem_name = combo['gemstone']['name']
        gem_price = combo['gemstone']['price_per_stone']
        setting_price = combo['setting']['price_per_setting']
        total = combo['pricing']['total_pair_price']
        
        print(f"{i}. {gem_name}")
        print(f"   Gemstone: ${gem_price:.2f} | Setting: ${setting_price:.2f} | Total: ${total:.2f}")
        
        # Check if price looks suspicious (whole dollars)
        if gem_price > 100 and gem_price == int(gem_price):
            print(f"   ⚠ SUSPICIOUS: Price is whole number > $100 (likely 100x error)")
    
    print("\n" + "=" * 80)
    print("PRICING STATISTICS")
    print("=" * 80)
    
    # Count suspicious prices
    suspicious_count = 0
    total_count = len(combinations)
    
    gem_prices = []
    for combo in combinations:
        price = combo['gemstone']['price_per_stone']
        gem_prices.append(price)
        if price > 100 and price == int(price):
            suspicious_count += 1
    
    print(f"Total combinations: {total_count}")
    print(f"Suspicious prices (whole $ > $100): {suspicious_count}")
    print(f"Percentage affected: {(suspicious_count/total_count)*100:.1f}%")
    
    print(f"\nGemstone price range:")
    print(f"  Min: ${min(gem_prices):.2f}")
    print(f"  Max: ${max(gem_prices):.2f}")
    print(f"  Avg: ${sum(gem_prices)/len(gem_prices):.2f}")


if __name__ == "__main__":
    analyze_pricing("OttoFreiGems_DIYSettings_EarringPairs2026011102.json")

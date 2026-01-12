import json

data = json.load(open('OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json'))
combos = data['combinations'][:10]

print('\nCorrected gemstone prices (first 10):')
print('='*80)
for i, c in enumerate(combos, 1):
    print(f"{i}. {c['gemstone']['name']}")
    print(f"   Gemstone: ${c['gemstone']['price_per_stone']:.2f} | Setting: ${c['setting']['price_per_setting']:.2f} | Total: ${c['pricing']['total_pair_price']:.2f}")

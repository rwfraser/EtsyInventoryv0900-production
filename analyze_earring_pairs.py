import json
from collections import defaultdict

# Load the JSON file
with open('OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total combinations reported: {data['total_combinations']}")
print(f"Actual combinations in file: {len(data['combinations'])}")
print("="*70)

# Track issues
issues = {
    'missing_gemstone_url': [],
    'missing_setting_url': [],
    'null_gemstone_color': [],
    'null_gemstone_material': [],
    'malformed_gemstone_url': [],
    'malformed_setting_url': [],
    'price_anomalies': []
}

# Analyze each combination
for i, combo in enumerate(data['combinations']):
    pair_id = combo['pair_id']
    
    # Check gemstone URL
    gem_url = combo['gemstone'].get('product_url', '')
    if not gem_url:
        issues['missing_gemstone_url'].append({'index': i, 'pair_id': pair_id})
    elif not gem_url.startswith('https://www.ottofrei.com/'):
        issues['malformed_gemstone_url'].append({'index': i, 'pair_id': pair_id, 'url': gem_url})
    
    # Check setting URL
    set_url = combo['setting'].get('product_url', '')
    if not set_url:
        issues['missing_setting_url'].append({'index': i, 'pair_id': pair_id})
    elif not set_url.startswith('https://diyjewelry.us/'):
        issues['malformed_setting_url'].append({'index': i, 'pair_id': pair_id, 'url': set_url})
    
    # Check for null values
    if combo['gemstone'].get('color') is None:
        issues['null_gemstone_color'].append({
            'index': i,
            'pair_id': pair_id,
            'gemstone_name': combo['gemstone']['name']
        })
    
    if combo['gemstone'].get('material') is None:
        issues['null_gemstone_material'].append({
            'index': i,
            'pair_id': pair_id,
            'gemstone_name': combo['gemstone']['name']
        })
    
    # Check for price anomalies
    if combo['gemstone']['price_per_stone'] <= 0:
        issues['price_anomalies'].append({
            'index': i,
            'pair_id': pair_id,
            'type': 'zero_gemstone_price',
            'value': combo['gemstone']['price_per_stone']
        })
    
    if combo['setting']['price_per_setting'] <= 0:
        issues['price_anomalies'].append({
            'index': i,
            'pair_id': pair_id,
            'type': 'zero_setting_price',
            'value': combo['setting']['price_per_setting']
        })

# Print summary
print("\nDATA QUALITY ISSUES SUMMARY:")
print("="*70)
print(f"Missing gemstone URLs: {len(issues['missing_gemstone_url'])}")
print(f"Missing setting URLs: {len(issues['missing_setting_url'])}")
print(f"Malformed gemstone URLs: {len(issues['malformed_gemstone_url'])}")
print(f"Malformed setting URLs: {len(issues['malformed_setting_url'])}")
print(f"Null gemstone colors: {len(issues['null_gemstone_color'])}")
print(f"Null gemstone materials: {len(issues['null_gemstone_material'])}")
print(f"Price anomalies: {len(issues['price_anomalies'])}")

# Show examples of each issue
print("\n" + "="*70)
print("DETAILED ISSUES:")
print("="*70)

if issues['null_gemstone_color']:
    print(f"\nNull Gemstone Colors ({len(issues['null_gemstone_color'])} total):")
    for item in issues['null_gemstone_color'][:5]:
        print(f"  - Index {item['index']}: {item['gemstone_name']}")

if issues['null_gemstone_material']:
    print(f"\nNull Gemstone Materials ({len(issues['null_gemstone_material'])} total):")
    for item in issues['null_gemstone_material'][:5]:
        print(f"  - Index {item['index']}: {item['gemstone_name']}")

if issues['malformed_gemstone_url']:
    print(f"\nMalformed Gemstone URLs ({len(issues['malformed_gemstone_url'])} total):")
    for item in issues['malformed_gemstone_url'][:5]:
        print(f"  - Index {item['index']}: {item['url']}")

if issues['malformed_setting_url']:
    print(f"\nMalformed Setting URLs ({len(issues['malformed_setting_url'])} total):")
    for item in issues['malformed_setting_url'][:5]:
        print(f"  - Index {item['index']}: {item['url']}")

# Export issues as JSON
with open('earring_pairs_issues.json', 'w', encoding='utf-8') as f:
    json.dump(issues, f, indent=2, ensure_ascii=False)

print("\n" + "="*70)
print(f"Full issue report exported to: earring_pairs_issues.json")
print("="*70)

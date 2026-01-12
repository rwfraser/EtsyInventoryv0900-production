import json

settings = json.load(open('earring_settings_faceted.json'))
remaining = [s for s in settings if s.get('gemstone_dimensions') == 'Default Title']

print(f"Remaining Default Title: {len(remaining)}")
print(f"Out of stock: {sum(1 for s in remaining if 'in stock' not in s.get('available_quantity', '').lower())}")
print(f"In stock: {sum(1 for s in remaining if 'in stock' in s.get('available_quantity', '').lower())}")

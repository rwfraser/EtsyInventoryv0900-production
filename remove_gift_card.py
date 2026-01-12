import json

# Load the JSON file
with open('OttoFreiGemstonesJan11202601.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove gift card items
original_count = len(data['products'])
data['products'] = [p for p in data['products'] if 'gift card' not in p['name'].lower()]
data['total_products'] = len(data['products'])

# Save back to file
with open('OttoFreiGemstonesJan11202601.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Removed {original_count - data['total_products']} item(s)")
print(f"New total: {data['total_products']} products")

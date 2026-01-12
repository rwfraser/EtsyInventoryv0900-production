import json

# Load the OttoFrei data
with open('OttoFreiGemstonesJan11202601.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("="*80)
print("OttoFrei JSON - Products with Null Fields")
print("="*80)
print()

# Find all products with null material or shape
products_with_nulls = []
for i, product in enumerate(data['products']):
    if product.get('material') is None or product.get('shape') is None:
        products_with_nulls.append((i, product))

print(f"Found {len(products_with_nulls)} products with null fields:\n")

for idx, (i, product) in enumerate(products_with_nulls, 1):
    name = product['name']
    material = product.get('material')
    shape = product.get('shape')
    
    print(f"{idx}. Product Index: {i}")
    print(f"   Name: \"{name}\"")
    print(f"   Current material: {material}")
    print(f"   Current shape: {shape}")
    
    # Suggest corrections based on name
    name_lower = name.lower()
    
    # Suggest shape
    suggested_shape = None
    if 'round' in name_lower and shape is None:
        suggested_shape = "Round"
    elif 'square' in name_lower and shape is None:
        suggested_shape = "Square"
    elif 'emerald cut' in name_lower and shape is None:
        suggested_shape = "Emerald"
    elif 'cushion' in name_lower and shape is None:
        suggested_shape = "Cushion"
    
    # Suggest material
    suggested_material = None
    if 'lab-created' in name_lower or 'lab created' in name_lower:
        suggested_material = "Lab Created"
    elif 'imitation' in name_lower or 'synthetic' in name_lower:
        suggested_material = "Synthetic"
    
    if suggested_shape:
        print(f"   SUGGESTED shape: \"{suggested_shape}\"")
    if suggested_material:
        print(f"   SUGGESTED material: \"{suggested_material}\"")
    
    print()

print("="*80)
print(f"Total products needing correction: {len(products_with_nulls)}")
print("="*80)

"""
Fix Default Title dimensions in earring_settings_faceted.json
and delete settings that cannot be fixed.
"""

import json

# Load the analysis
with open('skipped_settings_analysis.json', 'r', encoding='utf-8') as f:
    analysis = json.load(f)

# Load the original settings file
with open('earring_settings_faceted.json', 'r', encoding='utf-8') as f:
    settings = json.load(f)

print(f"Original settings count: {len(settings)}")

# Get fixable settings
fixable = {item['product_number']: item['extracted_dimension'] 
           for item in analysis['skipped']['default_title'] 
           if item['can_fix']}

# Settings to delete
to_delete = ['ES01', 'EW038', 'EW031']

print(f"\nFixable settings: {len(fixable)}")
print(f"Settings to delete: {len(to_delete)}")

# Process settings
fixed_count = 0
deleted_count = 0
updated_settings = []

for setting in settings:
    product_num = setting.get('product_number')
    
    # Delete if in delete list
    if product_num in to_delete:
        print(f"  Deleted: {product_num}")
        deleted_count += 1
        continue
    
    # Fix if in fixable list
    if product_num in fixable:
        old_dim = setting.get('gemstone_dimensions', 'N/A')
        new_dim = fixable[product_num]
        setting['gemstone_dimensions'] = new_dim
        print(f"  Fixed {product_num}: '{old_dim}' → '{new_dim}'")
        fixed_count += 1
    
    updated_settings.append(setting)

print(f"\n{'='*70}")
print(f"SUMMARY")
print(f"{'='*70}")
print(f"Original count: {len(settings)}")
print(f"Fixed: {fixed_count}")
print(f"Deleted: {deleted_count}")
print(f"Final count: {len(updated_settings)}")

# Save updated settings
with open('earring_settings_faceted.json', 'w', encoding='utf-8') as f:
    json.dump(updated_settings, f, indent=2, ensure_ascii=False)

print(f"\n✓ Updated file saved: earring_settings_faceted.json")

# Verify the changes
print(f"\nVerifying changes...")
default_title_count = sum(1 for s in updated_settings if s.get('gemstone_dimensions') == 'Default Title')
print(f"Remaining 'Default Title' entries: {default_title_count}")

if default_title_count == 0:
    print("✓ All 'Default Title' entries have been fixed or removed!")
else:
    print(f"⚠ Warning: {default_title_count} 'Default Title' entries still remain")
    remaining = [s.get('product_number') for s in updated_settings if s.get('gemstone_dimensions') == 'Default Title']
    print(f"  Remaining: {remaining}")

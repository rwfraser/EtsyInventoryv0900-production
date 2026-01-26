"""
Script to correct null gemstone color and material values in
OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json using mapping rules
from CorrectOttoFrei_DIY_EarringPairs.json
"""
import json
from datetime import datetime

# Load the correction rules
print("Loading correction rules...")
with open('CorrectOttoFrei_DIY_EarringPairs.json', 'r', encoding='utf-8') as f:
    correction_data = json.load(f)

color_mappings = correction_data['correction_rules']['gemstone_color_mappings']
material_mappings = correction_data['correction_rules']['gemstone_material_mappings']

# Load the earring pairs data
print("Loading earring pairs data...")
with open('OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json', 'r', encoding='utf-8') as f:
    earring_data = json.load(f)

# Track changes
changes = {
    'colors_updated': 0,
    'materials_updated': 0,
    'records_modified': set(),
    'color_changes': [],
    'material_changes': []
}

print("\nProcessing corrections...")
print("="*70)

# Process each combination
for i, combo in enumerate(earring_data['combinations']):
    gemstone = combo['gemstone']
    gemstone_name = gemstone['name']
    pair_id = combo['pair_id']
    modified = False
    
    # Check and correct color
    if gemstone.get('color') is None and gemstone_name in color_mappings:
        new_color = color_mappings[gemstone_name]
        gemstone['color'] = new_color
        changes['colors_updated'] += 1
        changes['color_changes'].append({
            'index': i,
            'pair_id': pair_id,
            'gemstone_name': gemstone_name,
            'new_color': new_color
        })
        modified = True
        print(f"[{i}] {pair_id[:50]:<50} | Color: null → {new_color}")
    
    # Check and correct material
    if gemstone.get('material') is None and gemstone_name in material_mappings:
        new_material = material_mappings[gemstone_name]
        gemstone['material'] = new_material
        changes['materials_updated'] += 1
        changes['material_changes'].append({
            'index': i,
            'pair_id': pair_id,
            'gemstone_name': gemstone_name,
            'new_material': new_material
        })
        modified = True
        print(f"[{i}] {pair_id[:50]:<50} | Material: null → {new_material}")
    
    if modified:
        changes['records_modified'].add(i)

# Convert set to list for JSON serialization
changes['records_modified'] = sorted(list(changes['records_modified']))

# Create backup of original file
backup_filename = f"OttoFreiGems_DIYSettings_EarringPairs_CORRECTED_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
print("\n" + "="*70)
print(f"Creating backup: {backup_filename}")
with open(backup_filename, 'w', encoding='utf-8') as f:
    json.dump(earring_data, f, indent=2, ensure_ascii=False)

# Save corrected data
print("Saving corrected data to original file...")
with open('OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json', 'w', encoding='utf-8') as f:
    json.dump(earring_data, f, indent=2, ensure_ascii=False)

# Save change report
change_report_filename = f"correction_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
print(f"Saving change report: {change_report_filename}")
with open(change_report_filename, 'w', encoding='utf-8') as f:
    json.dump(changes, f, indent=2, ensure_ascii=False)

# Print summary
print("\n" + "="*70)
print("CORRECTION SUMMARY")
print("="*70)
print(f"Total combinations processed: {len(earring_data['combinations'])}")
print(f"Total records modified: {len(changes['records_modified'])}")
print(f"Colors updated: {changes['colors_updated']}")
print(f"Materials updated: {changes['materials_updated']}")
print("\nColor Mappings Applied:")
for name, color in color_mappings.items():
    count = sum(1 for c in changes['color_changes'] if c['gemstone_name'] == name)
    if count > 0:
        print(f"  - {name}: {color} ({count} records)")

print("\nMaterial Mappings Applied:")
for name, material in material_mappings.items():
    count = sum(1 for c in changes['material_changes'] if c['gemstone_name'] == name)
    if count > 0:
        print(f"  - {name}: {material} ({count} records)")

print("\n" + "="*70)
print(f"Backup saved as: {backup_filename}")
print(f"Change report saved as: {change_report_filename}")
print("Original file updated successfully!")
print("="*70)

const fs = require('fs');
const path = require('path');

// Read existing products
const existingPath = path.join(__dirname, 'public', 'products.json');
const existingData = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));

// Read new products
const newPath = path.join(__dirname, '..', 'all_earring_pair_combinations001.json');
const newData = JSON.parse(fs.readFileSync(newPath, 'utf-8'));

// Add vendor to existing products
const existingWithVendor = existingData.combinations.map(product => ({
  ...product,
  vendor: 'OttoFreiGemsDIYSettings'
}));

// Add vendor to new products
const newWithVendor = newData.combinations.map(product => ({
  ...product,
  vendor: 'GemsngemsGemsDIYSettings'
}));

// Create a Set of existing pair_ids to avoid duplicates
const existingIds = new Set(existingWithVendor.map(p => p.pair_id));

// Filter out any duplicates from new data
const uniqueNewProducts = newWithVendor.filter(p => !existingIds.has(p.pair_id));

// Merge the products
const mergedData = {
  generated_at: new Date().toISOString(),
  total_combinations: existingWithVendor.length + uniqueNewProducts.length,
  combinations: [...existingWithVendor, ...uniqueNewProducts]
};

// Write the merged data
fs.writeFileSync(existingPath, JSON.stringify(mergedData, null, 2), 'utf-8');

console.log(`Merged successfully!`);
console.log(`Existing products (OttoFreiGemsDIYSettings): ${existingWithVendor.length}`);
console.log(`New unique products (GemsngemsGemsDIYSettings): ${uniqueNewProducts.length}`);
console.log(`Duplicate products skipped: ${newWithVendor.length - uniqueNewProducts.length}`);
console.log(`Total products: ${mergedData.total_combinations}`);

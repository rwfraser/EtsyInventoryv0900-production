const fs = require('fs');
const path = require('path');

// Read the current products.json
const productsPath = path.join(__dirname, 'public', 'products.json');
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Create the seahorse earring entry
// Adapting it to fit the EarringPair structure
const seahorseProduct = {
  pair_id: "VINTAGE_Blue_Enamel_Seahorse_Studs",
  setting: {
    product_number: "VINTAGE001",
    product_title: "Blue Enamel Seahorse Stud Earrings - Complete Pair",
    price_per_setting: 0, // Complete product, no separate setting cost
    material: "Gold-tone alloy with enamel",
    gemstone_dimensions: "15mm x 8mm",
    gemstone_shape: "seahorse",
    variant_id: 0,
    product_url: "", // No external URL for vintage item
    quantity_needed: 2
  },
  gemstone: {
    name: "Blue Enamel Seahorse Stud Earrings",
    material: "Enamel",
    color: "Blue",
    shape: "Seahorse",
    size: "15mm",
    price_per_stone: 0, // Complete product
    product_url: "",
    quantity_needed: 2
  },
  pricing: {
    settings_subtotal: 0,
    gemstones_subtotal: 0,
    subtotal: 24.99,
    markup: 0,
    total_pair_price: 24.99
  },
  compatibility: {
    size_match: "15x8mm",
    shape_match: "novelty seahorse"
  },
  vendor: "Vintage",
  category: "Vintage / Novelty Stud Earrings",
  style: "Coastal, Nautical, Whimsical",
  description: "A charming pair of blue enamel seahorse stud earrings outlined in gold-tone metal. These petite novelty studs feature a glossy ocean-blue finish with sculpted detailing and a raised metallic border that highlights the seahorse silhouette. Lightweight and whimsical, they are perfect for beachwear, summer outfits, nautical themes, or vintage jewelry collectors.",
  images: [
    "/images/seahorse/front.jpg",
    "/images/seahorse/display.jpg"
  ]
};

// Add to combinations array
productsData.combinations.push(seahorseProduct);

// Update total count
productsData.total_combinations = productsData.combinations.length;

// Update generated_at timestamp
productsData.generated_at = new Date().toISOString();

// Write back to file
fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));

console.log('✓ Successfully added Blue Enamel Seahorse Stud Earrings to products.json');
console.log(`  Total products: ${productsData.total_combinations}`);
console.log(`  Product ID: ${seahorseProduct.pair_id}`);

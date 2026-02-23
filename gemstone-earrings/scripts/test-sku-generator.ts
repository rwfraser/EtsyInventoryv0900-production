// Test script for SKU Generator
// Run with: npx tsx scripts/test-sku-generator.ts

import { SKUGenerator } from '../lib/skuGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('❌ FAILED:', message);
    throw new Error(message);
  }
  console.log('✅ PASSED:', message);
}

function testValidation() {
  console.log('\n=== Testing SKU Validation ===\n');
  
  // Valid SKUs
  assert(SKUGenerator.validateSKU('Aa1a01'), 'Valid starting SKU');
  assert(SKUGenerator.validateSKU('Ac4o05'), 'Valid Python example SKU');
  assert(SKUGenerator.validateSKU('Bt4o05'), 'Valid max SKU');
  assert(SKUGenerator.validateSKU('Zt4o05'), 'Valid rack Z');
  assert(SKUGenerator.validateSKU('at2b03'), 'Valid lowercase rack');
  assert(SKUGenerator.validateSKU('9t4o05'), 'Valid numeric rack');
  
  // Invalid SKUs
  assert(!SKUGenerator.validateSKU(''), 'Empty string invalid');
  assert(!SKUGenerator.validateSKU('Aa1a0'), 'Too short');
  assert(!SKUGenerator.validateSKU('Aa1a001'), 'Too long');
  assert(!SKUGenerator.validateSKU('Aa1a00'), 'Item 00 invalid (min 01)');
  assert(!SKUGenerator.validateSKU('Aa1a06'), 'Item 06 invalid (max 05)');
  assert(!SKUGenerator.validateSKU('Aa0a01'), 'Tray 0 invalid');
  assert(!SKUGenerator.validateSKU('Aa5a01'), 'Tray 5 invalid');
  assert(!SKUGenerator.validateSKU('AAa01'), 'Shelf uppercase invalid');
  assert(!SKUGenerator.validateSKU('Aua01'), 'Shelf u invalid (max t)');
  assert(!SKUGenerator.validateSKU('Aa1p01'), 'Bin p invalid (max o)');
  assert(!SKUGenerator.validateSKU('Aa1A01'), 'Bin uppercase invalid');
}

function testBasicIncrement() {
  console.log('\n=== Testing Basic SKU Increment ===\n');
  
  // Test item increment
  let result = SKUGenerator.nextSKU('Aa1a01');
  assert(result.success && result.sku === 'Aa1a02', 'Aa1a01 → Aa1a02');
  
  result = SKUGenerator.nextSKU('Aa1a02');
  assert(result.success && result.sku === 'Aa1a03', 'Aa1a02 → Aa1a03');
  
  result = SKUGenerator.nextSKU('Aa1a04');
  assert(result.success && result.sku === 'Aa1a05', 'Aa1a04 → Aa1a05');
}

function testBinOverflow() {
  console.log('\n=== Testing Bin Overflow ===\n');
  
  // Item 05 → overflow to next bin
  let result = SKUGenerator.nextSKU('Aa1a05');
  assert(result.success && result.sku === 'Aa1b01', 'Aa1a05 → Aa1b01 (bin overflow)');
  
  result = SKUGenerator.nextSKU('Aa1b05');
  assert(result.success && result.sku === 'Aa1c01', 'Aa1b05 → Aa1c01');
  
  result = SKUGenerator.nextSKU('Aa1n05');
  assert(result.success && result.sku === 'Aa1o01', 'Aa1n05 → Aa1o01');
}

function testTrayOverflow() {
  console.log('\n=== Testing Tray Overflow ===\n');
  
  // Bin o, item 05 → overflow to next tray
  let result = SKUGenerator.nextSKU('Aa1o05');
  assert(result.success && result.sku === 'Aa2a01', 'Aa1o05 → Aa2a01 (tray overflow)');
  
  result = SKUGenerator.nextSKU('Aa2o05');
  assert(result.success && result.sku === 'Aa3a01', 'Aa2o05 → Aa3a01');
  
  result = SKUGenerator.nextSKU('Aa3o05');
  assert(result.success && result.sku === 'Aa4a01', 'Aa3o05 → Aa4a01');
}

function testShelfOverflow() {
  console.log('\n=== Testing Shelf Overflow ===\n');
  
  // Tray 4, bin o, item 05 → overflow to next shelf
  let result = SKUGenerator.nextSKU('Aa4o05');
  assert(result.success && result.sku === 'Ab1a01', 'Aa4o05 → Ab1a01 (shelf overflow)');
  
  result = SKUGenerator.nextSKU('Ab4o05');
  assert(result.success && result.sku === 'Ac1a01', 'Ab4o05 → Ac1a01');
  
  result = SKUGenerator.nextSKU('As4o05');
  assert(result.success && result.sku === 'At1a01', 'As4o05 → At1a01');
}

function testRackOverflow() {
  console.log('\n=== Testing Rack Overflow ===\n');
  
  // Shelf t, tray 4, bin o, item 05 → overflow to next rack
  let result = SKUGenerator.nextSKU('At4o05');
  assert(result.success && result.sku === 'Ba1a01', 'At4o05 → Ba1a01 (rack overflow)');
  
  result = SKUGenerator.nextSKU('Ba1a01');
  assert(result.success && result.sku === 'Ba1a02', 'Ba1a01 → Ba1a02');
  
  result = SKUGenerator.nextSKU('Bt4o05');
  assert(result.success && result.sku === 'Ca1a01', 'Bt4o05 → Ca1a01');
}

function testSKUComparison() {
  console.log('\n=== Testing SKU Comparison ===\n');
  
  // Same SKUs
  assert(SKUGenerator.compareSKUs('Aa1a01', 'Aa1a01') === 0, 'Aa1a01 == Aa1a01');
  
  // Item comparison
  assert(SKUGenerator.compareSKUs('Aa1a02', 'Aa1a01') > 0, 'Aa1a02 > Aa1a01');
  assert(SKUGenerator.compareSKUs('Aa1a01', 'Aa1a02') < 0, 'Aa1a01 < Aa1a02');
  
  // Bin comparison
  assert(SKUGenerator.compareSKUs('Aa1b01', 'Aa1a05') > 0, 'Aa1b01 > Aa1a05');
  assert(SKUGenerator.compareSKUs('Aa1o05', 'Aa1a01') > 0, 'Aa1o05 > Aa1a01');
  
  // Tray comparison
  assert(SKUGenerator.compareSKUs('Aa2a01', 'Aa1o05') > 0, 'Aa2a01 > Aa1o05');
  assert(SKUGenerator.compareSKUs('Aa4o05', 'Aa1a01') > 0, 'Aa4o05 > Aa1a01');
  
  // Shelf comparison
  assert(SKUGenerator.compareSKUs('Ab1a01', 'Aa4o05') > 0, 'Ab1a01 > Aa4o05');
  assert(SKUGenerator.compareSKUs('At4o05', 'Aa1a01') > 0, 'At4o05 > Aa1a01');
  
  // Rack comparison
  assert(SKUGenerator.compareSKUs('Ba1a01', 'At4o05') > 0, 'Ba1a01 > At4o05');
  assert(SKUGenerator.compareSKUs('Bt4o05', 'Aa1a01') > 0, 'Bt4o05 > Aa1a01');
}

function testFindHighestSKU() {
  console.log('\n=== Testing Find Highest SKU ===\n');
  
  const skus1 = ['Aa1a01', 'Aa1a05', 'Aa1a03'];
  assert(SKUGenerator.findHighestSKU(skus1) === 'Aa1a05', 'Find highest in simple list');
  
  const skus2 = ['Aa1a01', 'Ab1a01', 'Aa4o05'];
  assert(SKUGenerator.findHighestSKU(skus2) === 'Ab1a01', 'Find highest with shelf overflow');
  
  const skus3 = ['Aa1a01', 'Bt4o05', 'Ab1a01'];
  assert(SKUGenerator.findHighestSKU(skus3) === 'Bt4o05', 'Find highest with rack difference');
  
  const skus4 = ['Ac4o05'];
  assert(SKUGenerator.findHighestSKU(skus4) === 'Ac4o05', 'Find highest in single element');
  
  assert(SKUGenerator.findHighestSKU([]) === null, 'Return null for empty array');
}

function testSequentialGeneration() {
  console.log('\n=== Testing Sequential Generation ===\n');
  
  // Generate 100 sequential SKUs starting from Aa1a01
  let current = 'Aa1a01';
  const generated = [current];
  
  for (let i = 0; i < 99; i++) {
    const result = SKUGenerator.nextSKU(current);
    assert(result.success, `Generated SKU #${i + 2}`);
    current = result.sku!;
    generated.push(current);
  }
  
  // Verify no duplicates
  const uniqueSKUs = new Set(generated);
  assert(uniqueSKUs.size === 100, 'All 100 generated SKUs are unique');
  
  // Verify 100th SKU
  console.log(`   100th SKU: ${current}`);
  
  // Verify they're in ascending order
  for (let i = 1; i < generated.length; i++) {
    assert(
      SKUGenerator.compareSKUs(generated[i], generated[i - 1]) > 0,
      `SKU ${i} > SKU ${i - 1}`
    );
  }
}

function testEdgeCases() {
  console.log('\n=== Testing Edge Cases ===\n');
  
  // Test starting SKU
  const startingSKU = SKUGenerator.getStartingSKU();
  assert(startingSKU === 'Aa1a01', 'Starting SKU is Aa1a01');
  assert(SKUGenerator.validateSKU(startingSKU), 'Starting SKU is valid');
  
  // Test invalid input handling
  let result = SKUGenerator.nextSKU('invalid');
  assert(!result.success, 'Invalid SKU returns error');
  assert(result.error?.includes('Invalid SKU format'), 'Error message contains format info');
  
  // Test Python example from comments (Ac4o05 → shelf overflow)
  result = SKUGenerator.nextSKU('Ac4o05');
  assert(result.success && result.sku === 'Ad1a01', 'Ac4o05 → Ad1a01 (shelf overflow)');
}

function runAllTests() {
  console.log('\n🧪 SKU Generator Test Suite\n');
  console.log('=' .repeat(50));
  
  try {
    testValidation();
    testBasicIncrement();
    testBinOverflow();
    testTrayOverflow();
    testShelfOverflow();
    testRackOverflow();
    testSKUComparison();
    testFindHighestSKU();
    testSequentialGeneration();
    testEdgeCases();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ All tests passed!\n');
    return true;
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('\n❌ Tests failed!\n');
    console.error(error);
    return false;
  }
}

// Run tests
const success = runAllTests();
process.exit(success ? 0 : 1);

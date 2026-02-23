# Production Backend Test Suite

Run these tests in the browser console (F12) while logged in as admin at https://www.myearringadvisor.com

## Complete Test Suite (Copy & Paste)

```javascript
async function testProductionBackend() {
  console.log('🚀 PRODUCTION BACKEND TEST SUITE');
  console.log('='.repeat(70));
  
  const results = [];
  
  // TEST 1: Check SKU Constraint Status
  console.log('\n📋 TEST 1: SKU Constraint Status');
  try {
    const res = await fetch('/api/admin/fix-sku-constraint');
    const data = await res.json();
    
    const passed = data.columnExists && !data.isNullable && data.hasUniqueConstraint;
    results.push({
      name: 'SKU Constraints',
      passed,
      details: {
        columnExists: data.columnExists,
        isNullable: data.isNullable,
        hasUnique: data.hasUniqueConstraint,
        status: passed ? '✅ All constraints OK' : '⚠️ Needs fixing'
      }
    });
    
    if (!passed) {
      console.log('⚠️  Constraints need fixing. Run: fetch(\'/api/admin/fix-sku-constraint\', {method:\'POST\'}).then(r=>r.json()).then(console.log)');
    }
  } catch (e) {
    results.push({ name: 'SKU Constraints', passed: false, error: e.message });
  }
  
  // TEST 2: Generate First SKU
  console.log('\n🎲 TEST 2: SKU Generation (Empty DB)');
  try {
    const res = await fetch('/api/admin/sku/generate');
    const data = await res.json();
    
    const passed = data.success && data.sku === 'Aa1a01';
    results.push({
      name: 'First SKU Generation',
      passed,
      details: {
        sku: data.sku,
        expected: 'Aa1a01',
        validated: data.validated,
        status: passed ? '✅ Correct' : '❌ Wrong SKU'
      }
    });
  } catch (e) {
    results.push({ name: 'First SKU Generation', passed: false, error: e.message });
  }
  
  // TEST 3: Validate SKU Format
  console.log('\n✅ TEST 3: SKU Validation');
  try {
    const validTests = [
      { sku: 'Aa1a01', shouldBeValid: true },
      { sku: 'Zz4o05', shouldBeValid: true },
      { sku: 'invalid', shouldBeValid: false },
      { sku: 'Aa1a06', shouldBeValid: false }, // Item > 05
      { sku: 'Aa5a01', shouldBeValid: false }  // Tray > 4
    ];
    
    let allPassed = true;
    for (const test of validTests) {
      const res = await fetch('/api/admin/sku/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: test.sku })
      });
      const data = await res.json();
      
      const testPassed = data.valid === test.shouldBeValid;
      if (!testPassed) allPassed = false;
      
      console.log(`  ${test.sku}: ${data.valid ? '✅' : '❌'} (expected: ${test.shouldBeValid})`);
    }
    
    results.push({
      name: 'SKU Validation',
      passed: allPassed,
      details: { tested: validTests.length }
    });
  } catch (e) {
    results.push({ name: 'SKU Validation', passed: false, error: e.message });
  }
  
  // TEST 4: Create Test Product
  console.log('\n📦 TEST 4: Create Complete Product');
  try {
    const testProduct = {
      sku: 'Aa1a01',
      name: 'Test Backend Verification Earrings',
      description: 'Created by automated test suite',
      price: '29.99',
      category: 'Earrings',
      stock: 5,
      image1: 'https://placehold.co/400x400/9333ea/ffffff/png?text=Test1',
      image2: 'https://placehold.co/400x400/9333ea/ffffff/png?text=Test2',
      image3: 'https://placehold.co/400x400/9333ea/ffffff/png?text=Test3',
      image4: 'https://placehold.co/400x400/9333ea/ffffff/png?text=Test4',
      aiDescription: 'These elegant test earrings feature beautiful gemstones in a timeless design.',
      aiKeywords: ['earrings', 'jewelry', 'gemstone', 'elegant', 'test'],
      aiProcessedAt: new Date().toISOString()
    };
    
    const res = await fetch('/api/admin/products/create-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });
    const data = await res.json();
    
    const passed = data.success && data.product?.sku === 'Aa1a01';
    results.push({
      name: 'Create Product',
      passed,
      details: {
        productId: data.product?.id,
        sku: data.product?.sku,
        name: data.product?.name,
        status: passed ? '✅ Created' : '❌ Failed'
      }
    });
    
    if (passed) {
      console.log(`✅ Product created: ID ${data.product.id}, SKU ${data.product.sku}`);
    }
  } catch (e) {
    results.push({ name: 'Create Product', passed: false, error: e.message });
  }
  
  // TEST 5: Sequential SKU Generation
  console.log('\n🔢 TEST 5: Sequential SKU Generation');
  try {
    const res = await fetch('/api/admin/sku/generate');
    const data = await res.json();
    
    const passed = data.success && data.sku === 'Aa1a02';
    results.push({
      name: 'Sequential SKU',
      passed,
      details: {
        sku: data.sku,
        expected: 'Aa1a02',
        status: passed ? '✅ Correct increment' : '❌ Wrong sequence'
      }
    });
  } catch (e) {
    results.push({ name: 'Sequential SKU', passed: false, error: e.message });
  }
  
  // TEST 6: SKU Collision Detection
  console.log('\n💥 TEST 6: SKU Collision Detection');
  try {
    const duplicateProduct = {
      sku: 'Aa1a01', // Same as test product
      name: 'Duplicate Test',
      price: '19.99',
      stock: 1
    };
    
    const res = await fetch('/api/admin/products/create-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateProduct)
    });
    const data = await res.json();
    
    // Should return 409 or error about duplicate SKU
    const passed = res.status === 409 || (data.error && data.error.includes('SKU'));
    results.push({
      name: 'Collision Detection',
      passed,
      details: {
        status: res.status,
        expected: 409,
        errorMessage: data.error,
        status_check: passed ? '✅ Blocked duplicate' : '❌ Allowed duplicate'
      }
    });
  } catch (e) {
    results.push({ name: 'Collision Detection', passed: false, error: e.message });
  }
  
  // TEST 7: Check Product via API
  console.log('\n🔍 TEST 7: Retrieve Product');
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    
    const testProduct = products.find(p => p.sku === 'Aa1a01');
    const passed = !!testProduct;
    
    results.push({
      name: 'Retrieve Product',
      passed,
      details: {
        totalProducts: products.length,
        testProductFound: passed,
        status: passed ? '✅ Found' : '❌ Not found'
      }
    });
  } catch (e) {
    results.push({ name: 'Retrieve Product', passed: false, error: e.message });
  }
  
  // PRINT RESULTS
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(70));
  
  results.forEach((r, i) => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`\n${i + 1}. ${icon} ${r.name}: ${r.passed ? 'PASS' : 'FAIL'}`);
    
    if (r.details) {
      Object.entries(r.details).forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value)}`);
      });
    }
    
    if (r.error) {
      console.log(`   ❌ Error: ${r.error}`);
    }
  });
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log('\n' + '='.repeat(70));
  console.log(`📈 SUMMARY: ${passed}/${total} tests passed (${percentage}%)`);
  console.log('='.repeat(70));
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Backend is ready for frontend implementation.');
    console.log('\n📝 CLEANUP: Delete test product before continuing:');
    console.log('   Visit: https://www.myearringadvisor.com/admin/products');
    console.log('   Delete: "Test Backend Verification Earrings"');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.');
  }
  
  return { passed, total, results };
}

// Run the test suite
testProductionBackend();
```

## Individual Test Commands

If you prefer to run tests individually:

### 1. Fix Constraints (if needed)
```javascript
fetch('/api/admin/fix-sku-constraint', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

### 2. Generate SKU
```javascript
fetch('/api/admin/sku/generate')
  .then(r => r.json())
  .then(console.log);
```

### 3. Create Test Product
```javascript
fetch('/api/admin/products/create-complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sku: 'Aa1a01',
    name: 'Test Product',
    description: 'Test description',
    price: '29.99',
    category: 'Earrings',
    stock: 5,
    image1: 'https://placehold.co/400/png',
    image2: 'https://placehold.co/400/png',
    image3: 'https://placehold.co/400/png',
    image4: 'https://placehold.co/400/png',
    aiDescription: 'AI generated description',
    aiKeywords: ['test', 'earrings'],
    aiProcessedAt: new Date().toISOString()
  })
}).then(r => r.json()).then(console.log);
```

### 4. Test Sequential SKU
```javascript
fetch('/api/admin/sku/generate')
  .then(r => r.json())
  .then(d => console.log('Next SKU:', d.sku, '(should be Aa1a02)'));
```

## Expected Results

All 7 tests should pass:
- ✅ SKU Constraints (NOT NULL, UNIQUE)
- ✅ First SKU Generation (Aa1a01)
- ✅ SKU Validation (format checking)
- ✅ Create Complete Product (with all data)
- ✅ Sequential SKU (Aa1a02 after Aa1a01)
- ✅ Collision Detection (blocks duplicates)
- ✅ Retrieve Product (via API)

## Next Steps After Tests Pass

1. **Delete test product** via admin panel
2. **Proceed to frontend implementation** - rewrite `app/admin/products/add/page.tsx`
3. **Implement new workflow**: upload → preview → AI processing → create

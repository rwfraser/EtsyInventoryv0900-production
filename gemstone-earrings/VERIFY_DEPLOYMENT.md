# Deployment Verification Guide

## Quick Verification (Browser Console)

**Prerequisites:**
1. Visit https://www.myearringadvisor.com
2. Log in as admin (rogeridaho@gmail.com)
3. Open Browser DevTools (F12)
4. Go to Console tab

---

## Step 1: Check Migration Status

Paste and run:
```javascript
console.log('🔍 Checking SKU Migration Status...\n');

fetch('/api/admin/backfill-skus')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.skuColumnExists === false) {
      console.log('\n⚠️  SKU column does NOT exist yet');
      console.log('📝 Next: Run migration (see Step 2)');
    } else if (data.skuColumnExists === true) {
      console.log('\n✅ SKU column EXISTS');
      console.log(`   - Nullable: ${data.columnInfo.is_nullable}`);
      console.log(`   - Total products: ${data.stats.total_products}`);
      console.log(`   - Products with SKU: ${data.stats.products_with_sku}`);
      console.log(`   - Needs backfill: ${data.needsBackfill}`);
      
      if (data.stats.total_products > 0) {
        console.log('\n⚠️  Test products exist - delete them first!');
        console.log('   Visit: /admin/products');
      }
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
- If SKU column doesn't exist: Message saying column doesn't exist
- If SKU column exists: Shows column info and product counts

---

## Step 2: Delete Test Products (If Any)

**Option A: Via Admin UI**
1. Visit: https://www.myearringadvisor.com/admin/products
2. Click "Edit" on each product
3. Scroll down to "Danger Zone"
4. Click "Delete Product"
5. Repeat for all test products

**Option B: Via Drizzle Studio**
```bash
npm run db:studio
# Navigate to products table
# Delete all rows
```

---

## Step 3: Run Migration

**After deleting test products**, paste and run:
```javascript
console.log('🚀 Running SKU Migration...\n');

fetch('/api/admin/backfill-skus', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Migration SUCCESS!');
      console.log(`   - Products backfilled: ${data.backfilled || 0}`);
      if (data.nextAvailableSKU) {
        console.log(`   - Next SKU: ${data.nextAvailableSKU}`);
      }
    } else {
      console.log('\n❌ Migration FAILED');
      console.log(`   Error: ${data.error}`);
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
```json
{
  "success": true,
  "message": "No products needed backfill. Constraints added.",
  "backfilled": 0
}
```

---

## Step 4: Test SKU Generation

Paste and run:
```javascript
console.log('🎲 Testing SKU Generation...\n');

fetch('/api/admin/sku/generate')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\n✅ SKU Generated: ${data.sku}`);
      console.log('   Expected first SKU: Aa1a01');
      
      if (data.sku === 'Aa1a01') {
        console.log('   ✅ CORRECT!');
      } else {
        console.log(`   ⚠️  Got ${data.sku} instead`);
      }
    } else {
      console.log('\n❌ SKU Generation Failed');
      console.log(`   Error: ${data.error}`);
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
```json
{
  "success": true,
  "sku": "Aa1a01",
  "validated": true
}
```

---

## Step 5: Test SKU Validation

Paste and run:
```javascript
console.log('✔️  Testing SKU Validation...\n');

const testCases = [
  { sku: 'Aa1a01', expected: 'valid and available' },
  { sku: 'invalid', expected: 'invalid format' },
  { sku: 'Aa1a06', expected: 'invalid (item max is 05)' }
];

Promise.all(
  testCases.map(test => 
    fetch('/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: test.sku })
    })
    .then(r => r.json())
    .then(data => ({ test: test.sku, expected: test.expected, result: data }))
  )
).then(results => {
  results.forEach(r => {
    console.log(`\nSKU: ${r.test}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Valid: ${r.result.valid}`);
    console.log(`  Available: ${r.result.available}`);
    
    if (r.test === 'Aa1a01' && r.result.valid && r.result.available) {
      console.log('  ✅ PASS');
    } else if (r.test === 'invalid' && !r.result.valid) {
      console.log('  ✅ PASS');
    } else if (r.test === 'Aa1a06' && !r.result.valid) {
      console.log('  ✅ PASS');
    } else {
      console.log('  ⚠️  Unexpected result');
    }
  });
});
```

**Expected Results:**
- `Aa1a01`: Valid and available ✅
- `invalid`: Invalid format ✅
- `Aa1a06`: Invalid format ✅

---

## Step 6: Create Test Product

Paste and run:
```javascript
console.log('📦 Creating Test Product...\n');

const testProduct = {
  sku: 'Aa1a01',
  name: 'Test Verification Earrings',
  description: 'Deployment verification test product',
  price: '29.99',
  category: 'Earrings',
  stock: 5,
  image1: 'https://via.placeholder.com/400x400/9333ea/ffffff?text=Test+1',
  image2: 'https://via.placeholder.com/400x400/9333ea/ffffff?text=Test+2',
  image3: 'https://via.placeholder.com/400x400/9333ea/ffffff?text=Test+3',
  image4: 'https://via.placeholder.com/400x400/9333ea/ffffff?text=Test+4',
  aiDescription: 'These elegant test earrings feature beautiful gemstones...',
  aiKeywords: ['earrings', 'jewelry', 'gemstone', 'test'],
  aiProcessedAt: new Date().toISOString()
};

fetch('/api/admin/products/create-complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testProduct)
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Product Created Successfully!');
      console.log(`   - ID: ${data.product.id}`);
      console.log(`   - SKU: ${data.product.sku}`);
      console.log(`   - Name: ${data.product.name}`);
      console.log('\n📝 Next Steps:');
      console.log('   1. Visit: /admin/products (verify product appears)');
      console.log('   2. Visit: /products (verify on homepage)');
      console.log('   3. Test sequential SKU generation (Step 7)');
    } else {
      console.log('\n❌ Product Creation Failed');
      console.log(`   Error: ${data.error}`);
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
```json
{
  "success": true,
  "product": { ... },
  "message": "Product created successfully"
}
```

**Verify:**
1. Visit `/admin/products` - Product should be listed with SKU "Aa1a01"
2. Visit `/products` - Product should appear on homepage

---

## Step 7: Test Sequential SKU Generation

Paste and run:
```javascript
console.log('🔢 Testing Sequential SKU Generation...\n');

fetch('/api/admin/sku/generate')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\n✅ Next SKU: ${data.sku}`);
      console.log('   Expected: Aa1a02 (after Aa1a01)');
      
      if (data.sku === 'Aa1a02') {
        console.log('   ✅ CORRECT! Sequential generation working!');
      } else {
        console.log(`   ⚠️  Got ${data.sku} instead`);
      }
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
```json
{
  "success": true,
  "sku": "Aa1a02",
  "validated": true
}
```

---

## Step 8: Test SKU Collision Detection

Paste and run:
```javascript
console.log('💥 Testing SKU Collision Detection...\n');

const duplicateProduct = {
  sku: 'Aa1a01', // Same SKU as test product
  name: 'Duplicate Test',
  price: '19.99',
  stock: 1
};

fetch('/api/admin/products/create-complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(duplicateProduct)
})
  .then(async r => {
    const data = await r.json();
    return { status: r.status, data };
  })
  .then(({ status, data }) => {
    console.log(`Status: ${status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (status === 409) {
      console.log('\n✅ Collision Detection WORKING!');
      console.log('   Expected: 409 Conflict');
      console.log('   Got: 409 Conflict ✅');
    } else {
      console.log('\n⚠️  Unexpected response');
      console.log(`   Expected: 409, Got: ${status}`);
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
```json
{
  "error": "SKU already exists",
  "message": "This SKU is already assigned to another product"
}
```

With HTTP status: **409 Conflict**

---

## Complete Verification Script

Run all tests at once:
```javascript
async function verifyDeployment() {
  console.log('🚀 Running Complete Deployment Verification\n');
  console.log('='.repeat(60) + '\n');
  
  const results = [];
  
  // Test 1: Check migration status
  try {
    const status = await fetch('/api/admin/backfill-skus').then(r => r.json());
    results.push({
      name: 'Migration Status',
      passed: status.skuColumnExists === true,
      details: status
    });
  } catch (e) {
    results.push({ name: 'Migration Status', passed: false, error: e.message });
  }
  
  // Test 2: Generate SKU
  try {
    const sku = await fetch('/api/admin/sku/generate').then(r => r.json());
    results.push({
      name: 'SKU Generation',
      passed: sku.success && sku.sku,
      details: sku
    });
  } catch (e) {
    results.push({ name: 'SKU Generation', passed: false, error: e.message });
  }
  
  // Test 3: Validate SKU
  try {
    const validate = await fetch('/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'Aa1a01' })
    }).then(r => r.json());
    results.push({
      name: 'SKU Validation',
      passed: validate.valid === true,
      details: validate
    });
  } catch (e) {
    results.push({ name: 'SKU Validation', passed: false, error: e.message });
  }
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(60) + '\n');
  
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.passed ? 'PASS' : 'FAIL'}`);
    if (r.details) {
      console.log('   Details:', JSON.stringify(r.details, null, 2));
    }
    if (r.error) {
      console.log('   Error:', r.error);
    }
    console.log('');
  });
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\nTotal: ${passed}/${total} tests passed`);
  console.log('='.repeat(60) + '\n');
}

verifyDeployment();
```

---

## Verification Checklist

- [ ] Site is accessible (200 OK)
- [ ] Admin login works
- [ ] Migration status check works
- [ ] Test products deleted
- [ ] Migration completed successfully
- [ ] SKU generation returns Aa1a01
- [ ] SKU validation works correctly
- [ ] Test product created successfully
- [ ] Product appears in admin panel with SKU
- [ ] Product appears on homepage
- [ ] Sequential SKU generation works (Aa1a02)
- [ ] SKU collision detection works (409 error)

---

## Success! 🎉

If all tests pass:
1. Delete the test verification product
2. System is ready for frontend implementation (Phase 2)
3. First real product will use SKU: Aa1a01

---

## Troubleshooting

### "401 Unauthorized"
- Solution: Make sure you're logged in as admin
- Check: rogeridaho@gmail.com has role='admin'

### "SKU column already exists"
- This is OK - column was added already
- Verify with status check (Step 1)

### "Product creation fails"
- Check console for specific error
- Verify all required fields (sku, name, price)

### "SKU not incrementing"
- Check products actually have SKU values
- Verify migration completed successfully

# Deployment & Migration Verification Checklist

## Pre-Deployment Checks ✅

- [x] Step 1: SKU Generator implemented and tested
- [x] Step 2: Database schema updated
- [x] Step 3: SKU Generation API created
- [x] Step 4: Complete Product Creation API created
- [x] All code committed to git
- [x] Code pushed to GitHub main branch

---

## Deployment Steps

### 1. Verify Vercel Deployment

**Action:** Check Vercel dashboard
- URL: https://vercel.com/rwfraser/gemstone-earrings (or similar)
- Expected: Deployment triggered automatically from git push
- Status: Should show "Building" then "Ready"

**Verification:**
```
Visit: https://www.myearringadvisor.com
Expected: Site loads normally
```

### 2. Delete Test Products (Production Database)

**Option A: Via Drizzle Studio**
```bash
npm run db:studio
# Navigate to products table
# Delete all test products
```

**Option B: Via Vercel Postgres Dashboard**
```sql
-- Count current products
SELECT COUNT(*) FROM products;

-- View products to be deleted
SELECT id, name, created_at FROM products;

-- Delete all test products
DELETE FROM products;

-- Verify deletion
SELECT COUNT(*) FROM products;
-- Expected: 0
```

**Option C: Via Admin Interface (if available)**
- Navigate to Admin → Products
- Delete each test product manually

---

### 3. Run SKU Migration (Add Column & Constraints)

**Step 3.1: Check Migration Status**

Visit (while logged in as admin):
```
GET https://www.myearringadvisor.com/api/admin/backfill-skus
```

**Expected Response:**
```json
{
  "skuColumnExists": false,
  "message": "SKU column does not exist yet"
}
```

**Step 3.2: Run Migration**

Visit (while logged in as admin):
```
POST https://www.myearringadvisor.com/api/admin/backfill-skus
```

**Expected Response (Empty Database):**
```json
{
  "success": true,
  "message": "No products needed backfill. Constraints added.",
  "backfilled": 0
}
```

**Step 3.3: Verify Migration**

Check status again:
```
GET https://www.myearringadvisor.com/api/admin/backfill-skus
```

**Expected Response:**
```json
{
  "skuColumnExists": true,
  "columnInfo": {
    "column_name": "sku",
    "is_nullable": "NO",
    "data_type": "text"
  },
  "stats": {
    "total_products": 0,
    "products_with_sku": 0,
    "products_without_sku": 0
  },
  "skuRange": null,
  "needsBackfill": false
}
```

---

### 4. Test SKU Generation API

**Test 4.1: Generate First SKU**

```bash
curl -X GET https://www.myearringadvisor.com/api/admin/sku/generate \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "success": true,
  "sku": "Aa1a01",
  "validated": true
}
```

**Test 4.2: Validate SKU**

```bash
curl -X POST https://www.myearringadvisor.com/api/admin/sku/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"sku": "Aa1a01"}'
```

**Expected Response:**
```json
{
  "valid": true,
  "available": true,
  "message": "SKU is available"
}
```

---

### 5. Test Complete Product Creation API

**Test 5.1: Create Test Product**

```bash
curl -X POST https://www.myearringadvisor.com/api/admin/products/create-complete \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "sku": "Aa1a01",
    "name": "Test Earrings",
    "description": "Beautiful test earrings",
    "price": "29.99",
    "category": "Earrings",
    "stock": 5,
    "image1": "https://via.placeholder.com/400x400/9333ea/ffffff?text=Test+1",
    "image2": "https://via.placeholder.com/400x400/9333ea/ffffff?text=Test+2",
    "image3": "https://via.placeholder.com/400x400/9333ea/ffffff?text=Test+3",
    "image4": "https://via.placeholder.com/400x400/9333ea/ffffff?text=Test+4",
    "aiDescription": "These stunning earrings feature...",
    "aiKeywords": ["earrings", "jewelry", "gemstone"],
    "aiProcessedAt": "2026-02-23T17:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "product": {
    "id": "...",
    "sku": "Aa1a01",
    "name": "Test Earrings",
    ...
  },
  "message": "Product created successfully"
}
```

**Test 5.2: Verify Product Appears**

Visit:
```
https://www.myearringadvisor.com/products
```

**Expected:** Test product should be visible

**Test 5.3: Verify in Admin**

Visit:
```
https://www.myearringadvisor.com/admin/products
```

**Expected:** Product should show with SKU "Aa1a01"

---

### 6. Test Sequential SKU Generation

**Test 6.1: Generate Second SKU**

```bash
curl -X GET https://www.myearringadvisor.com/api/admin/sku/generate \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "success": true,
  "sku": "Aa1a02",
  "validated": true
}
```

**Verify:** SKU should increment from Aa1a01 → Aa1a02

---

### 7. Test SKU Collision Detection

**Test 7.1: Try to Create Product with Existing SKU**

```bash
curl -X POST https://www.myearringadvisor.com/api/admin/products/create-complete \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "sku": "Aa1a01",
    "name": "Duplicate Test",
    "price": "19.99",
    "stock": 1
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "error": "SKU already exists",
  "message": "This SKU is already assigned to another product"
}
```

---

## Verification Checklist

### Database

- [ ] SKU column exists in products table
- [ ] SKU column is NOT NULL
- [ ] SKU column has unique constraint
- [ ] Test products deleted
- [ ] New test product created with SKU

### API Endpoints

- [ ] GET /api/admin/sku/generate returns valid SKU
- [ ] POST /api/admin/sku/generate validates SKUs
- [ ] POST /api/admin/backfill-skus runs successfully
- [ ] POST /api/admin/products/create-complete creates products
- [ ] SKU collision detection works (409 error)

### SKU Generation

- [ ] First SKU is Aa1a01
- [ ] Sequential SKUs increment correctly
- [ ] Highest magnitude SKU is detected correctly
- [ ] SKU validation works

### Product Display

- [ ] Products show on homepage
- [ ] Products show in admin panel
- [ ] SKU is displayed in admin view
- [ ] All product fields are populated

---

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution:** SKU column was already added. Check status endpoint to verify.

### Issue: 401 Unauthorized on API calls
**Solution:** 
1. Make sure you're logged in as admin
2. Check that rogeridaho@gmail.com has role='admin'
3. Clear cookies and re-login

### Issue: SKU generation returns starting SKU when products exist
**Solution:** Check that products table actually has SKUs. Run:
```sql
SELECT COUNT(*), COUNT(sku) FROM products;
```

### Issue: Products created without AI data
**Solution:** This is expected with direct API calls. Frontend will handle AI processing.

---

## Post-Deployment

Once all checks pass:

1. [ ] Delete test product
2. [ ] Document first real SKU used
3. [ ] Ready for frontend implementation (Phase 2)
4. [ ] Update project status

---

## Success Criteria

✅ All tests passing
✅ Products can be created with SKUs
✅ SKUs increment sequentially
✅ No database errors
✅ Site remains functional

**Status:** Ready for production use!

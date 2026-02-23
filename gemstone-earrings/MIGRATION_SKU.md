# SKU Field Migration Instructions

## Overview
This migration adds a `sku` (Stock Keeping Unit) field to the `products` table. The SKU represents the physical storage location in format: `[Rack][Shelf][Tray][Bin][Item]` (e.g., `Aa1a01`).

## Migration Files
- **Schema Update**: `drizzle/schema.ts` (SKU field added)
- **Migration SQL**: `drizzle/migrations/0003_sticky_sentinel.sql`
- **Backfill Script**: `scripts/backfill-skus.ts`

## Important Notes
⚠️ **The generated migration will FAIL if products already exist** because it tries to add a NOT NULL column to a populated table.

## Migration Paths

### Option A: Production Database Has NO Products
If your production database is empty:

```bash
npm run db:push
```

This will apply the migration directly.

---

### Option B: Production Database Has Existing Products (RECOMMENDED)

#### Step 1: Check Product Count
Use Drizzle Studio or Vercel Postgres dashboard to check:
```sql
SELECT COUNT(*) FROM products;
```

#### Step 2: Modify Migration (ONE-TIME MANUAL PROCESS)

Since Drizzle's generated migration won't work with existing data, you'll need to apply this manually via Vercel Postgres dashboard or Drizzle Studio:

```sql
-- Step 1: Add column as nullable
ALTER TABLE products ADD COLUMN sku TEXT;

-- Step 2: Backfill SKUs for existing products
-- (This needs to be done via a temporary API endpoint or manually)
-- See "Backfill via API Endpoint" section below

-- Step 3: Make column NOT NULL and add unique constraint
ALTER TABLE products ALTER COLUMN sku SET NOT NULL;
ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
```

#### Step 3: Delete the Auto-Generated Migration
After manual application:
```bash
# Delete to prevent re-running
rm drizzle/migrations/0003_sticky_sentinel.sql
```

---

### Option C: Backfill via Temporary API Endpoint (SAFEST)

Create a one-time admin API endpoint to backfill SKUs:

**File**: `app/api/admin/backfill-skus/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { sql } from 'drizzle-orm';
import { SKUGenerator } from '@/lib/skuGenerator';

export async function POST(request: NextRequest) {
  // SECURITY: Only allow admin
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if SKU column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    // Add column if it doesn't exist
    if (columnCheck.rows.length === 0) {
      await db.execute(sql`ALTER TABLE products ADD COLUMN sku TEXT`);
    }

    // Get all products without SKUs
    const productsToUpdate = await db.execute(sql`
      SELECT id, name, created_at 
      FROM products 
      WHERE sku IS NULL
      ORDER BY created_at ASC
    `);

    if (productsToUpdate.rows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No products need SKU backfill' 
      });
    }

    // Determine starting SKU
    const existingSKUs = await db.execute(sql`
      SELECT sku FROM products WHERE sku IS NOT NULL
    `);

    let currentSKU: string;
    if (existingSKUs.rows.length === 0) {
      currentSKU = SKUGenerator.getStartingSKU();
    } else {
      const skus = existingSKUs.rows.map(r => r.sku as string);
      const highest = SKUGenerator.findHighestSKU(skus);
      if (!highest) {
        currentSKU = SKUGenerator.getStartingSKU();
      } else {
        const result = SKUGenerator.nextSKU(highest);
        if (!result.success) {
          throw new Error(result.error);
        }
        currentSKU = result.sku!;
      }
    }

    // Assign SKUs
    const assignments = [];
    for (const row of productsToUpdate.rows) {
      await db.execute(sql`
        UPDATE products 
        SET sku = ${currentSKU} 
        WHERE id = ${row.id}
      `);

      assignments.push({
        id: row.id,
        name: row.name,
        sku: currentSKU
      });

      const next = SKUGenerator.nextSKU(currentSKU);
      if (!next.success) {
        throw new Error(next.error);
      }
      currentSKU = next.sku!;
    }

    // Add constraints
    await db.execute(sql`
      ALTER TABLE products ALTER COLUMN sku SET NOT NULL
    `);
    await db.execute(sql`
      ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku)
    `);

    return NextResponse.json({
      success: true,
      backfilled: assignments.length,
      assignments: assignments
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({
      error: 'Backfill failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

Then call it:
```bash
# From browser or curl (while logged in as admin)
POST https://www.myearringadvisor.com/api/admin/backfill-skus
```

---

## Verification

After migration, verify:

```sql
-- Check SKU column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'sku';

-- Check all products have SKUs
SELECT COUNT(*) as total, COUNT(sku) as with_sku 
FROM products;

-- Check SKUs are unique
SELECT sku, COUNT(*) 
FROM products 
GROUP BY sku 
HAVING COUNT(*) > 1;

-- View assigned SKUs
SELECT sku, name, created_at 
FROM products 
ORDER BY created_at ASC;
```

---

## Rollback (If Needed)

```sql
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_unique;
ALTER TABLE products DROP COLUMN IF EXISTS sku;
```

---

## Next Steps After Migration

1. ✅ Schema updated
2. ✅ Migration applied
3. ✅ Existing products backfilled
4. ⏭️  Create SKU generation API endpoint
5. ⏭️  Update product creation workflow

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { SKUGenerator } from '@/lib/skuGenerator';

/**
 * Admin-only endpoint to backfill SKUs for existing products
 * This is a ONE-TIME migration endpoint
 * 
 * POST /api/admin/backfill-skus
 * 
 * Steps:
 * 1. Adds SKU column if it doesn't exist (nullable)
 * 2. Assigns sequential SKUs to all products without SKUs
 * 3. Makes SKU column NOT NULL and adds unique constraint
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow admin users
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('Starting SKU backfill...');

    // Check if SKU column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    // Add column if it doesn't exist
    if (columnCheck.rows.length === 0) {
      console.log('Adding SKU column...');
      await db.execute(sql`ALTER TABLE products ADD COLUMN sku TEXT`);
    } else {
      console.log('SKU column already exists');
    }

    // Get all products without SKUs, ordered by creation date
    const productsToUpdate = await db.execute(sql`
      SELECT id, name, created_at 
      FROM products 
      WHERE sku IS NULL
      ORDER BY created_at ASC
    `);

    if (productsToUpdate.rows.length === 0) {
      // Check if column needs constraints
      const constraintCheck = await db.execute(sql`
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'sku'
      `);

      const isNullable = constraintCheck.rows[0]?.is_nullable === 'YES';

      if (isNullable) {
        console.log('No products to backfill, but adding constraints...');
        await db.execute(sql`ALTER TABLE products ALTER COLUMN sku SET NOT NULL`);
        await db.execute(sql`
          ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku)
        `);
        
        return NextResponse.json({
          success: true,
          message: 'No products needed backfill. Constraints added.',
          backfilled: 0
        });
      }

      return NextResponse.json({
        success: true,
        message: 'No products need SKU backfill',
        backfilled: 0
      });
    }

    console.log(`Found ${productsToUpdate.rows.length} products to backfill`);

    // Determine starting SKU
    const existingSKUs = await db.execute(sql`
      SELECT sku FROM products WHERE sku IS NOT NULL
    `);

    let currentSKU: string;
    if (existingSKUs.rows.length === 0) {
      currentSKU = SKUGenerator.getStartingSKU();
      console.log(`Starting from beginning: ${currentSKU}`);
    } else {
      const skus = existingSKUs.rows.map(r => r.sku as string);
      const highest = SKUGenerator.findHighestSKU(skus);
      if (!highest) {
        currentSKU = SKUGenerator.getStartingSKU();
      } else {
        const result = SKUGenerator.nextSKU(highest);
        if (!result.success) {
          throw new Error(`Failed to generate next SKU after ${highest}: ${result.error}`);
        }
        currentSKU = result.sku!;
        console.log(`Continuing from: ${highest} → ${currentSKU}`);
      }
    }

    // Assign SKUs to all products
    const assignments = [];
    for (const row of productsToUpdate.rows) {
      await db.execute(sql`
        UPDATE products 
        SET sku = ${currentSKU} 
        WHERE id = ${row.id}
      `);

      assignments.push({
        id: row.id as string,
        name: row.name as string,
        sku: currentSKU
      });

      console.log(`  ${currentSKU} → ${row.name}`);

      // Generate next SKU
      const next = SKUGenerator.nextSKU(currentSKU);
      if (!next.success) {
        throw new Error(`Failed to generate next SKU after ${currentSKU}: ${next.error}`);
      }
      currentSKU = next.sku!;
    }

    // Add NOT NULL constraint and unique index
    console.log('Adding constraints...');
    await db.execute(sql`ALTER TABLE products ALTER COLUMN sku SET NOT NULL`);
    await db.execute(sql`
      ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku)
    `);

    console.log('✅ Backfill complete!');

    return NextResponse.json({
      success: true,
      message: 'SKU backfill completed successfully',
      backfilled: assignments.length,
      startingSKU: assignments[0]?.sku,
      endingSKU: assignments[assignments.length - 1]?.sku,
      nextAvailableSKU: currentSKU,
      assignments: assignments
    });

  } catch (error) {
    console.error('SKU backfill error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Backfill failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      note: 'You may need to manually rollback: ALTER TABLE products DROP COLUMN sku;'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check backfill status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    if (columnCheck.rows.length === 0) {
      return NextResponse.json({
        skuColumnExists: false,
        message: 'SKU column does not exist yet'
      });
    }

    // Get product counts (using CASE for broader compatibility)
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_products,
        COUNT(sku) as products_with_sku,
        COUNT(CASE WHEN sku IS NULL THEN 1 END) as products_without_sku
      FROM products
    `);

    // Get SKU range if any exist
    let skuRange = null;
    if (Number(stats.rows[0].products_with_sku) > 0) {
      const range = await db.execute(sql`
        SELECT MIN(sku) as lowest, MAX(sku) as highest
        FROM products
        WHERE sku IS NOT NULL
      `);
      skuRange = range.rows[0];
    }

    return NextResponse.json({
      skuColumnExists: true,
      columnInfo: columnCheck.rows[0],
      stats: stats.rows[0],
      skuRange: skuRange,
      needsBackfill: Number(stats.rows[0].products_without_sku) > 0
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

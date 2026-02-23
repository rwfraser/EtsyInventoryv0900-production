import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Fix SKU column constraints
 * Adds NOT NULL and UNIQUE constraints to existing SKU column
 * 
 * POST /api/admin/fix-sku-constraint
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

    console.log('Fixing SKU column constraints...');

    // Step 1: Check if column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    if (columnCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'SKU column does not exist',
        message: 'Run /api/admin/init-sku first'
      }, { status: 400 });
    }

    const isNullable = columnCheck.rows[0].is_nullable === 'YES';
    console.log(`Current nullable status: ${isNullable}`);

    // Step 2: Check if there are any products with NULL SKUs
    const nullCheck = await db.execute(sql`
      SELECT COUNT(*) as count FROM products WHERE sku IS NULL
    `);
    const nullCount = Number(nullCheck.rows[0]?.count || 0);

    if (nullCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot add NOT NULL constraint: ${nullCount} products have NULL SKUs`,
        message: 'Run /api/admin/backfill-skus first to assign SKUs to all products'
      }, { status: 400 });
    }

    const actions = [];

    // Step 3: Add NOT NULL constraint if needed
    if (isNullable) {
      console.log('Adding NOT NULL constraint...');
      await db.execute(sql`
        ALTER TABLE products ALTER COLUMN sku SET NOT NULL
      `);
      actions.push('Added NOT NULL constraint');
    } else {
      actions.push('NOT NULL constraint already exists');
    }

    // Step 4: Check if UNIQUE constraint exists
    const uniqueCheck = await db.execute(sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'products' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'products_sku_unique'
    `);

    if (uniqueCheck.rows.length === 0) {
      console.log('Adding UNIQUE constraint...');
      try {
        await db.execute(sql`
          ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE(sku)
        `);
        actions.push('Added UNIQUE constraint');
      } catch (error) {
        // Might fail if duplicate SKUs exist
        const dupCheck = await db.execute(sql`
          SELECT sku, COUNT(*) as count 
          FROM products 
          GROUP BY sku 
          HAVING COUNT(*) > 1
        `);
        
        if (dupCheck.rows.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'Cannot add UNIQUE constraint: duplicate SKUs found',
            duplicates: dupCheck.rows,
            message: 'Fix duplicate SKUs before adding UNIQUE constraint'
          }, { status: 400 });
        }
        throw error;
      }
    } else {
      actions.push('UNIQUE constraint already exists');
    }

    console.log('✅ Constraints fixed successfully');

    return NextResponse.json({
      success: true,
      message: 'SKU constraints verified and updated',
      actions: actions
    });

  } catch (error) {
    console.error('Constraint fix error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fix constraints',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check constraint status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check column info
    const columnCheck = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    if (columnCheck.rows.length === 0) {
      return NextResponse.json({
        columnExists: false,
        message: 'SKU column does not exist'
      });
    }

    // Check constraints
    const constraints = await db.execute(sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'products' 
        AND (constraint_name = 'products_sku_unique' OR constraint_type = 'UNIQUE')
    `);

    // Check for NULL values
    const nullCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM products WHERE sku IS NULL
    `);

    const isNullable = columnCheck.rows[0].is_nullable === 'YES';
    const hasUnique = constraints.rows.some(r => r.constraint_name === 'products_sku_unique');

    return NextResponse.json({
      columnExists: true,
      columnInfo: columnCheck.rows[0],
      isNullable: isNullable,
      hasUniqueConstraint: hasUnique,
      productsWithNullSKU: Number(nullCount.rows[0]?.count || 0),
      needsNotNull: isNullable,
      needsUnique: !hasUnique,
      readyForConstraints: Number(nullCount.rows[0]?.count || 0) === 0
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

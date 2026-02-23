import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * One-time initialization endpoint to add SKU column to products table
 * This is separate from backfill to handle the initial schema change
 * 
 * POST /api/admin/init-sku
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

    console.log('Initializing SKU column...');

    // Step 1: Check if column already exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    if (columnCheck.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'SKU column already exists',
        alreadyExists: true
      });
    }

    // Step 2: Check if there are any products
    const productCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM products
    `);
    const count = Number(productCount.rows[0]?.count || 0);

    if (count > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot add NOT NULL column to table with existing products',
        productCount: count,
        message: 'Please delete all products first, then run this endpoint again'
      }, { status: 400 });
    }

    // Step 3: Add SKU column with NOT NULL constraint (safe since table is empty)
    await db.execute(sql`
      ALTER TABLE products ADD COLUMN sku TEXT NOT NULL
    `);

    // Step 4: Add unique constraint
    await db.execute(sql`
      ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE(sku)
    `);

    console.log('✅ SKU column initialized successfully');

    return NextResponse.json({
      success: true,
      message: 'SKU column added successfully with NOT NULL and UNIQUE constraints',
      productCount: 0
    });

  } catch (error) {
    console.error('SKU initialization error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check if SKU column is initialized
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    if (columnCheck.rows.length === 0) {
      return NextResponse.json({
        initialized: false,
        message: 'SKU column does not exist'
      });
    }

    // Get product count
    const productCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM products
    `);

    return NextResponse.json({
      initialized: true,
      columnInfo: columnCheck.rows[0],
      productCount: Number(productCount.rows[0]?.count || 0)
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

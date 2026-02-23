import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { desc, sql } from 'drizzle-orm';
import { SKUGenerator } from '@/lib/skuGenerator';

/**
 * Generate the next available SKU
 * 
 * GET /api/admin/sku/generate
 * 
 * Returns the next sequential SKU based on:
 * 1. If database is empty: Returns starting SKU (Aa1a01)
 * 2. If products exist: Finds highest magnitude SKU and increments by 1
 * 3. Verifies uniqueness before returning
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication - only admins can generate SKUs
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get the most recent product (by creation date)
    const recentProducts = await db
      .select({ sku: products.sku, createdAt: products.createdAt })
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(1);

    let nextSKU: string;

    if (recentProducts.length === 0) {
      // Empty database - use starting SKU
      nextSKU = SKUGenerator.getStartingSKU();
      console.log('Database empty, using starting SKU:', nextSKU);
    } else {
      const mostRecentSKU = recentProducts[0].sku;
      
      // Get ALL SKUs to verify we have the highest magnitude
      const allSKUs = await db
        .select({ sku: products.sku })
        .from(products);
      
      const skuList = allSKUs.map(p => p.sku);
      const highestSKU = SKUGenerator.findHighestSKU(skuList);
      
      if (!highestSKU) {
        // Shouldn't happen, but fallback to starting SKU
        nextSKU = SKUGenerator.getStartingSKU();
        console.log('No valid SKUs found, using starting SKU:', nextSKU);
      } else {
        // Verify most recent is also highest magnitude
        if (mostRecentSKU !== highestSKU) {
          console.warn(
            `Most recent SKU (${mostRecentSKU}) is not highest magnitude (${highestSKU}). ` +
            `Using highest for next SKU.`
          );
        }
        
        // Generate next SKU after highest
        const result = SKUGenerator.nextSKU(highestSKU);
        if (!result.success) {
          return NextResponse.json(
            { 
              error: 'Failed to generate next SKU',
              details: result.error,
              currentHighest: highestSKU
            },
            { status: 500 }
          );
        }
        
        nextSKU = result.sku!;
        console.log(`Generated next SKU: ${highestSKU} → ${nextSKU}`);
      }
    }

    // Verify SKU doesn't already exist (collision check)
    const existing = await db
      .select({ sku: products.sku })
      .from(products)
      .where(sql`${products.sku} = ${nextSKU}`)
      .limit(1);

    if (existing.length > 0) {
      console.error('SKU collision detected:', nextSKU);
      return NextResponse.json(
        {
          error: 'SKU collision detected',
          sku: nextSKU,
          message: 'This SKU already exists in the database'
        },
        { status: 409 }
      );
    }

    // Return the next available SKU
    return NextResponse.json({
      success: true,
      sku: nextSKU,
      validated: true
    });

  } catch (error) {
    console.error('SKU generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate SKU',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate a specific SKU
 * 
 * POST /api/admin/sku/generate
 * Body: { sku: string }
 * 
 * Checks if a SKU is valid and available
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sku } = body;

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU is required' },
        { status: 400 }
      );
    }

    // Validate format
    const isValid = SKUGenerator.validateSKU(sku);
    if (!isValid) {
      return NextResponse.json({
        valid: false,
        available: false,
        error: 'Invalid SKU format'
      });
    }

    // Check availability
    const existing = await db
      .select({ sku: products.sku })
      .from(products)
      .where(sql`${products.sku} = ${sku}`)
      .limit(1);

    const available = existing.length === 0;

    return NextResponse.json({
      valid: true,
      available: available,
      message: available ? 'SKU is available' : 'SKU already exists'
    });

  } catch (error) {
    console.error('SKU validation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate SKU',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

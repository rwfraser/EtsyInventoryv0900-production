import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';

// Diagnostic endpoint to test product schema
export async function GET(request: NextRequest) {
  try {
    // Try to query products table to see schema
    const testProducts = await db.select().from(products).limit(1);
    
    // Try a minimal insert to test schema
    const testInsert = await db
      .insert(products)
      .values({
        name: 'TEST - Delete Me',
        price: '0.01',
        stock: 0,
      })
      .returning();

    // Clean up test product
    if (testInsert[0]) {
      await db.delete(products).where({ id: testInsert[0].id } as any);
    }

    return NextResponse.json({
      success: true,
      message: 'Schema test passed',
      sampleProduct: testProducts[0] || null,
      testInsert: testInsert[0],
    });
  } catch (error: any) {
    console.error('Schema test error:', error);
    return NextResponse.json(
      { 
        error: 'Schema test failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

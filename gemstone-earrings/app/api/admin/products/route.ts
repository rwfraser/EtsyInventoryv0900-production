import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';

export async function POST(request: NextRequest) {
  try {
    // Check if current user is admin
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { name, description, price, imageUrl, category, stock } = await request.json();

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Create product
    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        description: description || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        category: category || null,
        stock: parseInt(stock) || 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      product: newProduct,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

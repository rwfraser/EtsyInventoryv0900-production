import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if current user is admin
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const id = params.id;
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if current user is admin
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const id = params.id;
    const { name, description, price, imageUrl, category, stock } = await request.json();

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        name,
        description: description || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        category: category || null,
        stock: parseInt(stock) || 0,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if current user is admin
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const id = params.id;

    // Delete product
    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deletedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

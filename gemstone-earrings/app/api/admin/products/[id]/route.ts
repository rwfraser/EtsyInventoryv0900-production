import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { saveTempFile } from '@/lib/uploadUtils';

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
    
    // Extract form data for file uploads
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const category = formData.get('category') as string;
    const stock = formData.get('stock') as string;

    const image1File = formData.get('image1') as File | null;
    const image2File = formData.get('image2') as File | null;
    const image3File = formData.get('image3') as File | null;
    const image4File = formData.get('image4') as File | null;

    // Flags to keep existing images if not replaced
    const keepImage1 = formData.get('keepImage1') === 'true';
    const keepImage2 = formData.get('keepImage2') === 'true';
    const keepImage3 = formData.get('keepImage3') === 'true';
    const keepImage4 = formData.get('keepImage4') === 'true';

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Get existing product to preserve images if not replaced
    const [existingProduct] = await db.select().from(products).where(eq(products.id, id));
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Save new uploaded files or keep existing
    const image1Path = image1File && image1File.size > 0 
      ? await saveTempFile(image1File) 
      : (keepImage1 ? existingProduct.image1 : null);
    const image2Path = image2File && image2File.size > 0 
      ? await saveTempFile(image2File) 
      : (keepImage2 ? existingProduct.image2 : null);
    const image3Path = image3File && image3File.size > 0 
      ? await saveTempFile(image3File) 
      : (keepImage3 ? existingProduct.image3 : null);
    const image4Path = image4File && image4File.size > 0 
      ? await saveTempFile(image4File) 
      : (keepImage4 ? existingProduct.image4 : null);

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        name,
        description: description || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        category: category || null,
        image1: image1Path,
        image2: image2Path,
        image3: image3Path,
        image4: image4Path,
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

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { saveTempFile } from '@/lib/uploadUtils';

export async function POST(request: NextRequest) {
  try {
    // Check if current user is admin
    const session = await auth();
    
    console.log('Product creation attempt:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      isAdmin: session?.user?.role === 'admin',
    });
    
    if (!session || session.user.role !== 'admin') {
      console.error('Unauthorized product creation attempt:', {
        hasSession: !!session,
        role: session?.user?.role,
      });
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          debug: process.env.NODE_ENV === 'development' ? {
            hasSession: !!session,
            userRole: session?.user?.role,
          } : undefined
        },
        { status: 403 }
      );
    }

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

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Save uploaded files to temp storage (Vercel has read-only filesystem, this will fail)
    // TODO: Implement cloud storage (Vercel Blob, Cloudflare R2, or S3)
    let image1Path = null;
    let image2Path = null;
    let image3Path = null;
    let image4Path = null;
    
    try {
      if (image1File && image1File.size > 0) image1Path = await saveTempFile(image1File);
      if (image2File && image2File.size > 0) image2Path = await saveTempFile(image2File);
      if (image3File && image3File.size > 0) image3Path = await saveTempFile(image3File);
      if (image4File && image4File.size > 0) image4Path = await saveTempFile(image4File);
    } catch (uploadError) {
      console.error('File upload error (expected on Vercel):', uploadError);
      // Continue without uploaded files - admin can add image URLs manually
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
        image1: image1Path,
        image2: image2Path,
        image3: image3Path,
        image4: image4Path,
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

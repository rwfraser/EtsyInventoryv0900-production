import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveTempFile } from '@/lib/uploadUtils';

/**
 * Upload images to Vercel Blob storage
 * This is used during the preview step before product creation
 * 
 * POST /api/admin/upload-images
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Extract form data
    const formData = await request.formData();
    const image1File = formData.get('image1') as File | null;
    const image2File = formData.get('image2') as File | null;
    const image3File = formData.get('image3') as File | null;
    const image4File = formData.get('image4') as File | null;

    // Upload files to Vercel Blob storage
    const imageUrls: {
      image1?: string;
      image2?: string;
      image3?: string;
      image4?: string;
    } = {};

    if (image1File && image1File.size > 0) {
      imageUrls.image1 = await saveTempFile(image1File);
    }
    
    if (image2File && image2File.size > 0) {
      imageUrls.image2 = await saveTempFile(image2File);
    }
    
    if (image3File && image3File.size > 0) {
      imageUrls.image3 = await saveTempFile(image3File);
    }
    
    if (image4File && image4File.size > 0) {
      imageUrls.image4 = await saveTempFile(image4File);
    }

    return NextResponse.json({
      success: true,
      imageUrls,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload images',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { tryonSessions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Upload selfie and create try-on session
 * POST /api/tryon/upload
 * 
 * Body: FormData with 'selfie' file
 * Query params: ?sessionToken=xxx (optional, for guest users)
 * 
 * Returns: { sessionId, selfieUrl, expiresAt }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const selfieFile = formData.get('selfie') as File;
    
    if (!selfieFile) {
      return NextResponse.json(
        { error: 'No selfie file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!selfieFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (selfieFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get or generate session token
    const searchParams = request.nextUrl.searchParams;
    const sessionToken = searchParams.get('sessionToken') || crypto.randomUUID();

    // Upload to Vercel Blob
    const blob = await put(`tryon-selfies/${sessionToken}-${Date.now()}.jpg`, selfieFile, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create try-on session in database
    const [session] = await db.insert(tryonSessions).values({
      id: crypto.randomUUID(),
      sessionToken,
      selfieUrl: blob.url,
      status: 'pending',
      expiresAt,
      faceLandmarks: null, // Will be populated client-side or by render endpoint
    }).returning();

    console.log(`Try-on session created: ${session.id}`);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionToken: session.sessionToken,
      selfieUrl: blob.url,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Try-on upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload selfie',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Update try-on session with face landmarks
 * PATCH /api/tryon/upload
 * 
 * Body: { sessionId, faceLandmarks }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, faceLandmarks } = await request.json();

    if (!sessionId || !faceLandmarks) {
      return NextResponse.json(
        { error: 'Session ID and face landmarks are required' },
        { status: 400 }
      );
    }

    // Update session with detected face landmarks
    await db
      .update(tryonSessions)
      .set({
        faceLandmarks: JSON.stringify(faceLandmarks),
        status: 'completed',
      })
      .where(eq(tryonSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: 'Face landmarks saved',
    });
  } catch (error) {
    console.error('Face landmarks update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update face landmarks',
      },
      { status: 500 }
    );
  }
}

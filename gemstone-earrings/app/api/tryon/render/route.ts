import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy try-on render requests to the Python MediaPipe service.
 * 
 * POST /api/tryon/render
 * 
 * Forwards the multipart form (selfie + earring params) to TRYON_SERVICE_URL
 * and returns the composited JPEG image to the frontend.
 */

const TRYON_SERVICE_URL = process.env.TRYON_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate required fields
    const selfie = formData.get('selfie');
    const earringUrl = formData.get('earring_url');

    if (!selfie || !earringUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: selfie and earring_url' },
        { status: 400 }
      );
    }

    // Forward the entire form to the Python service
    const response = await fetch(`${TRYON_SERVICE_URL}/api/tryon/render`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Try-on service error' }));
      console.error('[TryOn Proxy] Service returned error:', response.status, errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Try-on rendering failed' },
        { status: response.status }
      );
    }

    // Return the JPEG image directly
    const imageBytes = await response.arrayBuffer();
    return new NextResponse(imageBytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[TryOn Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to try-on service' },
      { status: 502 }
    );
  }
}

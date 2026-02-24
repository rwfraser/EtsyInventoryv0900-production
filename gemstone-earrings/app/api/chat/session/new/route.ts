import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatSessions } from '@/drizzle/schema';

/**
 * Create a new chat session
 * POST /api/chat/session/new
 * 
 * Returns a session token that can be used for subsequent chat messages
 * Works for both authenticated users and guests
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : undefined;

    // Generate unique session token
    const sessionToken = crypto.randomUUID();

    // Create chat session
    const [chatSession] = await db
      .insert(chatSessions)
      .values({
        id: crypto.randomUUID(),
        userId,
        sessionToken,
        userAgent,
        ipAddress,
      })
      .returning();

    console.log('Created chat session:', chatSession.id);

    return NextResponse.json({
      success: true,
      sessionId: chatSession.id,
      sessionToken: chatSession.sessionToken,
      isGuest: !userId,
    });
  } catch (error) {
    console.error('Failed to create chat session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create chat session',
      },
      { status: 500 }
    );
  }
}

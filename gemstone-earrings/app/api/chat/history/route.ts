import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages, chatSessions } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Get chat conversation history
 * GET /api/chat/history?sessionToken=xxx
 * 
 * Returns all messages in a conversation
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionToken = searchParams.get('sessionToken');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      );
    }

    // Find session
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionToken, sessionToken))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get all messages for this session
    const messages = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        functionName: chatMessages.functionName,
        functionArgs: chatMessages.functionArgs,
        functionResult: chatMessages.functionResult,
        timestamp: chatMessages.timestamp,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, session.id))
      .orderBy(chatMessages.timestamp);

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      // Include function call details if present
      ...(msg.functionName && {
        functionCall: {
          name: msg.functionName,
          arguments: msg.functionArgs ? JSON.parse(msg.functionArgs) : null,
          result: msg.functionResult ? JSON.parse(msg.functionResult) : null,
        },
      }),
    }));

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      messageCount: formattedMessages.length,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Failed to get chat history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve chat history',
      },
      { status: 500 }
    );
  }
}

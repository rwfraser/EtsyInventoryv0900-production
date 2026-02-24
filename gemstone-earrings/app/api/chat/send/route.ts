import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages, chatSessions, chatAnalytics } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { sendChatCompletion, calculateCost } from '@/lib/chat/openai';
import { executeFunctionCall } from '@/lib/chat/functions';
import OpenAI from 'openai';

/**
 * Send a chat message and get AI response
 * POST /api/chat/send
 * 
 * Body:
 * {
 *   sessionToken: string;
 *   message: string;
 * }
 * 
 * Returns AI response, potentially with function calls executed
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionToken, message } = await request.json();

    if (!sessionToken || !message) {
      return NextResponse.json(
        { error: 'Session token and message are required' },
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

    // Save user message to database
    await db.insert(chatMessages).values({
      id: crypto.randomUUID(),
      sessionId: session.id,
      role: 'user',
      content: message,
    });

    // Get conversation history for context
    const history = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, session.id))
      .orderBy(chatMessages.timestamp);

    // Format messages for OpenAI
    const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      history.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

    // Get AI response
    let completion = await sendChatCompletion(conversationMessages);
    const responseMessage = completion.choices[0].message;

    // Handle function calls if present
    let finalResponse = responseMessage.content || '';
    let functionCallsExecuted: any[] = [];

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Execute each function call
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`Executing function: ${functionName}`, functionArgs);

        // Execute the function
        const functionResult = await executeFunctionCall(functionName, functionArgs);

        // Save function call to database
        await db.insert(chatMessages).values({
          id: crypto.randomUUID(),
          sessionId: session.id,
          role: 'function',
          content: JSON.stringify(functionResult),
          functionName,
          functionArgs: JSON.stringify(functionArgs),
          functionResult: JSON.stringify(functionResult),
        });

        functionCallsExecuted.push({
          name: functionName,
          arguments: functionArgs,
          result: functionResult,
        });

        // Add function result to conversation for follow-up
        conversationMessages.push({
          role: 'assistant',
          content: responseMessage.content,
          tool_calls: [toolCall],
        });

        conversationMessages.push({
          role: 'tool',
          content: JSON.stringify(functionResult),
          tool_call_id: toolCall.id,
        });
      }

      // Get follow-up response from GPT with function results
      completion = await sendChatCompletion(conversationMessages);
      finalResponse = completion.choices[0].message.content || '';
    }

    // Save assistant response to database
    await db.insert(chatMessages).values({
      id: crypto.randomUUID(),
      sessionId: session.id,
      role: 'assistant',
      content: finalResponse,
    });

    // Update session metadata
    await db
      .update(chatSessions)
      .set({
        lastMessageAt: new Date(),
        messageCount: sql`${chatSessions.messageCount} + 1`,
      })
      .where(eq(chatSessions.id, session.id));

    // Track analytics
    const apiCost = calculateCost(completion);
    
    // Extract products mentioned for analytics
    const productsViewed = functionCallsExecuted
      .filter(fc => fc.name === 'searchProducts' || fc.name === 'getProductDetails')
      .flatMap(fc => {
        if (fc.result.products) {
          return fc.result.products.map((p: any) => p.id);
        }
        if (fc.result.product) {
          return [fc.result.product.id];
        }
        return [];
      });

    const productsAddedToCart = functionCallsExecuted
      .filter(fc => fc.name === 'addToCart' && fc.result.success)
      .map(fc => fc.arguments.productId);

    // Create or update analytics
    await db.insert(chatAnalytics).values({
      id: crypto.randomUUID(),
      sessionId: session.id,
      productsViewed: productsViewed.length > 0 ? JSON.stringify(productsViewed) : null,
      productsAddedToCart: productsAddedToCart.length > 0 ? JSON.stringify(productsAddedToCart) : null,
      queryType: functionCallsExecuted.length > 0 ? 'product_search' : 'general',
      totalCostUsd: apiCost.toString(),
    });

    console.log(`Chat response sent. Cost: $${apiCost.toFixed(4)}`);

    return NextResponse.json({
      success: true,
      message: finalResponse,
      functionCalls: functionCallsExecuted.length > 0 ? functionCallsExecuted : undefined,
      metadata: {
        tokensUsed: completion.usage?.total_tokens,
        cost: apiCost,
      },
    });
  } catch (error) {
    console.error('Chat send error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

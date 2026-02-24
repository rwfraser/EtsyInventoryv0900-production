/**
 * Test script for Chat API
 * Run with: npx tsx scripts/test-chat-api.ts
 * 
 * Tests the complete chat flow:
 * 1. Create new session
 * 2. Send message
 * 3. Get chat history
 */

const API_BASE = 'http://localhost:3000'; // Change to production URL when testing live

async function testChatAPI() {
  console.log('🧪 Testing Chat API...\n');

  try {
    // Test 1: Create new session
    console.log('1️⃣  Creating new chat session...');
    const sessionResponse = await fetch(`${API_BASE}/api/chat/session/new`, {
      method: 'POST',
    });
    const sessionData = await sessionResponse.json();
    
    if (!sessionData.success) {
      throw new Error('Failed to create session');
    }
    
    console.log('✅ Session created:', {
      sessionId: sessionData.sessionId,
      sessionToken: sessionData.sessionToken,
      isGuest: sessionData.isGuest,
    });
    
    const { sessionToken } = sessionData;

    // Test 2: Send a simple message
    console.log('\n2️⃣  Sending test message...');
    const messageResponse = await fetch(`${API_BASE}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        message: 'Hello! Can you help me find earrings?',
      }),
    });
    const messageData = await messageResponse.json();
    
    if (!messageData.success) {
      throw new Error('Failed to send message: ' + messageData.error);
    }
    
    console.log('✅ AI Response:', messageData.message);
    console.log('   Tokens used:', messageData.metadata?.tokensUsed);
    console.log('   Cost: $' + messageData.metadata?.cost?.toFixed(4));

    // Test 3: Send a product search request
    console.log('\n3️⃣  Testing product search...');
    const searchResponse = await fetch(`${API_BASE}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        message: 'Show me ruby earrings under $100',
      }),
    });
    const searchData = await searchResponse.json();
    
    if (!searchData.success) {
      throw new Error('Failed to search: ' + searchData.error);
    }
    
    console.log('✅ AI Response:', searchData.message);
    if (searchData.functionCalls) {
      console.log('   Function calls executed:');
      searchData.functionCalls.forEach((fc: any) => {
        console.log(`     - ${fc.name}(${JSON.stringify(fc.arguments)})`);
        if (fc.result.products) {
          console.log(`       Found ${fc.result.products.length} products`);
        }
      });
    }

    // Test 4: Get conversation history
    console.log('\n4️⃣  Retrieving chat history...');
    const historyResponse = await fetch(
      `${API_BASE}/api/chat/history?sessionToken=${sessionToken}`
    );
    const historyData = await historyResponse.json();
    
    if (!historyData.success) {
      throw new Error('Failed to get history');
    }
    
    console.log('✅ History retrieved:');
    console.log(`   Messages: ${historyData.messageCount}`);
    historyData.messages.forEach((msg: any, i: number) => {
      console.log(`   ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });

    console.log('\n✅ All tests passed! 🎉');
    console.log('\nChat API is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testChatAPI()
  .then(() => {
    console.log('\n✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });

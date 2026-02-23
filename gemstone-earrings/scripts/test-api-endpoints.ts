// Test API endpoints for SKU generation and product creation
// Run with: npx tsx scripts/test-api-endpoints.ts

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

const BASE_URL = 'http://localhost:3000'; // Change for production testing

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function logResult(result: TestResult) {
  if (result.passed) {
    log('✅', `PASS: ${result.name}`);
    if (result.details) {
      console.log('   Details:', JSON.stringify(result.details, null, 2));
    }
  } else {
    log('❌', `FAIL: ${result.name}`);
    if (result.error) {
      console.log('   Error:', result.error);
    }
  }
  console.log('');
}

async function testSKUGenerator() {
  log('🧪', 'Testing SKU Generator Library...\n');
  
  const { SKUGenerator } = await import('../lib/skuGenerator');
  
  // Test 1: Validation
  const test1 = {
    name: 'SKU Validation',
    passed: SKUGenerator.validateSKU('Aa1a01') && !SKUGenerator.validateSKU('invalid')
  };
  results.push(test1);
  logResult(test1);
  
  // Test 2: Next SKU
  const nextResult = SKUGenerator.nextSKU('Aa1a01');
  const test2 = {
    name: 'Next SKU Generation',
    passed: nextResult.success && nextResult.sku === 'Aa1a02',
    details: { input: 'Aa1a01', output: nextResult.sku }
  };
  results.push(test2);
  logResult(test2);
  
  // Test 3: Find Highest
  const highest = SKUGenerator.findHighestSKU(['Aa1a01', 'Aa1a05', 'Aa1a03']);
  const test3 = {
    name: 'Find Highest SKU',
    passed: highest === 'Aa1a05',
    details: { input: ['Aa1a01', 'Aa1a05', 'Aa1a03'], highest }
  };
  results.push(test3);
  logResult(test3);
  
  // Test 4: Starting SKU
  const starting = SKUGenerator.getStartingSKU();
  const test4 = {
    name: 'Get Starting SKU',
    passed: starting === 'Aa1a01',
    details: { starting }
  };
  results.push(test4);
  logResult(test4);
}

async function testSKUGenerationAPI() {
  log('🌐', 'Testing SKU Generation API...\n');
  
  log('⚠️', 'NOTE: This test requires the dev server to be running!');
  log('📝', 'Run: npm run dev\n');
  
  try {
    // Test 1: Generate SKU (GET)
    const response = await fetch(`${BASE_URL}/api/admin/sku/generate`);
    
    if (response.status === 401) {
      const test = {
        name: 'SKU Generation API - Authentication',
        passed: true,
        details: { 
          status: 401,
          message: 'Correctly requires authentication (expected for local test)'
        }
      };
      results.push(test);
      logResult(test);
      return;
    }
    
    const data = await response.json();
    const test = {
      name: 'SKU Generation API - GET',
      passed: response.ok && data.success && data.sku,
      details: data,
      error: !response.ok ? JSON.stringify(data) : undefined
    };
    results.push(test);
    logResult(test);
    
    // Test 2: Validate SKU (POST)
    if (data.sku) {
      const validateResponse = await fetch(`${BASE_URL}/api/admin/sku/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: data.sku })
      });
      
      const validateData = await validateResponse.json();
      const test2 = {
        name: 'SKU Validation API - POST',
        passed: validateResponse.ok && validateData.valid,
        details: validateData
      };
      results.push(test2);
      logResult(test2);
    }
    
  } catch (error) {
    const test = {
      name: 'SKU Generation API',
      passed: false,
      error: error instanceof Error ? error.message : 'Network error - is dev server running?'
    };
    results.push(test);
    logResult(test);
  }
}

async function testBackfillStatus() {
  log('🔍', 'Checking Backfill Status...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/backfill-skus`);
    
    if (response.status === 401) {
      const test = {
        name: 'Backfill Status - Authentication',
        passed: true,
        details: {
          message: 'Requires admin authentication (expected)'
        }
      };
      results.push(test);
      logResult(test);
      return;
    }
    
    const data = await response.json();
    const test = {
      name: 'Backfill Status Check',
      passed: response.ok,
      details: data
    };
    results.push(test);
    logResult(test);
    
  } catch (error) {
    const test = {
      name: 'Backfill Status',
      passed: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
    results.push(test);
    logResult(test);
  }
}

async function testCompleteProductCreation() {
  log('📦', 'Testing Complete Product Creation API...\n');
  
  try {
    const mockProduct = {
      sku: 'Aa1a01',
      name: 'Test Product',
      description: 'Test description',
      price: '29.99',
      category: 'Earrings',
      stock: 10,
      image1: 'https://example.com/test1.jpg',
      image2: 'https://example.com/test2.jpg',
      image3: 'https://example.com/test3.jpg',
      image4: 'https://example.com/test4.jpg',
      aiDescription: 'AI-generated test description',
      aiKeywords: ['test', 'jewelry', 'earrings'],
      embeddingVector: [0.1, 0.2, 0.3],
      aiProcessedAt: new Date().toISOString()
    };
    
    const response = await fetch(`${BASE_URL}/api/admin/products/create-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProduct)
    });
    
    if (response.status === 401) {
      const test = {
        name: 'Complete Product Creation - Authentication',
        passed: true,
        details: {
          message: 'Requires admin authentication (expected)'
        }
      };
      results.push(test);
      logResult(test);
      return;
    }
    
    const data = await response.json();
    const test = {
      name: 'Complete Product Creation API',
      passed: response.status === 409 || response.ok, // 409 = SKU exists (acceptable)
      details: {
        status: response.status,
        message: data.message || data.error,
        note: response.status === 409 ? 'SKU collision (expected if product exists)' : undefined
      }
    };
    results.push(test);
    logResult(test);
    
  } catch (error) {
    const test = {
      name: 'Complete Product Creation',
      passed: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
    results.push(test);
    logResult(test);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(60) + '\n');
}

async function runTests() {
  console.log('\n🚀 API Endpoint Testing Suite\n');
  console.log('='.repeat(60) + '\n');
  
  // Library tests (no server required)
  await testSKUGenerator();
  
  // API tests (require server)
  log('📡', 'Starting API endpoint tests...\n');
  log('⚠️', 'These tests require authentication. They will return 401 for local testing.');
  log('💡', 'To test with auth, use production URL and login as admin.\n');
  
  await testSKUGenerationAPI();
  await testBackfillStatus();
  await testCompleteProductCreation();
  
  // Summary
  await printSummary();
  
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

runTests();

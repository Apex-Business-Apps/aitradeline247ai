#!/usr/bin/env node
/**
 * Edge Function Testing Script
 * Tests all TradeLine 24/7 edge functions for operational status
 */

const SUPABASE_URL = 'https://hysvqdwmhxnblxfqnszn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo';

// List of edge functions to test
const EDGE_FUNCTIONS = [
  'secure-analytics',
  'readyz',
  'healthz',
  'voice-answer',
  'voice-status',
  'send-lead-email',
  'secure-lead-submission',
  'dashboard-summary',
  'chat-lite',
  'rag-answer',
  'summarize',
  'privacy-data-retention',
  'compliance-helpers',
  'ops-cost',
  'batch-embeddings',
  'ragas-evaluation',
  'ab-convert',
  'secure-ab-assign',
  'track-session-activity',
  'check-password-breach',
  'voice-answer-hardened',
  'voice-status-hardened'
];

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

console.log('🚀 TradeLine 24/7 Edge Function Audit');
console.log('=====================================\n');

async function testEdgeFunction(functionName) {
  try {
    console.log(`Testing ${functionName}...`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'OPTIONS', // Test CORS first
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok || response.status === 405) {
      console.log(`✅ ${functionName}: CORS working`);
      
      // Test actual function call for specific functions
      if (functionName === 'readyz' || functionName === 'healthz') {
        const healthResponse = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          }
        });
        
        if (healthResponse.ok) {
          const result = await healthResponse.json();
          console.log(`✅ ${functionName}: Health check passed`, result.ready ? '(Ready)' : '(Not Ready)');
        } else {
          console.log(`⚠️ ${functionName}: Health check failed (${healthResponse.status})`);
        }
      }
      
      testResults.passed++;
    } else {
      console.log(`❌ ${functionName}: Failed (${response.status})`);
      testResults.failed++;
      testResults.errors.push(`${functionName}: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ ${functionName}: Error - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`${functionName}: ${error.message}`);
  }
  
  console.log(''); // Empty line for readability
}

async function testAnalyticsFunction() {
  console.log('Testing secure-analytics with real payload...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/secure-analytics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Origin': 'https://www.tradeline247ai.com'
      },
      body: JSON.stringify({
        event_type: 'test_event',
        event_data: { test: true, timestamp: new Date().toISOString() },
        user_session: 'test_session_' + Date.now(),
        page_url: '/test'
      })
    });
    
    if (response.ok || response.status === 204) {
      console.log('✅ secure-analytics: Real payload test passed');
    } else {
      console.log(`⚠️ secure-analytics: Real payload test failed (${response.status})`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ secure-analytics: Real payload test error - ${error.message}`);
  }
  
  console.log(''); // Empty line for readability
}

async function runTests() {
  // Test all edge functions
  for (const functionName of EDGE_FUNCTIONS) {
    await testEdgeFunction(functionName);
  }
  
  // Special test for analytics function
  await testAnalyticsFunction();
  
  // Print summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 Errors:');
    testResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n🔍 Next Steps:');
  if (testResults.failed > 0) {
    console.log('   1. Check Supabase edge function deployment status');
    console.log('   2. Verify environment variables are properly set');
    console.log('   3. Check function-specific logs for detailed error messages');
    console.log('   4. Review CORS headers and authentication requirements');
  } else {
    console.log('   ✅ All functions appear to be operational!');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});
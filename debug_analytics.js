#!/usr/bin/env node
/**
 * Analytics Debug Script
 * Helps diagnose analytics tracking issues
 */

const SUPABASE_URL = 'https://hysvqdwmhxnblxfqnszn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo';

console.log('🔍 TradeLine 24/7 Analytics Debug');
console.log('=================================\n');

async function testAnalyticsFunction() {
  console.log('1. Testing OPTIONS request (CORS)...');
  
  try {
    const optionsResponse = await fetch(`${SUPABASE_URL}/functions/v1/secure-analytics`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://www.tradeline247ai.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
    
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers:`);
    for (const [key, value] of optionsResponse.headers.entries()) {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`     ${key}: ${value}`);
      }
    }
    
    if (optionsResponse.ok) {
      console.log('   ✅ CORS preflight passed\n');
    } else {
      console.log('   ❌ CORS preflight failed\n');
      return;
    }
  } catch (error) {
    console.log(`   ❌ CORS test error: ${error.message}\n`);
    return;
  }

  console.log('2. Testing POST request with minimal payload...');
  
  try {
    const testPayload = {
      event_type: 'debug_test',
      event_data: { 
        test: true, 
        timestamp: new Date().toISOString(),
        debug_session: 'debug_' + Date.now()
      },
      user_session: 'debug_session_' + Date.now(),
      page_url: '/debug'
    };
    
    console.log(`   Payload: ${JSON.stringify(testPayload, null, 2)}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/secure-analytics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Origin': 'https://www.tradeline247ai.com'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`     ${key}: ${value}`);
    }
    
    const responseText = await response.text();
    if (responseText) {
      console.log(`   Response Body: ${responseText}`);
    }
    
    if (response.ok || response.status === 204) {
      console.log('   ✅ Analytics POST test passed\n');
    } else {
      console.log('   ❌ Analytics POST test failed\n');
    }
  } catch (error) {
    console.log(`   ❌ POST test error: ${error.message}\n`);
  }

  console.log('3. Testing with invalid origin...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/secure-analytics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Origin': 'https://malicious-site.com'
      },
      body: JSON.stringify({
        event_type: 'test_blocked',
        event_data: {}
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 403) {
      console.log('   ✅ Origin blocking working correctly\n');
    } else {
      console.log('   ⚠️ Origin blocking may not be working\n');
    }
  } catch (error) {
    console.log(`   ❌ Origin blocking test error: ${error.message}\n`);
  }

  console.log('4. Testing rate limiting...');
  
  try {
    const sessionId = 'rate_limit_test_' + Date.now();
    let requestCount = 0;
    let blockedCount = 0;
    
    console.log('   Sending 25 requests rapidly...');
    
    const promises = [];
    for (let i = 0; i < 25; i++) {
      promises.push(
        fetch(`${SUPABASE_URL}/functions/v1/secure-analytics`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Origin': 'https://www.tradeline247ai.com'
          },
          body: JSON.stringify({
            event_type: 'rate_limit_test',
            event_data: { request_number: i },
            user_session: sessionId,
            page_url: '/rate_limit_test'
          })
        }).then(response => {
          requestCount++;
          if (response.status === 429) {
            blockedCount++;
          }
          return { status: response.status, request: i };
        }).catch(error => {
          requestCount++;
          return { status: 'ERROR', request: i, error: error.message };
        })
      );
    }
    
    const results = await Promise.all(promises);
    
    console.log(`   Requests sent: ${requestCount}`);
    console.log(`   Rate limited (429): ${blockedCount}`);
    console.log(`   Success rate: ${((requestCount - blockedCount) / requestCount * 100).toFixed(1)}%`);
    
    if (blockedCount > 0) {
      console.log('   ✅ Rate limiting working\n');
    } else {
      console.log('   ⚠️ Rate limiting may not be working\n');
    }
  } catch (error) {
    console.log(`   ❌ Rate limiting test error: ${error.message}\n`);
  }
}

async function checkDatabaseFunction() {
  console.log('5. Checking database function...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/safe_analytics_insert_with_circuit_breaker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_event_type: 'database_test',
        p_event_data: { test: true, timestamp: new Date().toISOString() },
        p_user_session: 'db_test_' + Date.now(),
        p_page_url: '/db_test',
        p_ip_address: null,
        p_user_agent: 'Debug Script'
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    if (responseText) {
      console.log(`   Response: ${responseText}`);
    }
    
    if (response.ok) {
      console.log('   ✅ Database function accessible\n');
    } else {
      console.log('   ❌ Database function failed\n');
    }
  } catch (error) {
    console.log(`   ❌ Database function test error: ${error.message}\n`);
  }
}

async function runDiagnostics() {
  await testAnalyticsFunction();
  await checkDatabaseFunction();
  
  console.log('🎯 Diagnosis Complete');
  console.log('====================');
  console.log('Check the output above for any failed tests.');
  console.log('Common issues:');
  console.log('  - CORS configuration problems');
  console.log('  - Missing environment variables');
  console.log('  - Database function not deployed');
  console.log('  - Rate limiting too aggressive');
  console.log('  - Origin verification blocking legitimate requests');
}

runDiagnostics().catch(error => {
  console.error('💥 Diagnostic script failed:', error.message);
  process.exit(1);
});
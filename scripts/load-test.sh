#!/usr/bin/env bash
# Load Testing Script for TradeLine 24/7
# Tests critical endpoints under load

set -euo pipefail

# Configuration
PROJECT_URL="${PROJECT_URL:-https://hysvqdwmhxnblxfqnszn.supabase.co}"
CONCURRENT_USERS="${CONCURRENT_USERS:-10}"
DURATION="${DURATION:-60}"
RAMP_UP="${RAMP_UP:-10}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔥 TradeLine 24/7 Load Test"
echo "=================================="
echo "Target: $PROJECT_URL"
echo "Concurrent Users: $CONCURRENT_USERS"
echo "Duration: ${DURATION}s"
echo "Ramp-up: ${RAMP_UP}s"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 not found. Install from: https://k6.io/docs/get-started/installation/${NC}"
    echo "   brew install k6  # macOS"
    echo "   sudo apt install k6  # Ubuntu"
    exit 1
fi

# Create k6 test script
cat > /tmp/tl247-load-test.js <<'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: `${__ENV.RAMP_UP}s`, target: parseInt(__ENV.CONCURRENT_USERS) },
    { duration: `${__ENV.DURATION}s`, target: parseInt(__ENV.CONCURRENT_USERS) },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'], // Less than 5% errors
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.PROJECT_URL;

export default function () {
  // Test 1: Health check
  let res = http.get(`${BASE_URL}/functions/v1/healthz`);
  check(res, {
    'healthz status 200': (r) => r.status === 200,
    'healthz response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 2: Landing page (simulated)
  res = http.get(`${BASE_URL}/`);
  check(res, {
    'landing page loads': (r) => r.status === 200 || r.status === 404, // 404 ok for function endpoint
  }) || errorRate.add(1);

  sleep(2);

  // Test 3: RAG search (public endpoint)
  const ragPayload = JSON.stringify({
    query: 'What are your business hours?',
    top_k: 5
  });
  
  res = http.post(`${BASE_URL}/functions/v1/rag-search`, ragPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(res, {
    'RAG search responds': (r) => r.status === 200 || r.status === 401, // 401 ok if auth required
    'RAG search time < 3s': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1);

  sleep(3);
}

export function handleSummary(data) {
  return {
    '/tmp/tl247-load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
EOF

# Run the test
echo -e "${YELLOW}⏳ Starting load test...${NC}"
echo ""

export PROJECT_URL
export CONCURRENT_USERS
export DURATION
export RAMP_UP

k6 run /tmp/tl247-load-test.js

# Check results
if [ -f /tmp/tl247-load-test-summary.json ]; then
    echo ""
    echo -e "${GREEN}✅ Load test complete!${NC}"
    echo ""
    echo "Summary:"
    cat /tmp/tl247-load-test-summary.json | grep -E '"http_req_duration":|"http_req_failed":|"errors":' | head -10
    echo ""
    echo "Full results: /tmp/tl247-load-test-summary.json"
else
    echo -e "${RED}❌ Load test failed - no summary generated${NC}"
    exit 1
fi

# Cleanup
rm -f /tmp/tl247-load-test.js

echo ""
echo -e "${GREEN}🎯 Recommendations:${NC}"
echo "  - P95 latency should be < 2s"
echo "  - Error rate should be < 5%"
echo "  - Monitor Supabase dashboard during peak load"
echo "  - Check edge function logs for errors"

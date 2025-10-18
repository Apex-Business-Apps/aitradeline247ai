#!/usr/bin/env bash
# predeploy-security.sh
# Blocks deployment if insecure Twilio bypass is enabled in production

set -e

echo "🔒 Running predeploy security checks..."

# Check 1: Twilio webhook bypass must not be enabled in production
if [ "${NODE_ENV}" = "production" ] && [ "${ALLOW_INSECURE_TWILIO_WEBHOOKS}" = "true" ]; then
  echo "❌ SECURITY: ALLOW_INSECURE_TWILIO_WEBHOOKS must not be true in production"
  echo "   This would allow unauthenticated webhook access and is a critical security risk."
  exit 1
fi

echo "✅ Twilio webhook security: PASS"
echo "✅ All predeploy security checks passed"

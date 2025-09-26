#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://www.tradeline247ai.com}"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/voice/answer" -H "Content-Type: application/x-www-form-urlencoded" --data "CallSid=CAx&From=%2B15550000000&To=%2B15877428885")
echo "HTTP $code"; test "$code" = "403" && echo "✅ Webhook locked"
#!/usr/bin/env bash
# tradeline247ai.com — production acceptance sweep (PWA/SEO/JSON-LD/health)
set -euo pipefail
BASE="https://www.tradeline247ai.com"

pass=true

echo "== HEAD =="
curl -fsS -I "$BASE/" | head -n1 || { echo "FAIL: HEAD"; pass=false; }

echo "== healthz =="
curl -fsS "$BASE/healthz" || { echo "FAIL: /healthz"; pass=false; }

echo "== readyz =="
if ! curl -fsS "$BASE/readyz" >/dev/null; then
  echo "WARN: /readyz not OK (non-blocking)"
fi

echo "== robots.txt contains sitemap → www =="
curl -fsS "$BASE/robots.txt" | tee /tmp/robots.txt >/dev/null
grep -q "https://www.tradeline247ai.com/sitemap.xml" /tmp/robots.txt || { echo "FAIL: robots sitemap host"; pass=false; }

echo "== sitemap.xml domain entries =="
curl -fsS "$BASE/sitemap.xml" | tee /tmp/sitemap.xml >/dev/null
grep -q "https://www.tradeline247ai.com/" /tmp/sitemap.xml || { echo "FAIL: sitemap host"; pass=false; }

echo "== PWA icon 192 =="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/assets/brand/App_Icons/icon-192.png")
[ "$code" = "200" ] || { echo "FAIL: icon-192 status $code"; pass=false; }

echo "== manifest link present on / =="
curl -fsS "$BASE/" | tee /tmp/index.html >/dev/null
grep -qi "manifest.webmanifest" /tmp/index.html || { echo "FAIL: manifest link missing"; pass=false; }

echo "== fetch manifest and confirm icons =="
mf=$(sed -n 's/.*href="\([^"]*manifest\.webmanifest\)".*/\1/p' /tmp/index.html | head -n1)
[ -n "$mf" ] || { echo "FAIL: manifest href parse"; pass=false; }
curl -fsS "$BASE/${mf#/}" | tee /tmp/manifest.webmanifest >/dev/null
grep -q '"icons"' /tmp/manifest.webmanifest || { echo "FAIL: manifest missing icons"; pass=false; }

echo "== JSON-LD Organization present on / =="
grep -q '"@type":"Organization"' /tmp/index.html || { echo "FAIL: JSON-LD not found in HTML"; pass=false; }

if $pass; then
  echo "✅ ACCEPTANCE: PASS"
  exit 0
else
  echo "❌ ACCEPTANCE: FAIL"
  exit 1
fi
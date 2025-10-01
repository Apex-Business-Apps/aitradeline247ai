# Guardian Health Model — Phase G1

**Status:** Specification Only  
**Date:** 2025-10-01  
**Project:** TradeLine 24/7 Backend Guardian System

---

## Overview

This document specifies the health check endpoints for the TradeLine 24/7 backend infrastructure. These endpoints enable automated monitoring, self-diagnosis, and orchestrated healing actions.

---

## Health Endpoints

### 1. Liveness Endpoint: `/healthz`

**Purpose:** Indicates whether the application process is running and responsive.

**HTTP Method:** `GET`

**Success Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T00:00:00.000Z",
  "service": "tradeline247-backend",
  "uptime": 3600
}
```

**HTTP Status:** `200 OK`

**Failure Response:**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-01T00:00:00.000Z",
  "service": "tradeline247-backend",
  "error": "Service unresponsive"
}
```

**HTTP Status:** `503 Service Unavailable`

**Success Conditions:**
- Application process is running
- Event loop is not blocked (response within 500ms)
- Memory usage < 90% of available heap
- No unhandled exceptions in last 60 seconds

**Failure Thresholds:**
- No response within 2 seconds
- Memory usage ≥ 95% of available heap
- More than 10 unhandled exceptions in last 60 seconds
- Event loop lag > 5 seconds

---

### 2. Readiness Endpoint: `/readyz`

**Purpose:** Indicates whether the application is ready to accept traffic and handle requests.

**HTTP Method:** `GET`

**Success Response:**
```json
{
  "status": "ready",
  "timestamp": "2025-10-01T00:00:00.000Z",
  "service": "tradeline247-backend",
  "checks": {
    "database": "healthy",
    "edge_functions": "healthy",
    "storage": "healthy",
    "external_integrations": "healthy"
  },
  "dependencies": {
    "supabase": "connected",
    "twilio": "available",
    "resend": "available",
    "openai": "available"
  }
}
```

**HTTP Status:** `200 OK`

**Failure Response:**
```json
{
  "status": "not_ready",
  "timestamp": "2025-10-01T00:00:00.000Z",
  "service": "tradeline247-backend",
  "checks": {
    "database": "unhealthy",
    "edge_functions": "degraded",
    "storage": "healthy",
    "external_integrations": "degraded"
  },
  "dependencies": {
    "supabase": "timeout",
    "twilio": "unavailable",
    "resend": "available",
    "openai": "rate_limited"
  },
  "failing_components": ["database", "twilio", "openai"]
}
```

**HTTP Status:** `503 Service Unavailable`

**Success Conditions:**

1. **Database (Supabase):**
   - Connection pool has available connections
   - Test query executes within 100ms
   - No connection errors in last 30 seconds

2. **Edge Functions:**
   - All critical functions deployable
   - Function cold start < 3 seconds
   - No deployment failures in last 5 minutes

3. **Storage:**
   - Storage bucket accessible
   - Read/write operations functional
   - No quota exceeded errors

4. **External Integrations:**
   - Twilio API reachable (test call within 500ms)
   - Resend API reachable (test email validation within 300ms)
   - OpenAI API reachable (test prompt within 1 second)

**Failure Thresholds:**

1. **Critical Failures (immediate not_ready):**
   - Database connection fails for 3 consecutive attempts
   - More than 50% of edge functions unreachable
   - Storage quota exceeded (>95% capacity)

2. **Degraded State Triggers:**
   - Any external integration timeout > 3 seconds
   - Database query latency > 500ms (p95)
   - Edge function cold start > 5 seconds

3. **Dependency-Specific Thresholds:**
   - **Supabase:** Connection timeout > 2 seconds, 3 failures in 60 seconds
   - **Twilio:** API response time > 1 second, 5 failures in 300 seconds
   - **Resend:** API response time > 1 second, 5 failures in 300 seconds
   - **OpenAI:** Rate limit hit or timeout > 3 seconds

---

## Health Check Behavior

### Response Time Requirements
- **Liveness (`/healthz`):** Must respond within 500ms under normal load
- **Readiness (`/readyz`):** Must respond within 2 seconds (includes dependency checks)

### Caching Strategy
- Health check results cached for 10 seconds to prevent check storms
- Cache invalidated immediately on detected state change
- Independent cache per endpoint

### Logging Requirements
- All health check requests logged at `DEBUG` level
- State transitions (healthy → unhealthy) logged at `WARN` level
- Failure patterns logged at `ERROR` level with context

### Security Considerations
- Health endpoints accessible without authentication (public monitoring)
- Sensitive dependency details (API keys, credentials) excluded from responses
- Rate limiting: 10 requests per second per IP for health endpoints

---

## Integration Points

### 1. Monitoring Systems
- Prometheus metrics exposed at `/metrics`
- Health status exported as `service_health_status` gauge
- Dependency status exported as `dependency_health_status{dependency="name"}` gauge

### 2. Load Balancers / Orchestrators
- Liveness check determines if pod/container should be restarted
- Readiness check determines if traffic should be routed to instance

### 3. Alerting Systems
- Failed liveness check triggers immediate PagerDuty/alert
- Failed readiness check triggers warning notification
- Prolonged degraded state (>5 minutes) triggers investigation alert

---

## Success Criteria Summary

**Liveness Success:**
- ✅ Process responds within 500ms
- ✅ Memory usage < 90%
- ✅ No critical exceptions
- ✅ Event loop responsive

**Readiness Success:**
- ✅ Database connection healthy
- ✅ All critical edge functions operational
- ✅ Storage accessible
- ✅ External integrations responsive (<1s response time)
- ✅ All dependency checks pass

**Failure Handling:**
- ❌ Liveness failure → Trigger restart (see GUARDIAN_AUTOHEAL.md)
- ❌ Readiness failure → Remove from load balancer rotation
- ❌ Dependency degraded → Enable circuit breaker (see GUARDIAN_CIRCUITBREAKER.md)

---

## Next Steps

1. **Phase G2:** Define synthetic check scheduling and concurrency controls
2. **Phase G3:** Specify auto-heal actions for each failure scenario
3. **Phase G4:** Design circuit breakers for external dependencies
4. **Phase G5:** Compile final acceptance report

---

**End of Phase G1 Specification**

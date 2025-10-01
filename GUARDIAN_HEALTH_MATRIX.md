# Phase GG1 — Health Matrix Confirmation

## Verification Date
2025-10-01

## Purpose
Confirm health endpoint definitions and thresholds match specifications. Map all checks to explicit green/red conditions without implementation.

---

## Health Endpoints Overview

| Endpoint | Purpose | Timeout | Expected Response Time |
|----------|---------|---------|----------------------|
| `/healthz` | Liveness probe | 2s | < 500ms |
| `/readyz` | Readiness probe | 5s | < 1000ms |

---

## `/healthz` — Liveness Check Matrix

### Purpose
Determines if the application process is alive and should not be restarted.

### Checks Performed

| Check ID | Check Name | Description | Green Condition | Red Condition |
|----------|-----------|-------------|-----------------|---------------|
| LV-01 | Process Responsive | HTTP server responds | 200 OK within 500ms | No response or timeout > 2s |
| LV-02 | Memory Threshold | Heap usage under limit | Heap < 85% of max | Heap ≥ 85% of max |
| LV-03 | Event Loop Lag | Node.js event loop responsive | Lag < 100ms | Lag ≥ 100ms |
| LV-04 | Critical Crash Detection | No unhandled exceptions in last 60s | Zero crashes | ≥ 1 crash detected |

### Response Format

#### Success Response (200 OK)
```json
{
  "status": "ok",
  "timestamp": "2025-10-01T00:00:00.000Z",
  "checks": {
    "process": "responsive",
    "memory": "healthy",
    "event_loop": "healthy",
    "crashes": "none"
  },
  "uptime_seconds": 86400
}
```

#### Failure Response (503 Service Unavailable)
```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-01T00:00:00.000Z",
  "checks": {
    "process": "responsive",
    "memory": "healthy",
    "event_loop": "degraded",
    "crashes": "none"
  },
  "failures": [
    {
      "check": "event_loop",
      "value": 125,
      "threshold": 100,
      "unit": "ms"
    }
  ],
  "uptime_seconds": 86400
}
```

### Failure Thresholds

| Threshold Type | Value | Action |
|----------------|-------|--------|
| Single check failure | N/A | 503 response, no restart |
| Consecutive failures | 3 in a row | Trigger restart |
| Consecutive timeout | 3 in a row | Trigger restart |
| Memory critical | Heap ≥ 95% | Immediate restart |

### Recovery Actions

| Failure Condition | Immediate Action | Auto-Heal Action |
|-------------------|------------------|------------------|
| Event loop lag | Log warning | Monitor for 3 consecutive failures |
| Memory degraded (85-95%) | Log warning, trigger GC | Monitor for 3 consecutive failures |
| Memory critical (≥95%) | Emergency alert | Immediate restart |
| 3 consecutive failures | Alert on-call | Restart worker process |

---

## `/readyz` — Readiness Check Matrix

### Purpose
Determines if the application can handle traffic and all critical dependencies are operational.

### Checks Performed

| Check ID | Check Name | Description | Green Condition | Red Condition |
|----------|-----------|-------------|-----------------|---------------|
| RD-01 | Database Connection | PostgreSQL reachable | Query executes < 200ms | Timeout or error |
| RD-02 | Database Pool Health | Connection pool available | Available conns ≥ 2 | Available conns < 2 |
| RD-03 | Authentication Service | Supabase Auth reachable | Health check 200 OK | 4xx/5xx or timeout |
| RD-04 | Storage Service | Supabase Storage reachable | Health check 200 OK | 4xx/5xx or timeout |
| RD-05 | Edge Functions | Core functions deployable | Status check passes | Deployment errors |
| RD-06 | External API - OpenAI | Circuit not open | Breaker closed or half-open | Breaker open |
| RD-07 | External API - Twilio | Circuit not open | Breaker closed or half-open | Breaker open |
| RD-08 | External API - Resend | Circuit not open | Breaker closed or half-open | Breaker open |
| RD-09 | Rate Limit Health | Not hitting global limits | Request rate < 80% | Request rate ≥ 80% |
| RD-10 | Configuration Valid | All required env vars set | All present and valid | Missing or invalid |

### Response Format

#### Success Response (200 OK)
```json
{
  "status": "ready",
  "timestamp": "2025-10-01T00:00:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 45,
      "pool_available": 8
    },
    "auth": {
      "status": "healthy",
      "response_time_ms": 120
    },
    "storage": {
      "status": "healthy",
      "response_time_ms": 95
    },
    "edge_functions": {
      "status": "healthy"
    },
    "external_apis": {
      "openai": "healthy",
      "twilio": "healthy",
      "resend": "healthy"
    },
    "rate_limits": {
      "status": "healthy",
      "utilization_pct": 42
    },
    "configuration": {
      "status": "valid"
    }
  }
}
```

#### Failure Response (503 Service Unavailable)
```json
{
  "status": "not_ready",
  "timestamp": "2025-10-01T00:00:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 45,
      "pool_available": 8
    },
    "auth": {
      "status": "healthy",
      "response_time_ms": 120
    },
    "storage": {
      "status": "degraded",
      "response_time_ms": 2400,
      "error": "timeout"
    },
    "edge_functions": {
      "status": "healthy"
    },
    "external_apis": {
      "openai": "circuit_open",
      "twilio": "healthy",
      "resend": "healthy"
    },
    "rate_limits": {
      "status": "healthy",
      "utilization_pct": 42
    },
    "configuration": {
      "status": "valid"
    }
  },
  "failures": [
    {
      "check": "storage",
      "reason": "timeout",
      "threshold": "1000ms"
    },
    {
      "check": "openai_circuit",
      "reason": "circuit_breaker_open",
      "open_since": "2025-10-01T00:00:00.000Z"
    }
  ]
}
```

### Failure Thresholds

| Check | Warning Threshold | Critical Threshold | Action |
|-------|-------------------|-------------------|--------|
| Database response time | > 500ms | > 2000ms | Log warning / Remove from load balancer |
| Database pool | < 5 available | < 2 available | Scale pool / Alert |
| Auth service | 3 consecutive 5xx | 5 consecutive 5xx | Circuit breaker |
| Storage service | 3 consecutive 5xx | 5 consecutive 5xx | Circuit breaker |
| External API | 5 consecutive failures | 10 consecutive failures | Open circuit breaker |
| Rate limit utilization | > 70% | > 90% | Throttle / Alert |

### Recovery Actions

| Failure Condition | Immediate Action | Auto-Heal Action |
|-------------------|------------------|------------------|
| Database timeout | Remove from LB pool | Retry after 10s |
| Database pool exhausted | Alert DBA | Scale pool up |
| Auth/Storage degraded | Enable fallback mode | Monitor for recovery |
| External API circuit open | Use cached data | Half-open probe after 60s |
| Rate limit warning | Enable throttling | Backoff requests |
| Configuration invalid | Alert ops team | Prevent deployment |

---

## Health Check Integration Points

### Load Balancer Configuration

```yaml
# Conceptual LB config (no actual implementation)
health_checks:
  liveness:
    path: /healthz
    interval: 10s
    timeout: 2s
    healthy_threshold: 2
    unhealthy_threshold: 3
    
  readiness:
    path: /readyz
    interval: 15s
    timeout: 5s
    healthy_threshold: 2
    unhealthy_threshold: 2
```

### Monitoring Integration

| System | Metric | Alert Threshold |
|--------|--------|----------------|
| Datadog | `healthz.response_time` | > 500ms |
| Datadog | `healthz.failure_rate` | > 5% over 5min |
| Datadog | `readyz.response_time` | > 1000ms |
| Datadog | `readyz.failure_rate` | > 10% over 5min |
| PagerDuty | `healthz.consecutive_failures` | ≥ 3 |
| PagerDuty | `readyz.critical_dependency_down` | Any critical dep |

---

## Decision Matrix: Restart vs Alert

| Scenario | /healthz | /readyz | Action |
|----------|----------|---------|--------|
| Process responsive, all deps healthy | ✅ 200 | ✅ 200 | Normal operation |
| High memory (85%), deps healthy | ⚠️ 503 | ✅ 200 | Alert, no restart yet |
| High memory (95%), deps healthy | ❌ 503 | ✅ 200 | **Restart immediately** |
| Process healthy, DB timeout | ✅ 200 | ❌ 503 | Remove from LB, no restart |
| Process healthy, OpenAI circuit open | ✅ 200 | ⚠️ 503 | Degrade gracefully, no restart |
| 3 consecutive /healthz failures | ❌ 503 | ❌ 503 | **Restart worker** |
| Event loop lag > 100ms (3x) | ❌ 503 | ✅ 200 | **Restart worker** |

---

## Caching Strategy

### /healthz Caching
- **Cache TTL**: 5 seconds
- **Rationale**: Liveness checks are high-frequency; caching prevents overhead
- **Cache Key**: `healthz:status:v1`
- **Invalidation**: On any critical metric change

### /readyz Caching
- **Cache TTL**: 10 seconds
- **Rationale**: Readiness checks involve external calls; caching reduces load
- **Cache Key**: `readyz:status:v1`
- **Invalidation**: On dependency state change

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Information disclosure | No sensitive data in health responses |
| Health endpoint abuse | Rate limit: 60 req/min per IP |
| Unauthorized access | Public endpoints, but no actions exposed |
| Timing attacks | Consistent response times regardless of internal state |

---

## Logging Requirements

### Health Check Success (Info Level)
```json
{
  "level": "info",
  "endpoint": "/healthz",
  "status": 200,
  "response_time_ms": 45,
  "checks_passed": 4,
  "checks_failed": 0,
  "timestamp": "2025-10-01T00:00:00.000Z"
}
```

### Health Check Failure (Warning Level)
```json
{
  "level": "warning",
  "endpoint": "/readyz",
  "status": 503,
  "response_time_ms": 2100,
  "checks_passed": 8,
  "checks_failed": 2,
  "failures": [
    "storage_timeout",
    "openai_circuit_open"
  ],
  "timestamp": "2025-10-01T00:00:00.000Z"
}
```

### Critical Failure (Error Level)
```json
{
  "level": "error",
  "endpoint": "/healthz",
  "status": 503,
  "consecutive_failures": 3,
  "action": "restart_initiated",
  "failures": [
    "event_loop_lag_critical"
  ],
  "timestamp": "2025-10-01T00:00:00.000Z"
}
```

---

## Validation Checklist

| Item | Status | Notes |
|------|--------|-------|
| /healthz checks defined | ✅ | 4 checks: process, memory, event loop, crashes |
| /readyz checks defined | ✅ | 10 checks: DB, auth, storage, functions, APIs, rate limits, config |
| Green conditions specified | ✅ | All checks have explicit success criteria |
| Red conditions specified | ✅ | All checks have explicit failure criteria |
| Failure thresholds documented | ✅ | Single, consecutive, and critical thresholds |
| Response formats defined | ✅ | JSON schemas for 200 and 503 responses |
| Recovery actions documented | ✅ | Immediate and auto-heal actions specified |
| Caching strategy defined | ✅ | 5s for /healthz, 10s for /readyz |
| Security mitigations listed | ✅ | Rate limiting, no sensitive data exposure |
| Logging requirements specified | ✅ | Info, warning, error levels defined |
| Integration points identified | ✅ | LB, monitoring, alerting systems |

---

## Status: ✅ HEALTH MATRIX CONFIRMED

**Date:** 2025-10-01  
**Next Phase:** GG2 - Synthetic Schedule & Concurrency Plan

All health checks, thresholds, and conditions have been mapped. Green/red criteria are explicit and align with the Guardian Health specification. No implementation changes made—verification only.

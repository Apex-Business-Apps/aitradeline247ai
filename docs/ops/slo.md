# Service Level Objectives (SLO) — v2.0.0

**Last Updated**: 2025-10-10  
**Status**: PRODUCTION  
**Team**: Ops + Dev

## Uptime Target

**Monthly Uptime**: **99.5%** (three nines five)

This translates to:
- **Maximum downtime per month**: ~3.6 hours
- **Maximum downtime per week**: ~50 minutes
- **Maximum downtime per day**: ~7 minutes

## Error Budget

**Monthly error budget**: 0.5% = **216 minutes** (3.6 hours)

### How We Consume Error Budget

Error budget is consumed when:
1. **Voice calls fail** (voice-answer returns 5xx or Twilio cannot reach webhook)
2. **SMS messages not delivered** (status = "failed" in Twilio)
3. **Evidence dashboard shows red tiles** for >15 minutes
4. **Critical edge functions return 5xx** for >1 minute
5. **Database connection failures** (Supabase RLS/API errors)

### Error Budget Alerts

Alerts fire when **50% of error budget consumed** in current 30-day window:
- **Warning**: 50% consumed (108 minutes downtime)
- **Critical**: 75% consumed (162 minutes downtime)
- **Page Ops**: 90% consumed (194 minutes downtime)

## Health Endpoints

### Primary Health Check
**URL**: `https://tradeline247ai.com/`  
**Method**: GET  
**Expected**: HTTP 200 + HTML content  
**Frequency**: Every 60 seconds (external monitoring)

### Voice Health Check
**URL**: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-voice-health`  
**Method**: POST  
**Auth**: Admin JWT required  
**Expected**: JSON with `{ "status": "healthy", "last_call_within_15m": true }`  
**Frequency**: Every 5 minutes (internal cron)

### SMS Health Check
**URL**: `/ops/twilio-evidence` (UI dashboard)  
**Method**: Visual inspection (3 green tiles)  
**Expected**: SMS inbound, SMS delivered, Voice answer all green in last 15 minutes  
**Frequency**: Manual check + automated tile monitoring

### Database Health Check
**Query**: `SELECT 1 FROM call_logs LIMIT 1`  
**Expected**: Returns row within 500ms  
**Frequency**: Every 60 seconds (Supabase built-in monitoring)

## SLO Metrics Dashboard

### Key Metrics Tracked

1. **Voice Call Success Rate**
   - Target: ≥99.5% of calls successfully answered
   - Measured: `COUNT(call_sid WHERE status IN ('initiated','completed')) / COUNT(call_sid)`
   - Query:
     ```sql
     SELECT 
       COUNT(*) FILTER (WHERE status IN ('initiated','completed')) * 100.0 / COUNT(*) as success_rate
     FROM call_logs
     WHERE started_at > NOW() - INTERVAL '30 days';
     ```

2. **SMS Delivery Rate**
   - Target: ≥99.0% of SMS delivered successfully
   - Measured: `COUNT(message_sid WHERE status='delivered') / COUNT(message_sid WHERE status!='failed')`
   - Query:
     ```sql
     SELECT 
       COUNT(*) FILTER (WHERE status='delivered') * 100.0 / COUNT(*) as delivery_rate
     FROM sms_reply_logs
     WHERE created_at > NOW() - INTERVAL '30 days';
     ```

3. **Webhook Response Time (P95)**
   - Target: ≤2 seconds for voice-answer
   - Target: ≤1 second for SMS webhooks
   - Measured: Supabase Edge Function logs (execution_time_ms)

4. **Evidence Tile Health**
   - Target: All 3 tiles green ≥99.5% of time
   - Measured: Minutes with green tiles / total minutes
   - Manual tracking via `/ops/twilio-evidence`

## Alert Configuration

### Critical Alerts (Page Ops)

1. **Voice webhook down >5 minutes**
   - Trigger: No `call_logs` rows with `started_at` in last 5 minutes AND test call fails
   - Action: Page on-call ops + auto-rollback to last known good deployment

2. **SMS webhook down >5 minutes**
   - Trigger: No `sms_reply_logs` rows with `created_at` in last 5 minutes AND test SMS fails
   - Action: Page on-call ops + check Twilio webhook config

3. **Database connection failure**
   - Trigger: `SELECT 1` query fails for >1 minute
   - Action: Page on-call ops + escalate to Supabase support

4. **Error budget >90% consumed**
   - Trigger: Cumulative downtime ≥194 minutes in 30-day window
   - Action: Page on-call ops + escalate to CTO

### Warning Alerts (Slack/Email)

1. **Voice call success rate <99.5%** in last hour
2. **SMS delivery rate <99.0%** in last hour
3. **Webhook response time P95 >3 seconds** for voice-answer
4. **Evidence tile red for >5 minutes**
5. **Error budget >50% consumed** in 30-day window

## Incident Response

### Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|------------|---------------|----------|
| **P0 - Critical** | Complete service outage | <5 minutes | All webhooks down, database unavailable |
| **P1 - High** | Major feature broken | <30 minutes | Voice calls failing, SMS not delivering |
| **P2 - Medium** | Minor feature degraded | <2 hours | Evidence tile red, slow webhook response |
| **P3 - Low** | Cosmetic issue | <24 hours | UI bug, typo in email |

### Rollback Procedure

If SLO breach detected:
1. **Immediate**: Revert to last known good deployment (Git tag)
2. **Within 15 minutes**: Verify green tiles on `/ops/twilio-evidence`
3. **Within 30 minutes**: Post-mortem started (Slack thread)
4. **Within 24 hours**: Root cause analysis completed + prevention plan

## SLO Review Cadence

- **Weekly**: Review error budget consumption + alert trends
- **Monthly**: SLO attainment report (did we hit 99.5%?)
- **Quarterly**: Adjust SLO target based on actuals (consider 99.9% if we consistently beat 99.5%)

## Exclusions (Maintenance Windows)

Scheduled maintenance windows do **NOT** count against SLO:
- Must be announced ≥7 days in advance
- Limited to off-peak hours (Sunday 2am-4am ET)
- Maximum 1 maintenance window per month
- Maximum 2 hours per window

## Data Retention

SLO metrics retained for:
- **Raw data**: 90 days
- **Aggregated hourly**: 1 year
- **Monthly summaries**: 3 years

## References

- Twilio webhook checklist: `docs/ops/twilio-webhooks-checklist.md`
- Evidence dashboard: `/ops/twilio-evidence`
- Voice health function: `supabase/functions/ops-voice-health/index.ts`
- Smoke tests: `docs/ops/smoke-v2.0.0.md`

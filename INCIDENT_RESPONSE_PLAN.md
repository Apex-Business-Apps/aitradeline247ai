# Incident Response Plan - TradeLine 24/7

## 🚨 Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P0 - Critical** | Complete service outage, data breach, security compromise | 15 minutes | Immediate - All hands |
| **P1 - High** | Major feature down, significant user impact | 1 hour | Eng Lead + On-call |
| **P2 - Medium** | Minor feature degradation, limited user impact | 4 hours | On-call engineer |
| **P3 - Low** | Cosmetic issues, no user impact | Next business day | Standard support |

## 🔐 Security Incidents

### Data Breach (P0)
1. **Immediate Actions** (0-15 min):
   - Isolate affected systems
   - Revoke compromised credentials via Supabase dashboard
   - Enable maintenance mode if needed
   - Notify security team: security@tradeline247ai.com

2. **Containment** (15-60 min):
   - Identify breach scope using `security_alerts` table
   - Review `data_access_audit` logs
   - Check Supabase auth logs: [Auth Logs](https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/auth/users)

3. **Remediation**:
   - Rotate encryption keys using `ops-init-encryption-key`
   - Force password resets for affected users
   - Review and update RLS policies
   - Run security linter: `supabase db lint`

4. **Communication**:
   - Notify affected users within 72 hours (PIPEDA requirement)
   - Document in `audit_logs` table
   - File incident report

### Authentication Issues (P1)
- Check `analytics_events` for `auth_failed` events
- Review rate limiting in `hotline_rate_limit_ip`
- Verify Supabase auth providers: [Providers](https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/auth/providers)

## 📞 Voice/SMS Service Outages

### Complete Voice Outage (P0)
1. **Verify Twilio Status**: https://status.twilio.com
2. **Check Edge Functions**:
   ```bash
   # Check voice-frontdoor logs
   curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/healthz
   ```
3. **Review Call Lifecycle**:
   ```sql
   SELECT * FROM call_lifecycle 
   WHERE status = 'failed' 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```
4. **Fallback**: Enable Twilio Studio fallback routing

### SMS Delivery Issues (P1)
1. Check `sms_status` events in `analytics_events`
2. Review sender reputation in Twilio console
3. Verify A2P registration status
4. Check SMS delivery dashboard: `/sms-delivery-dashboard`

## 💾 Database Issues

### Connection Pool Exhaustion (P1)
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill long-running queries (admin only)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
AND state_change < now() - interval '10 minutes';
```

### Slow Queries (P2)
- Review `pooledQuery` logs in Edge Functions
- Check Supabase database logs
- Run `EXPLAIN ANALYZE` on suspect queries

## 🔄 Rollback Procedures

### Edge Function Rollback
```bash
# Supabase handles versioning automatically
# Redeploy previous version via dashboard
```

### Database Migration Rollback
```bash
# Migrations are in supabase/migrations/
# Create a new migration to reverse changes
# NEVER manually edit production database
```

### Frontend Rollback
```bash
# Via GitHub
git revert <commit-hash>
git push origin main
# Auto-deploys via Lovable
```

## 📊 Monitoring Dashboards

- **Security**: `/security-monitoring` (admin only)
- **SMS Health**: `/sms-delivery-dashboard`
- **Voice Health**: `/ops/voice-health`
- **Analytics**: Use `get_security_dashboard_data()` RPC

## 🔧 Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Security Lead | security@tradeline247ai.com | 24/7 |
| Engineering | info@tradeline247ai.com | Business hours |
| Twilio Support | Twilio Console | 24/7 |
| Supabase Support | Supabase Dashboard | 24/7 |

## 📝 Post-Incident

1. **Document** in `audit_logs`:
   ```sql
   INSERT INTO audit_logs (action, target, payload)
   VALUES ('incident_resolved', 'P0-2025-01-14', jsonb_build_object(
     'duration_minutes', 45,
     'root_cause', 'Description',
     'remediation', 'Actions taken'
   ));
   ```

2. **Review**:
   - Schedule post-mortem within 48 hours
   - Update runbooks if needed
   - Implement preventive measures

3. **Communicate**:
   - Send status update to affected users
   - Update status page
   - File compliance reports if required

## 🛡️ Prevention

- Run security scans weekly: `npm run security:scan`
- Review `security_alerts` daily
- Test backups monthly
- Conduct incident drills quarterly
- Keep dependencies updated
- Monitor error budgets

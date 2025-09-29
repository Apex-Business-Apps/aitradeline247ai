# Severity Matrix

## Severity Levels

### Severity 1 (Critical)
**Definition**: Complete service outage or critical functionality failure

**Examples**:
- All incoming calls failing
- Authentication system down
- Database completely inaccessible
- Payment processing failures

**Response**:
- Immediate page to on-call engineer
- Customer notification within 15 minutes
- All hands response if needed
- Escalate to CEO if not resolved in 30 minutes

**Resolution Target**: 60 minutes

---

### Severity 2 (High)
**Definition**: Significant degradation or partial outage

**Examples**:
- Call quality issues affecting >10% of users
- Email delivery delays
- Dashboard loading slowly
- Intermittent API errors

**Response**:
- On-call engineer response within 15 minutes
- Customer notification for widespread issues
- Engineering team standup if resolution unclear

**Resolution Target**: 4 hours

---

### Severity 3 (Medium)
**Definition**: Minor issues with workarounds available

**Examples**:
- Documentation errors
- Non-critical feature bugs
- Performance issues affecting <5% of users
- Cosmetic UI issues

**Response**:
- Standard business hours response
- Include in next sprint planning
- Internal notification only

**Resolution Target**: 24 hours

---

## Owner Assignments

### Severity 1
- **Primary**: CTO/DevOps Lead
- **Secondary**: Senior Engineer
- **Communications**: Customer Success Manager
- **Escalation**: CEO

### Severity 2
- **Primary**: On-call Engineer
- **Secondary**: Engineering Manager
- **Communications**: Support Team Lead

### Severity 3
- **Primary**: Development Team
- **Triage**: Product Manager
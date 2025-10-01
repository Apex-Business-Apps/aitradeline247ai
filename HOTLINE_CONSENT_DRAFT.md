# Phase HS2 — Consent Copy (EN + FR-CA)

## Objective
Provide Canada-compliant caller consent and opt-out wording for call handling, recording, and data use.

## Legal Context

### Canadian Requirements (PIPEDA/PIPA)
- Express consent required for call recording
- Clear opt-out mechanism must be provided
- Purpose of data collection must be stated
- Consent must be obtained BEFORE recording begins

### Compliance Standards
- **PIPEDA** (Federal): Personal Information Protection and Electronic Documents Act
- **PIPA** (Alberta): Personal Information Protection Act
- **CRTC** (CASL): Anti-spam and telemarketing rules

## Live Call Consent Script

### English (EN)

#### Initial Greeting + Consent
```
Thank you for calling [Business Name].

This call may be monitored and recorded for quality assurance and training purposes.

We use call data to improve our service and respond to your inquiry.

To continue with your call and consent to recording, press 1 now.

To opt out of recording and speak with an agent without recording, press 9.

If you do not make a selection, your call will not be recorded.
```

#### DTMF Response Paths
```
[User presses 1]
→ "Thank you for your consent. Connecting you now."
→ [Enable recording, proceed to IVR menu]

[User presses 9]
→ "Understood. Your call will not be recorded. Connecting you to an agent."
→ [Disable recording, connect to agent]

[No input within 10 seconds]
→ "No selection detected. Your call will proceed without recording."
→ [Disable recording, proceed to IVR menu]
```

### French Canadian (FR-CA)

#### Initial Greeting + Consent
```
Merci d'avoir appelé [Nom de l'entreprise].

Cet appel peut être surveillé et enregistré à des fins d'assurance qualité et de formation.

Nous utilisons les données d'appel pour améliorer notre service et répondre à votre demande.

Pour continuer votre appel et consentir à l'enregistrement, appuyez sur 1 maintenant.

Pour refuser l'enregistrement et parler à un agent sans enregistrement, appuyez sur 9.

Si vous ne faites pas de sélection, votre appel ne sera pas enregistré.
```

#### DTMF Response Paths
```
[L'utilisateur appuie sur 1]
→ "Merci de votre consentement. Connexion en cours."
→ [Activer l'enregistrement, passer au menu IVR]

[L'utilisateur appuie sur 9]
→ "Compris. Votre appel ne sera pas enregistré. Connexion à un agent."
→ [Désactiver l'enregistrement, connecter à l'agent]

[Aucune entrée dans les 10 secondes]
→ "Aucune sélection détectée. Votre appel se poursuivra sans enregistrement."
→ [Désactiver l'enregistrement, passer au menu IVR]
```

## Voicemail Consent Script

### English (EN)

```
You've reached the voicemail for [Business Name].

This system records messages for business purposes.

By leaving a message, you consent to the recording and storage of your voice and contact information.

We use your message to respond to your inquiry and improve our service.

If you do not wish to consent, please hang up now or call back during business hours.

Please leave your message after the tone.
```

### French Canadian (FR-CA)

```
Vous avez joint la messagerie vocale de [Nom de l'entreprise].

Ce système enregistre les messages à des fins commerciales.

En laissant un message, vous consentez à l'enregistrement et au stockage de votre voix et de vos coordonnées.

Nous utilisons votre message pour répondre à votre demande et améliorer notre service.

Si vous ne souhaitez pas consentir, veuillez raccrocher maintenant ou rappeler pendant les heures d'ouverture.

Veuillez laisser votre message après le bip sonore.
```

## Data Use Purpose Statement

### One-Sentence Purpose (Plain Language)

**English:**
> We record and store call information to help us respond to your inquiry, improve service quality, train our team, and comply with legal requirements.

**French Canadian:**
> Nous enregistrons et conservons les informations d'appel pour répondre à votre demande, améliorer la qualité du service, former notre équipe et respecter les exigences légales.

### Detailed Data Use (Optional Expansion)

**What we collect:**
- Voice recording (if consented)
- Phone number (ANI)
- Call duration and timestamp
- DTMF selections (menu choices)
- Transcript of conversation (AI-generated)

**How we use it:**
- Respond to customer inquiries
- Train customer service AI models
- Quality assurance and compliance monitoring
- Legal/regulatory compliance (e.g., dispute resolution)

**How long we keep it:**
- Active call recordings: 90 days
- Transcripts (anonymized): 1 year
- Metadata (anonymized): Indefinite

**Your rights:**
- Access your data (request a copy)
- Request deletion (subject to legal retention)
- Withdraw consent (affects future calls only)
- File a complaint with the Privacy Commissioner of Canada

## Implementation Guidelines

### Timing Requirements
1. **Consent MUST be obtained BEFORE recording starts**
2. **Minimum 10 seconds** for user to respond to consent prompt
3. **Default to NO recording** if no input received
4. **Repeat consent prompt once** if no input after 10 seconds, then proceed without recording

### Recording State Management

```typescript
// Pseudocode for consent handling
interface ConsentState {
  consentGiven: boolean;
  recordingEnabled: boolean;
  consentTimestamp?: Date;
  optOutReason?: 'explicit' | 'no_input';
}

// Example state transitions
const handleDTMF = (digit: string): ConsentState => {
  if (digit === '1') {
    return {
      consentGiven: true,
      recordingEnabled: true,
      consentTimestamp: new Date()
    };
  } else if (digit === '9') {
    return {
      consentGiven: false,
      recordingEnabled: false,
      optOutReason: 'explicit'
    };
  } else {
    return {
      consentGiven: false,
      recordingEnabled: false,
      optOutReason: 'no_input'
    };
  }
};
```

### TwiML Example (Reference Only)

```xml
<!-- Consent Prompt -->
<Gather numDigits="1" timeout="10" action="/hotline/consent-response">
  <Say language="en-CA">
    Thank you for calling. This call may be monitored and recorded 
    for quality assurance. Press 1 to consent, or 9 to opt out.
  </Say>
</Gather>

<!-- No Input Fallback -->
<Say>No selection detected. Your call will proceed without recording.</Say>
<Redirect>/hotline/ivr-menu?recording=false</Redirect>
```

## Audit & Compliance Logging

### Required Log Fields
For each consent interaction, log:
- `call_sid`: Twilio call identifier
- `consent_timestamp`: ISO 8601 timestamp
- `consent_action`: `'granted'`, `'declined'`, or `'no_input'`
- `dtmf_digit`: User's key press (1, 9, or null)
- `recording_enabled`: Boolean flag
- `language`: `'en'` or `'fr-CA'`
- `consent_prompt_played`: Boolean (proof of disclosure)

### Sample Log Entry
```json
{
  "event_type": "consent_captured",
  "call_sid": "CA1234567890abcdef",
  "consent_timestamp": "2025-01-31T14:23:45.123Z",
  "consent_action": "granted",
  "dtmf_digit": "1",
  "recording_enabled": true,
  "language": "en",
  "consent_prompt_played": true,
  "ip_address": "192.0.2.1",
  "ani_hash": "sha256:abc123..."
}
```

## Opt-Out Honoring

### Immediate Effects
- Recording MUST be disabled for the current call
- Call proceeds normally without recording
- Transcript generation MAY continue (for real-time routing only, not stored)

### Persistent Opt-Out (Future Enhancement)
If caller opts out repeatedly, consider:
- Storing ANI (hashed) with opt-out preference
- Auto-skip consent prompt on future calls from same number
- Respect opt-out for minimum 12 months

## Testing Checklist

Before going live:
- [ ] Consent prompt plays in both EN and FR-CA
- [ ] DTMF 1 enables recording
- [ ] DTMF 9 disables recording and proceeds to agent
- [ ] No input after 10 seconds defaults to NO recording
- [ ] Voicemail prompt clearly states recording policy
- [ ] All consent events logged to database
- [ ] Recording start happens AFTER consent is granted
- [ ] Opt-out callers can still complete their inquiry

## Approval Status

**Current Status:** ⏳ **PENDING APPROVAL**

**Required Approvals:**
- [ ] Legal counsel review (PIPEDA/PIPA compliance)
- [ ] Business owner approval (consent language)
- [ ] Privacy officer sign-off (data retention policy)

**Approval Date:** _____________

**Approved By:** _____________

---

## Status: DRAFT ✅
**Date:** 2025-01-31  
**Phase:** HS2  
**Recording Settings:** NOT ENABLED (per instructions)  
**Next Phase:** HS3 - Abuse guard tabletop

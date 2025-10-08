-- Create organization membership for owner
INSERT INTO organization_members (org_id, user_id, role)
VALUES (
  '2492cf4d-8e41-4984-a7b8-238493b81d8a',
  '07af8d7a-7566-45fe-afc3-da70f9e0b642',
  'owner'
)
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Grant admin role to owner
INSERT INTO user_roles (user_id, role)
VALUES (
  '07af8d7a-7566-45fe-afc3-da70f9e0b642',
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Update organization settings with voice config
UPDATE organizations
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(settings, '{}'::jsonb),
      '{forward_target_e164}',
      '"+14319900222"'
    ),
    '{transcript_email}',
    '"jrmendozaceo@apexbusiness-systems.com"'
  ),
  '{environment}',
  '"staging"'
)
WHERE id = '2492cf4d-8e41-4984-a7b8-238493b81d8a';

-- Upsert voice_config (organization_id is the PK)
INSERT INTO voice_config (
  organization_id,
  system_prompt,
  llm_voice,
  pickup_mode,
  rings_before_pickup,
  amd_enable,
  fail_open,
  llm_enabled,
  human_number_e164,
  business_name
)
VALUES (
  '2492cf4d-8e41-4984-a7b8-238493b81d8a',
  'You are TradeLine 24/7 — Your 24/7 AI Receptionist! Be warm, concise (≤15s per reply), on-task. Canadian English. Capture: name, callback number, email, job summary, preferred date/time. Confirm back. Offer to connect to a human on request/urgent. If human unreachable, take a message. Never invent data; read numbers digit-by-digit.',
  'alloy',
  'after_rings',
  3,
  true,
  true,
  true,
  '+14319900222',
  'TradeLine 24/7'
)
ON CONFLICT (organization_id) DO UPDATE
SET 
  system_prompt = EXCLUDED.system_prompt,
  pickup_mode = EXCLUDED.pickup_mode,
  rings_before_pickup = EXCLUDED.rings_before_pickup,
  human_number_e164 = EXCLUDED.human_number_e164,
  business_name = EXCLUDED.business_name,
  updated_at = now();
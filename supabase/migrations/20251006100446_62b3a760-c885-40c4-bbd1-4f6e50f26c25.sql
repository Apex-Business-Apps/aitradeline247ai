-- Create default organization if none exists
INSERT INTO organizations (id, name, slug, settings)
SELECT 
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'TradeLine 24/7',
  'tradeline247',
  '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- Create the Relaunch Canada campaign
INSERT INTO campaigns (
  id,
  organization_id,
  name,
  subject,
  body_template,
  status,
  consent_basis_filter
) VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM organizations LIMIT 1),
  'Relaunch — Canada',
  'Can I ask you something quick?',
  'Hey {{first_name}},

Can I ask you something quick?

I''m reaching out because we''re helping Canadian businesses automate their phone lines with AI receptionists. Would you be open to a 5-minute chat?

If so, grab a spot: {{booking_link}}

Thanks!

{{unsubscribe_link}}',
  'draft',
  ARRAY['express']
) ON CONFLICT (id) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_template = EXCLUDED.body_template,
  updated_at = NOW();
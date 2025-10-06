-- Upsert campaign template V2 for Relaunch — Canada
DO $$
DECLARE
  v_campaign_id uuid;
  v_org_id uuid := '2492cf4d-8e41-4984-a7b8-238493b81d8a';
  v_subject text := 'Can I ask you something quick?';
  v_body text := 'Hi {{first_name}},

How''s business going? 
I hope I didn''t catch you at a bad time

I''m Adeline. I work with owner-operators like you. Curious—what''s your plan when two calls hit at once or it''s past closing? Do you want those to book themselves, or would that create more hassle?

TradeLine 24/7 answers every call, personalized to sound like you or however you want, books jobs, and emails a clean transcript and a "breakfast brief" every morning, so nothing gets lost after hours. Always, with you in the loop of course.

We are not offering to replace any of your current systems or staff, we''re here to help you enhance it, so your business reaches its full potential. We''re Canadian built and part of the community. We are offering a free trial period, so you can feel us out before you make any decisions. 

• 14-day free trial, cancel anytime
• Canadian hosting (no offshore)
• 10-minute setup
• Paid only when we book you a job

Up for a quick 10-minute walkthrough? {{booking_link}}
If now''s a bad time, tell me a better one and I''ll work around you.

Unsubscribe: {{unsubscribe_link}}
Reason for contact: your business email/phone is publicly listed for customer inquiries.';
BEGIN
  -- Check if campaign exists
  SELECT id INTO v_campaign_id 
  FROM public.campaigns 
  WHERE name = 'Relaunch — Canada' 
  LIMIT 1;

  IF v_campaign_id IS NULL THEN
    -- Insert new campaign
    INSERT INTO public.campaigns (
      organization_id,
      name,
      subject,
      body_template,
      consent_basis_filter,
      status
    ) VALUES (
      v_org_id,
      'Relaunch — Canada',
      v_subject,
      v_body,
      ARRAY['express']::text[],
      'draft'
    );
  ELSE
    -- Update only if content differs (idempotency check)
    UPDATE public.campaigns
    SET 
      subject = v_subject,
      body_template = v_body,
      updated_at = NOW()
    WHERE id = v_campaign_id
      AND (subject != v_subject OR body_template != v_body);
  END IF;
END $$;
-- Phase H-T1: Allowlist table for canary testing
CREATE TABLE IF NOT EXISTS public.hotline_allowlist (
  e164 TEXT PRIMARY KEY,
  label TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phase H-T3: Geo-filtering configuration
CREATE TABLE IF NOT EXISTS public.hotline_geo_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default geo config (Canada-only initially, disabled)
INSERT INTO public.hotline_geo_config (key, value) VALUES
  ('geo_filtering_enabled', 'false'::jsonb),
  ('allowed_country_codes', '["1"]'::jsonb), -- North America (US+CA)
  ('canada_only_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS policies for allowlist
ALTER TABLE public.hotline_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage allowlist"
  ON public.hotline_allowlist
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can read allowlist"
  ON public.hotline_allowlist
  FOR SELECT
  USING (auth.role() = 'service_role');

-- RLS policies for geo config
ALTER TABLE public.hotline_geo_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view geo config"
  ON public.hotline_geo_config
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage geo config"
  ON public.hotline_geo_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Helper function to check if number is in allowlist
CREATE OR REPLACE FUNCTION public.is_hotline_allowlisted(p_e164 TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hotline_allowlist
    WHERE e164 = p_e164
  );
$$;

-- Helper function to check geo restrictions
CREATE OR REPLACE FUNCTION public.check_hotline_geo(p_e164 TEXT)
RETURNS JSONB
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_geo_enabled BOOLEAN;
  v_canada_only BOOLEAN;
  v_country_code TEXT;
  v_area_code TEXT;
BEGIN
  -- Get geo filtering config
  SELECT (value)::boolean INTO v_geo_enabled
  FROM public.hotline_geo_config
  WHERE key = 'geo_filtering_enabled';

  -- If geo filtering disabled, allow all
  IF NOT COALESCE(v_geo_enabled, false) THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'geo_filtering_disabled');
  END IF;

  -- Extract country and area codes
  v_country_code := SUBSTRING(p_e164 FROM 2 FOR 1); -- After +, first digit
  v_area_code := SUBSTRING(p_e164 FROM 3 FOR 3); -- Next 3 digits

  -- Check Canada-only mode
  SELECT (value)::boolean INTO v_canada_only
  FROM public.hotline_geo_config
  WHERE key = 'canada_only_mode';

  IF COALESCE(v_canada_only, false) THEN
    -- Canadian area codes (simplified check - production should use full lookup)
    -- Alberta: 403, 587, 780, 825
    -- Other provinces: 204, 226, 236, 249, 250, 289, 306, 343, 365, 367, 368, 382, 403, 416, 418, 431, 437, 438, 450, 506, 514, 519, 548, 579, 581, 587, 604, 613, 639, 647, 672, 705, 709, 778, 780, 782, 807, 819, 825, 867, 873, 902, 905
    IF v_area_code = ANY(ARRAY['403', '587', '780', '825', '204', '226', '236', '249', '250', '289', '306', '343', '365', '367', '368', '382', '416', '418', '431', '437', '438', '450', '506', '514', '519', '548', '579', '581', '604', '613', '639', '647', '672', '705', '709', '778', '782', '807', '819', '867', '873', '902', '905']) THEN
      RETURN jsonb_build_object('allowed', true, 'reason', 'canada_origin');
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'non_canada_restricted', 'area_code', v_area_code);
    END IF;
  END IF;

  -- Default: country code 1 (North America) allowed
  IF v_country_code = '1' THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'north_america');
  END IF;

  RETURN jsonb_build_object('allowed', false, 'reason', 'geo_restricted', 'country_code', v_country_code);
END;
$$;

COMMENT ON TABLE public.hotline_allowlist IS 'Phase H-T1: Allowlist for canary testing';
COMMENT ON TABLE public.hotline_geo_config IS 'Phase H-T3: Geo-filtering configuration';
COMMENT ON FUNCTION public.check_hotline_geo IS 'Phase H-T3: Check if caller meets geo restrictions';
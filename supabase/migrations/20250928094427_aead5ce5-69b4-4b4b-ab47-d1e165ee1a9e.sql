-- Enable RLS on new tables and add service role policies
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- Service role can manage all records (for server-side operations)
CREATE POLICY "Service role can manage orgs" ON orgs
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage org_settings" ON org_settings
FOR ALL USING (auth.role() = 'service_role');
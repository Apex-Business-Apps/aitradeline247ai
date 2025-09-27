-- Enable RLS on new tables
alter table public.faqs enable row level security;
alter table public.org_settings enable row level security;
alter table public.blocklist_numbers enable row level security;

-- RLS policies for faqs table
create policy "Organization members can view FAQs"
  on public.faqs for select
  using (is_org_member(organization_id));

create policy "Organization members can manage FAQs"
  on public.faqs for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- RLS policies for org_settings table
create policy "Organization members can view settings"
  on public.org_settings for select
  using (is_org_member(organization_id));

create policy "Organization members can manage settings"
  on public.org_settings for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- RLS policies for blocklist_numbers table
create policy "Service role can manage blocklist"
  on public.blocklist_numbers for all
  using (auth.role() = 'service_role'::text)
  with check (auth.role() = 'service_role'::text);

create policy "Admins can view blocklist"
  on public.blocklist_numbers for select
  using (has_role(auth.uid(), 'admin'::app_role));
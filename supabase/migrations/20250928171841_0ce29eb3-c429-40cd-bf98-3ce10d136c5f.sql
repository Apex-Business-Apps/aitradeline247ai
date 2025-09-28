do $$ begin
  perform 1 from information_schema.tables
   where table_schema='public' and table_name='supported_locales';
  if found then
    alter table supported_locales enable row level security;
    alter table supported_locales force row level security;

    -- Drop existing public policy
    drop policy if exists "Anyone can view supported locales" on supported_locales;
    
    -- Authenticated users can read; no public
    create policy supported_locales_select_auth
    on supported_locales for select
    to authenticated
    using (auth.uid() is not null);
  end if;
end $$;
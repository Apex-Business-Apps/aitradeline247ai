-- Fix contacts table security: Add organization linkage and proper RLS policies

-- Step 1: Add organization_id column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts(organization_id);

-- Step 3: Drop the overly restrictive 'false' policy
DROP POLICY IF EXISTS "Block direct contact access" ON public.contacts;

-- Step 4: Create proper role-based RLS policies

-- Admin users can view contacts in their organizations
CREATE POLICY "Admins can view organization contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND is_org_member(organization_id)
);

-- Admin users can manage contacts in their organizations
CREATE POLICY "Admins can manage organization contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND is_org_member(organization_id)
)
WITH CHECK (
  organization_id IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND is_org_member(organization_id)
);

-- Step 5: Update audit function to log modifications only (SELECT triggers not supported)
CREATE OR REPLACE FUNCTION public.audit_contacts_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log modifications
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'contacts',
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP || '_contact'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 6: Create audit trigger for modifications
DROP TRIGGER IF EXISTS audit_contacts_modifications_trigger ON public.contacts;
CREATE TRIGGER audit_contacts_modifications_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.audit_contacts_modifications();

-- Step 7: Drop and recreate get_contact_summary_secure function with updated signature
DROP FUNCTION IF EXISTS public.get_contact_summary_secure(uuid);

CREATE FUNCTION public.get_contact_summary_secure(contact_id_param uuid)
RETURNS TABLE(
  id uuid, 
  wa_capable boolean, 
  created_at timestamp with time zone, 
  phone_masked text, 
  first_name text,
  organization_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access contact information';
  END IF;

  -- Check organization membership
  IF NOT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_id_param
    AND c.organization_id IS NOT NULL
    AND public.is_org_member(c.organization_id)
  ) THEN
    RAISE EXCEPTION 'Access denied: Not a member of the contact organization';
  END IF;

  -- Log access
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'contacts',
    contact_id_param::text,
    'secure_contact_view'
  );

  -- Return masked data
  RETURN QUERY
  SELECT 
    c.id,
    c.wa_capable,
    c.created_at,
    CASE 
      WHEN c.e164 IS NOT NULL THEN 
        LEFT(c.e164, 5) || '***' || RIGHT(c.e164, 2)
      ELSE NULL 
    END as phone_masked,
    c.first_name,
    c.organization_id
  FROM public.contacts c
  WHERE c.id = contact_id_param;
END;
$$;
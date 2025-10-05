# DRIFT-06: List Import (Warm Contacts Only)

## CSV Format

### Required Columns
```csv
email,given_name,family_name,org,country,consent_basis,last_txn_date,notes
john@example.com,John,Doe,Acme Corp,Canada,implied_ebr,2024-05-15,Previous client - HVAC service
jane@company.ca,Jane,Smith,Company Ltd,Canada,express,2024-10-01,Signed up via website form
```

### Field Specifications

| Column | Required | Format | Notes |
|--------|----------|--------|-------|
| email | ✅ Yes | Valid email | Lowercase, validated |
| given_name | No | Text | First name |
| family_name | No | Text | Last name |
| org | No | Text | Company/organization |
| country | No | Text | Canada preferred |
| consent_basis | ✅ Yes | Enum | `express`, `implied_ebr`, `implied_published` |
| last_txn_date | Conditional | YYYY-MM-DD | Required for `implied_ebr` |
| notes | No | Text | Internal notes |

### Consent Basis Rules

1. **express**: Active opt-in
   - Website form submission with consent checkbox
   - Event signup with email permission
   - Direct request for information
   - **Valid indefinitely** (until unsubscribe)

2. **implied_ebr**: Existing Business Relationship
   - Must have `last_txn_date` within **24 months**
   - Valid relationships:
     - Purchase/lease of product/service
     - Written contract currently in force
     - Contract within 24 months
   - **Auto-expire after 24 months**

3. **implied_published**: Publicly Available
   - Contact published on website, directory
   - Business card, trade show
   - LinkedIn/professional profiles
   - Must be relevant to person's business role
   - **Use sparingly**, prefer express/EBR

## Import Script

### SQL Import (Recommended)

```sql
-- 1. Create temporary staging table
CREATE TEMP TABLE leads_staging (
  email TEXT,
  given_name TEXT,
  family_name TEXT,
  org TEXT,
  country TEXT,
  consent_basis TEXT,
  last_txn_date DATE,
  notes TEXT
);

-- 2. Import CSV (via psql or Supabase SQL editor)
COPY leads_staging FROM '/path/to/warm_contacts.csv' 
WITH (FORMAT csv, HEADER true);

-- 3. Data validation and cleanup
DELETE FROM leads_staging WHERE email IS NULL OR email = '';
DELETE FROM leads_staging WHERE consent_basis NOT IN ('express', 'implied_ebr', 'implied_published');

-- 4. Filter implied_ebr older than 24 months
DELETE FROM leads_staging 
WHERE consent_basis = 'implied_ebr' 
AND (last_txn_date IS NULL OR last_txn_date < NOW() - INTERVAL '24 months');

-- 5. Deduplicate within staging
DELETE FROM leads_staging a
USING leads_staging b
WHERE a.ctid < b.ctid 
AND LOWER(a.email) = LOWER(b.email);

-- 6. Exclude unsubscribes
DELETE FROM leads_staging
WHERE LOWER(email) IN (
  SELECT LOWER(email) FROM public.unsubscribes
);

-- 7. Insert into leads table
INSERT INTO public.leads (
  email,
  name,
  company,
  notes,
  source,
  lead_score
)
SELECT 
  LOWER(TRIM(email)),
  TRIM(COALESCE(given_name || ' ' || family_name, given_name, family_name)),
  TRIM(org),
  CONCAT(
    'Consent: ', consent_basis, 
    CASE WHEN last_txn_date IS NOT NULL 
      THEN '; Last txn: ' || last_txn_date::text 
      ELSE '' 
    END,
    CASE WHEN notes IS NOT NULL AND notes != '' 
      THEN '; Notes: ' || notes 
      ELSE '' 
    END
  ),
  CASE 
    WHEN consent_basis = 'express' THEN 'website_form'
    WHEN consent_basis = 'implied_ebr' THEN 'existing_customer'
    ELSE 'imported'
  END,
  CASE 
    WHEN consent_basis = 'express' THEN 75
    WHEN consent_basis = 'implied_ebr' THEN 50
    ELSE 25
  END
FROM leads_staging
ON CONFLICT (email) DO UPDATE
SET 
  name = COALESCE(EXCLUDED.name, leads.name),
  company = COALESCE(EXCLUDED.company, leads.company),
  notes = leads.notes || '; ' || EXCLUDED.notes,
  updated_at = NOW();

-- 8. Report
SELECT 
  'Imported' as status,
  COUNT(*) as count
FROM leads_staging

UNION ALL

SELECT 
  'Total in leads table' as status,
  COUNT(*) as count
FROM public.leads

UNION ALL

SELECT 
  'Unsubscribed (filtered)' as status,
  COUNT(*) as count
FROM public.unsubscribes;

-- 9. Cleanup
DROP TABLE leads_staging;
```

### JavaScript Import (Alternative)

```typescript
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importLeads(csvPath: string) {
  // 1. Read CSV
  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Read ${records.length} records from CSV`);

  // 2. Get unsubscribes
  const { data: unsubscribes } = await supabase
    .from('unsubscribes')
    .select('email');
  
  const unsubscribedEmails = new Set(
    unsubscribes?.map(u => u.email.toLowerCase()) || []
  );

  // 3. Validate and filter
  const validLeads = records
    .filter(r => r.email && r.consent_basis)
    .filter(r => ['express', 'implied_ebr', 'implied_published'].includes(r.consent_basis))
    .filter(r => {
      if (r.consent_basis === 'implied_ebr') {
        if (!r.last_txn_date) return false;
        const txnDate = new Date(r.last_txn_date);
        const monthsAgo = (Date.now() - txnDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 24;
      }
      return true;
    })
    .filter(r => !unsubscribedEmails.has(r.email.toLowerCase()));

  console.log(`Valid leads after filtering: ${validLeads.length}`);

  // 4. Deduplicate
  const uniqueLeads = Array.from(
    new Map(validLeads.map(l => [l.email.toLowerCase(), l])).values()
  );

  console.log(`Unique leads after deduplication: ${uniqueLeads.length}`);

  // 5. Transform for insert
  const leadsToInsert = uniqueLeads.map(r => ({
    email: r.email.toLowerCase().trim(),
    name: [r.given_name, r.family_name].filter(Boolean).join(' ').trim(),
    company: r.org || null,
    notes: [
      `Consent: ${r.consent_basis}`,
      r.last_txn_date ? `Last txn: ${r.last_txn_date}` : null,
      r.notes || null,
    ].filter(Boolean).join('; '),
    source: r.consent_basis === 'express' ? 'website_form' :
            r.consent_basis === 'implied_ebr' ? 'existing_customer' : 'imported',
    lead_score: r.consent_basis === 'express' ? 75 :
                r.consent_basis === 'implied_ebr' ? 50 : 25,
  }));

  // 6. Batch insert
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < leadsToInsert.length; i += batchSize) {
    const batch = leadsToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('leads')
      .upsert(batch, { onConflict: 'email' });

    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(leadsToInsert.length / batchSize)}`);
    }
  }

  console.log('\nImport Summary:');
  console.log(`- CSV records: ${records.length}`);
  console.log(`- Valid leads: ${validLeads.length}`);
  console.log(`- Unique leads: ${uniqueLeads.length}`);
  console.log(`- Inserted: ${inserted}`);
  console.log(`- Errors: ${errors}`);
  console.log(`- Filtered (unsubscribed): ${records.length - validLeads.length}`);
}

// Usage
importLeads('./warm_contacts.csv');
```

## Validation Checklist

After import, verify:

```sql
-- 1. Count by consent basis
SELECT 
  CASE 
    WHEN source = 'website_form' THEN 'express'
    WHEN source = 'existing_customer' THEN 'implied_ebr'
    ELSE 'implied_published'
  END as consent_basis,
  COUNT(*) as count
FROM leads
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY consent_basis;

-- 2. Check for invalid emails
SELECT email, name FROM leads
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
AND created_at > NOW() - INTERVAL '1 hour';

-- 3. Check for unsubscribed (shouldn't exist)
SELECT l.email, l.name 
FROM leads l
JOIN unsubscribes u ON LOWER(l.email) = LOWER(u.email)
WHERE l.created_at > NOW() - INTERVAL '1 hour';

-- 4. Duplicates check
SELECT email, COUNT(*) 
FROM leads 
GROUP BY email 
HAVING COUNT(*) > 1;
```

## Post-Import

1. **Verify counts match expectations**
2. **Test unsubscribe exclusion** (manually add test email to unsubscribes, verify not in import)
3. **Review lead_score distribution**
4. **Ready for campaign attachment** (use `ops-campaigns-create`)

## Sample CSV Template

Download: [warm_contacts_template.csv](./warm_contacts_template.csv)

```csv
email,given_name,family_name,org,country,consent_basis,last_txn_date,notes
john.doe@example.com,John,Doe,Example Corp,Canada,express,2024-10-01,Website signup - service inquiry
jane.smith@company.ca,Jane,Smith,Company Ltd,Canada,implied_ebr,2024-03-15,Previous HVAC client - annual service
bob.wilson@firm.com,Bob,Wilson,Law Firm,Canada,implied_published,,Found on company website
```

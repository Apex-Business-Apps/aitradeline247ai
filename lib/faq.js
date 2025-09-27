import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export async function findFaqAnswer(orgId, text){
  if(!orgId || !text) return null;
  const { rows } = await pool.query(
    "select a from public.faqs where organization_id=$1 and similarity(q,$2)>0.2 order by similarity(q,$2) desc limit 1",
    [orgId, text]
  ).catch(()=>({rows:[]}));
  return rows?.[0]?.a || null;
}
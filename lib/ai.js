export async function extractNameAndNeed(text){
  // lightweight heuristic; can swap to LLM later
  const m = (text||"").match(/\b(i'?m|this is)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/);
  const name = m?.[2] || null;
  return { name, need: text?.slice(0, 240) || "" };
}
export async function summarizeForEmail(text){
  // simple summary now; can upgrade to LLM
  const s = (text||"").trim().replace(/\s+/g," ");
  return s.length>400 ? s.slice(0,397)+"…" : s || "(no transcript)";
}
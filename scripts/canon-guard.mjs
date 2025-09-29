import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const sep = path.sep;
let failed = false;
const fails = [];

// --- helpers ---
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", "dist", ".git", ".next", ".vercel"].includes(e.name)) continue;
      walk(p, acc);
    } else acc.push(p);
  }
  return acc;
}
function has(p) { try { fs.statSync(p); return true; } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } }
function check(name, cond, detail = "") {
  if (!cond) { failed = true; fails.push(`❌ ${name}${detail ? " — " + detail : ""}`); }
}
function anyFile(files, re) { return files.some(f => re.test(read(f))); }
function fileContains(p, re) { return re.test(read(p)); }

// --- collect ---
const all = walk(ROOT).map(p => p.replace(ROOT + sep, ""));
const src = all.filter(p => p.startsWith(`src${sep}`));
const docsOps = all.filter(p =>
  /^(README|docs|ops|infra|server(\.|$)|render\.ya?ml|vercel\.json)/i.test(p.replaceAll(sep,"/"))
);

// --- 1) Single router truth ---
check("Single router (no duplicate router.tsx)", !has(`src${sep}router.tsx`));

// --- 2) Brand token truth (HSL variable + Tailwind consumption) ---
check("Brand HSL var present",
  src.some(f => /index\.css$/.test(f)) && anyFile(src.filter(f=>/index\.css$/.test(f)),
  /--brand-orange-primary:\s*\d+\s+\d+%\s+\d+%/));
check("Tailwind uses hsl(var(--brand-orange-primary))",
  anyFile(all.filter(f=>/tailwind\.config\.(t|j)s$/i.test(f)), /hsl\(var\(--brand-orange-primary\)\)/));

// --- 3) Supabase client truth ---
check("No duplicate Supabase client (src/lib/supabaseClient.ts must not exist)", !has(`src${sep}lib${sep}supabaseClient.ts`));
check("Generated Supabase client exists", has(`src${sep}integrations${sep}supabase${sep}client.ts`));

// --- 4) Runtime env hygiene (server must not reference VITE_*) ---
const serverFiles = all.filter(p => /^server(\.|$)/.test(p.replaceAll(sep,"/")) || p.includes(`${sep}server${sep}`));
check("Server has no VITE_* at runtime",
  !serverFiles.some(f => /VITE_/i.test(read(f))),
  serverFiles.find(f => /VITE_/i.test(read(f))) || "");

// --- 5) Minimal server: health endpoints + SPA fallback (no host logic) ---
check("Server exposes /healthz", serverFiles.some(f => /app\.get\(['"`]\/healthz['"`]/.test(read(f))));
check("Server exposes /readyz", serverFiles.some(f => /app\.get\(['"`]\/readyz['"`]/.test(read(f))));
check("Server serves static with index:false", serverFiles.some(f => /express\.static\(.+index:\s*false/.test(read(f))));
check("Server SPA fallback to index.html", serverFiles.some(f => /app\.get\(\s*['"`]\*\s*['"`]\s*,[\s\S]*index\.html/.test(read(f))));

// --- 6) Production logs dropped in build ---
const viteFiles = all.filter(f => /vite\.config\.(t|j|m)ts?$/i.test(f));
check("Build drops console & debugger", anyFile(viteFiles, /drop:\s*\[\s*['"]console['"]\s*,\s*['"]debugger['"]\s*\]/));

// --- 7) Brand copy truth (tagline must exist somewhere in app) ---
check("Tagline present exactly once or more",
  anyFile(src, /Your 24\/7 Ai Receptionist!/));

// --- 8) Telephony endpoints + signature check present (strings only) ---
const telephonyHits = src.concat(serverFiles).filter(f => /(voice\/answer|voice\/status)/i.test(read(f)));
check("Telephony endpoints exist (answer/status)",
  telephonyHits.length >= 1);
check("Twilio signature validation present",
  anyFile(src.concat(serverFiles), /X-Twilio-Signature/i));

// --- 9) Text scrub in ops/docs/server (allow OAuth param name) ---
const bannedRE = /\b(cloudflare|redirect)\b/i;
const allowedRE = /redirect_uri/i;
const offenders = [];
for (const f of docsOps) {
  const txt = read(f);
  if (bannedRE.test(txt) && !allowedRE.test(txt)) offenders.push(f);
}
check("Ops/docs/server are free of banned terms (OAuth param allowed)",
  offenders.length === 0, offenders.join(", "));

// --- report ---
if (failed) {
  console.error("\nCANON TRUTH GUARD — FAILURES:");
  for (const m of fails) console.error(m);
  process.exit(1);
} else {
  console.log("CANON TRUTH GUARD — OK");
}
#!/usr/bin/env node
/* Idempotent weekly Guardian reporter.
   - GETs /healthz, /readyz, icon-192.png, release.tar.gz.sha256 from apex + www
   - Writes docs/guardian/weekly/YYYY-MM-DD.md (or _DRYRUN_*.md when --dry-run)
*/
import fs from "node:fs";
import path from "node:path";

const BASES = ["https://tradeline247ai.com", "https://www.tradeline247ai.com"];
const PATHS = ["/healthz", "/readyz", "/assets/brand/App_Icons/icon-192.png", "/download/release.tar.gz.sha256"];

const isDry = process.argv.includes("--dry-run");
const tz = "America/Edmonton";
const now = new Date();
const pad = (n)=> String(n).padStart(2,"0");
const d = new Date(now.toLocaleString("en-CA", { timeZone: tz }));
const yyyy = d.getFullYear(), mm = pad(d.getMonth()+1), dd = pad(d.getDate());
const stampLocal = new Intl.DateTimeFormat("en-CA", { timeZone: tz, dateStyle:"full", timeStyle:"long" }).format(now);

const outDir = path.join("docs","guardian","weekly");
fs.mkdirSync(outDir, { recursive: true });
const outName = isDry ? `_DRYRUN_${yyyy}-${mm}-${dd}_${pad(d.getHours())}${pad(d.getMinutes())}` : `${yyyy}-${mm}-${dd}`;
const outFile = path.join(outDir, `${outName}.md`);

async function check(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, { method: "GET" });
    const ms = Date.now() - started;
    const body = (url.endsWith(".sha256")) ? (await res.text()).slice(0,120).replace(/\s+/g," ").trim() : "";
    return { url, ok: res.ok, status: res.status, ms, sample: body };
  } catch (e) {
    const ms = Date.now() - started;
    return { url, ok: false, status: 0, ms, error: (e && e.message) || "error" };
  }
}

(async () => {
  const rows = [];
  for (const base of BASES) {
    for (const p of PATHS) rows.push(await check(base + p));
  }
  const lines = [];
  lines.push(`# Guardian Weekly Report — ${yyyy}-${mm}-${dd}`);
  lines.push(`_Generated ${stampLocal} (${tz})_`);
  lines.push("");
  for (const base of BASES) {
    lines.push(`## Host ${base}`);
    for (const p of PATHS) {
      const r = rows.find(x => x.url === base + p);
      const s = r.ok ? "✅" : "❌";
      const detail = r.sample ? ` — sample: \`${r.sample}\`` : (r.error ? ` — error: ${r.error}` : "");
      lines.push(`- ${s} \`${p}\` → status ${r.status} in ${r.ms}ms${detail}`);
    }
    lines.push("");
  }
  lines.push("### Notes");
  lines.push("- Any ❌ on /healthz or /readyz is a P1 (investigate immediately).");
  lines.push("- If `.sha256` contains HTML, fix deploy to ship the artifact file.");
  fs.writeFileSync(outFile, lines.join("\n") + "\n");
  console.log(outFile);
})();

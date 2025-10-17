const { execSync } = require("node:child_process");

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!ref || !token) {
  console.error("Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN");
  process.exit(process.env.CI ? 78 : 1); // neutral in CI on previews
}

const cmd = `npx supabase@latest functions deploy secret-encrypt --project-ref ${ref} --debug`;

let attempt = 0;
const max = 5;

while (attempt < max) {
  try {
    attempt++;
    console.log(`[secret-encrypt] Deploy attempt ${attempt}/${max}`);
    execSync(cmd, { stdio: "inherit", env: process.env });
    console.log("[secret-encrypt] Deploy succeeded.");
    process.exit(0);
  } catch (e) {
    if (attempt >= max) {
      console.error("[secret-encrypt] Deploy failed after retries.");
      process.exit(1);
    }
    const backoff = Math.min(60, 5 * attempt);
    console.warn(`[secret-encrypt] Transient error. Retrying in ${backoff}s...`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, backoff * 1000);
  }
}

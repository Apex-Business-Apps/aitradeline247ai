import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const CANONICAL_DOMAIN = "tradeline247ai.com";
const CANONICAL_WWW = "www.tradeline247ai.com";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// body parsing for forms/APIs
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

const PUB = path.join(__dirname, "public");
const DIST = path.join(__dirname, "dist");
const DIST_INDEX = path.join(DIST, "index.html");

/* 1) apex → www (method-preserving 308) */
app.use((req, res, next) => {
  if (req.headers.host === CANONICAL_DOMAIN) {
    return res.redirect(308, `https://${CANONICAL_WWW}${req.originalUrl}`);
  }
  next();
});

/* 2) minimal security headers */
app.use((_, res, next) => {
  res.setHeader("Strict-Transport-Security","max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options","nosniff");
  next();
});

/* 3) health */
app.get("/healthz", (_req, res) => res.status(200).send("ok"));
app.get("/readyz",  (_req, res) => fs.existsSync(DIST_INDEX) ? res.status(200).send("ok") : res.status(503).send("not ready"));

/* 4) static before SPA */
app.use("/assets", express.static(path.join(PUB, "assets"), { immutable: true, maxAge: "1y" }));
app.use(express.static(DIST, { extensions: ["html"] }));

/* 5) diagnostics */
app.get("/selftest", (_req, res) => {
  const ex = (p) => fs.existsSync(path.join(__dirname, p));
  res.json({
    ok: {
      artifacts_tgz: ex("public/download/release.tar.gz"),
      artifacts_sha: ex("public/download/release.tar.gz.sha256"),
      icon_192:      ex("public/assets/brand/App_Icons/icon-192.png"),
    },
    ts: new Date().toISOString(),
  });
});
app.get("/status.json", (_req, res) => {
  const hasArtifacts =
    fs.existsSync(path.join(PUB, "download", "release.tar.gz")) &&
    fs.existsSync(path.join(PUB, "download", "release.tar.gz.sha256"));
  res.json({
    build: process.env.BUILD_ID || null,
    brand_title: "TradeLine 24/7 — Your 24/7 Ai Receptionist!",
    artifacts: hasArtifacts ? "ok" : "missing",
    ts: new Date().toISOString(),
  });
});

/* 6) Lead capture API */
app.post("/api/lead", async (req, res) => {
  try {
    const { name="", email="", phone="", message="" } = req.body || {};
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!okEmail || (!name && !phone && !message)) return res.status(400).json({ ok:false, error:"invalid_input" });
    res.status(202).json({ ok:true }); // fast ack (idempotent UX)
    if (resend) {
      await resend.emails.send({
        from: "TradeLine 24/7 <noreply@tradeline247ai.com>",
        to: ["support@tradeline247ai.com"],
        subject: "New Lead — TradeLine 24/7",
        text: `Name:${name}\nEmail:${email}\nPhone:${phone}\nMessage:${message}\nTS:${new Date().toISOString()}`
      }).catch(()=>{});
      if (email) await resend.emails.send({
        from: "TradeLine 24/7 <noreply@tradeline247ai.com>",
        to: [email],
        subject: "Thanks — we'll reach out shortly",
        text: "We've received your message and will get back to you soon. — TradeLine 24/7"
      }).catch(()=>{});
    }
  } catch {}
});

/* 7) SPA fallback only if artifacts exist */
const hasArtifacts =
  fs.existsSync(path.join(PUB, "download", "release.tar.gz")) &&
  fs.existsSync(path.join(PUB, "download", "release.tar.gz.sha256"));

app.get("*", (_req, res) => {
  if (!hasArtifacts) return res.status(503).send("Artifacts missing");
  res.sendFile(DIST_INDEX);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("listening on", port));
export default app;
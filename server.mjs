import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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

/* 6) SPA fallback only if artifacts exist */
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
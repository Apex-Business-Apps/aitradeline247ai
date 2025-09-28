import express from "express";
import path from "path";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import twilio from "twilio";
import { fileURLToPath } from "url";

// Telephony handlers
import { telephonyStatusHandler } from "./server/telephony.status.mjs";
import { payHandler } from "./server/voice/pay.mjs";
import { gbmWebhook } from "./integrations/gbm/webhook.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust proxy for proper IP detection
app.set("trust proxy", 1);

// Security and middleware
app.use(helmet());
app.use(compression());
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// Body parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Twilio webhook validation middleware
const twilioWebhook = twilio.webhook({ 
  validate: true, 
  protocol: "https", 
  host: process.env.PUBLIC_HOSTNAME 
});

// Telephony routes - ALWAYS behind twilioWebhook validation
app.post("/voice/status", twilioWebhook, telephonyStatusHandler);
app.post("/voice/answer/pay", twilioWebhook, payHandler);

// GBM webhook (guarded by shared secret)
app.post("/integrations/gbm/webhook", gbmWebhook);

// Static file serving
app.use(express.static(path.join(__dirname, "dist")));
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));

// Health checks
app.get("/healthz", (_,res)=>res.type("text").send("ok"));
app.get("/readyz",  (_,res)=>res.type("text").send("ready"));

// SPA fallback
app.get("*", (_,res)=>res.sendFile(path.join(__dirname,"dist","index.html")));

const PORT = process.env.PORT || 5000;
app.listen(PORT,"0.0.0.0",()=>console.log(`TradeLine 24/7 server listening on ${PORT}`));
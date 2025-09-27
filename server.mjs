import express from "express";
import path from "path";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.use(express.static(path.join(__dirname, "dist")));
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));
app.get("/healthz", (_,res)=>res.type("text").send("ok"));
app.get("/readyz",  (_,res)=>res.type("text").send("ready"));
app.get("*", (_,res)=>res.sendFile(path.join(__dirname,"dist","index.html")));

const PORT = process.env.PORT || 5000;
app.listen(PORT,"0.0.0.0",()=>console.log(`listening on ${PORT}`));
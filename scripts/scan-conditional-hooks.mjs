import fs from "node:fs";
import path from "node:path";

const HOOKS = ["useState","useEffect","useMemo","useCallback","useRef","useContext","useReducer","useLayoutEffect","useImperativeHandle","useId","useSyncExternalStore"];
const exts = new Set([".ts",".tsx",".js",".jsx"]);
const offenders = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) { 
      if (!["node_modules","dist","build",".git"].includes(ent.name)) walk(p); 
    }
    else if (exts.has(path.extname(ent.name))) scan(p);
  }
}

function scan(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let insideComponent = false;

  for (let i=0;i<lines.length;i++) {
    const l = lines[i];
    const trimmed = l.trim();

    // Crude component detector (function Foo(…) { … or const Foo = (…) => { … )
    if (/^function\s+[A-Z][A-Za-z0-9_]*\s*\(|^const\s+[A-Z][A-Za-z0-9_]*\s*=\s*\(/.test(trimmed)) {
      insideComponent = true;
    }
    if (insideComponent && trimmed === "}") {
      insideComponent = false;
    }

    if (!insideComponent) continue;

    // Flag hooks on same line as conditionals or after early returns
    const hasConditional = /\b(if|for|while|switch)\b|\?[:]/.test(trimmed);
    const hasEarlyReturn = /^\s*return\s+(null|false|<)/.test(trimmed);

    const callsHook = HOOKS.some(h => new RegExp(`\\b${h}\\s*\\(`).test(trimmed));

    if (callsHook && (hasConditional || hasEarlyReturn)) {
      offenders.push({ file, line: i+1, snippet: trimmed.slice(0,180) });
    }
  }
}

walk("src");

if (offenders.length) {
  console.error("❌ Possible conditional/early-return hook usage found:");
  for (const o of offenders) {
    console.error(` - ${o.file}:${o.line}  ${o.snippet}`);
  }
  process.exit(1);
} else {
  console.log("✅ No obvious conditional/early-return hook usage detected.");
}

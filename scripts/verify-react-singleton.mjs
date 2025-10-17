#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const TARGETS = ["react", "react-dom"];
const REQUIRED_VERSION = "18.3.1";

async function pathExists(dir) {
  try {
    await fs.access(dir);
    return true;
  } catch {
    return false;
  }
}

async function scanNodeModules(startDir) {
  const queue = [startDir];
  const visited = new Set();
  const found = [];

  while (queue.length) {
    const current = queue.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    let dirEntries;
    try {
      dirEntries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of dirEntries) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules") {
          queue.push(fullPath);
          continue;
        }

        if (entry.name.startsWith("@")) {
          queue.push(fullPath);
          continue;
        }

        const pkgJsonPath = path.join(fullPath, "package.json");
        try {
          const pkgRaw = await fs.readFile(pkgJsonPath, "utf8");
          const pkg = JSON.parse(pkgRaw);
          if (TARGETS.includes(pkg.name)) {
            found.push({ name: pkg.name, version: pkg.version, path: pkgJsonPath });
          }
        } catch {
          // not a package root
        }

        const nestedNodeModules = path.join(fullPath, "node_modules");
        if (await pathExists(nestedNodeModules)) {
          queue.push(nestedNodeModules);
        }
      }
    }
  }

  return found;
}

async function collectReactPackages() {
  const rootNodeModules = path.join(ROOT, "node_modules");
  const results = [];

  if (await pathExists(rootNodeModules)) {
    results.push(...(await scanNodeModules(rootNodeModules)));
  }

  return results;
}

function groupByName(packages) {
  return packages.reduce((acc, pkg) => {
    if (!acc.has(pkg.name)) {
      acc.set(pkg.name, []);
    }
    acc.get(pkg.name).push(pkg);
    return acc;
  }, new Map());
}

async function main() {
  const packages = await collectReactPackages();
  const grouped = groupByName(packages);
  const errors = [];

  for (const target of TARGETS) {
    const entries = grouped.get(target) ?? [];
    if (!entries.length) {
      errors.push(`Missing required package ${target}@${REQUIRED_VERSION}`);
      continue;
    }

    const versions = new Set(entries.map((entry) => entry.version));
    if (versions.size > 1 || !versions.has(REQUIRED_VERSION)) {
      const detail = entries
        .map((entry) => `- ${entry.name}@${entry.version} (${entry.path})`)
        .join("\n");
      errors.push(`Expected only ${target}@${REQUIRED_VERSION} but found:\n${detail}`);
    }
  }

  if (errors.length) {
    console.error("❌ React singleton verification failed:\n" + errors.join("\n\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`✅ React singleton OK (react ${REQUIRED_VERSION}, react-dom ${REQUIRED_VERSION})`);
}

main().catch((error) => {
  console.error("❌ React singleton verification crashed:", error);
  process.exitCode = 1;
});

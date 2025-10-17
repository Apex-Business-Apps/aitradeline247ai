#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const EXPECTED_VERSION = "18.3.1";
const rootDir = process.cwd();
const visitedPackages = new Set();
const discovered = [];

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readPackageVersion(pkgDir, name) {
  const pkgPath = path.join(pkgDir, "package.json");
  try {
    const raw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    return pkg.version || "unknown";
  } catch (error) {
    console.warn(`⚠️ Unable to read ${name} package.json at ${pkgPath}:`, error);
    return "unknown";
  }
}

async function registerPackage(name, pkgDir) {
  const normalized = path.resolve(pkgDir);
  if (visitedPackages.has(normalized)) {
    return;
  }
  visitedPackages.add(normalized);

  const version = await readPackageVersion(pkgDir, name);
  discovered.push({ name, version, path: normalized });

  const nestedNodeModules = path.join(pkgDir, "node_modules");
  if (await pathExists(nestedNodeModules)) {
    await scanNodeModules(nestedNodeModules);
  }
}

async function scanNodeModules(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === ".bin") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.name === "react" || entry.name === "react-dom") {
      await registerPackage(entry.name, fullPath);
      continue;
    }

    if (entry.name.startsWith("@")) {
      await scanNodeModules(fullPath);
      continue;
    }

    const nestedNodeModules = path.join(fullPath, "node_modules");
    if (await pathExists(nestedNodeModules)) {
      await scanNodeModules(nestedNodeModules);
    }
  }
}

async function findAllNodeModules(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === "node_modules") {
      await scanNodeModules(path.join(dir, entry.name));
      continue;
    }

    if (entry.name.startsWith(".")) {
      continue;
    }

    await findAllNodeModules(path.join(dir, entry.name));
  }
}

async function main() {
  await findAllNodeModules(rootDir);

  if (discovered.length === 0) {
    console.error("❌ No react or react-dom packages found. Did you install dependencies?");
    process.exit(1);
  }

  const issues = [];
  const versionIndex = new Map();

  for (const pkg of discovered) {
    const key = `${pkg.name}@${pkg.version}`;
    if (!versionIndex.has(key)) {
      versionIndex.set(key, []);
    }
    versionIndex.get(key).push(pkg.path);

    if (pkg.version !== EXPECTED_VERSION) {
      issues.push({
        type: "version_mismatch",
        name: pkg.name,
        version: pkg.version,
        path: pkg.path,
      });
    }
  }

  for (const [key, paths] of versionIndex.entries()) {
    const [name, version] = key.split("@");
    const versionsForName = [...discovered.filter((pkg) => pkg.name === name).map((pkg) => pkg.version)]
      .filter((v, idx, arr) => arr.indexOf(v) === idx);
    if (versionsForName.length > 1) {
      issues.push({
        type: "duplicate_versions",
        name,
        version: versionsForName.join(", "),
        paths,
      });
    }
  }

  if (issues.length > 0) {
    console.error("❌ React singleton verification failed.");
    for (const issue of issues) {
      if (issue.type === "version_mismatch") {
        console.error(` - ${issue.name} at ${issue.path} has version ${issue.version}, expected ${EXPECTED_VERSION}`);
      }
      if (issue.type === "duplicate_versions") {
        console.error(` - Multiple versions detected for ${issue.name}: ${issue.version}`);
        for (const dupPath of issue.paths) {
          console.error(`   • ${dupPath}`);
        }
      }
    }
    process.exit(1);
  }

  console.log(`✅ React singleton OK (react ${EXPECTED_VERSION}, react-dom ${EXPECTED_VERSION})`);
  discovered
    .sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path))
    .forEach((pkg) => {
      console.log(` - ${pkg.name}@${pkg.version} → ${pkg.path}`);
    });
}

main().catch((error) => {
  console.error("❌ React singleton verification encountered an error:", error);
  process.exit(1);
});

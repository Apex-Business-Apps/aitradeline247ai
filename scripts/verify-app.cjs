#!/usr/bin/env node

const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const path = require('node:path');
const fs = require('node:fs');

const projectRoot = path.resolve(__dirname, '..');
const distIndex = path.join(projectRoot, 'dist', 'index.html');

async function ensureDist() {
  try {
    await fs.promises.access(distIndex, fs.constants.R_OK);
  } catch (error) {
    throw new Error('dist/index.html not found. Run "npm run build" before verify.');
  }
}

async function waitForServer(port) {
  const url = `http://127.0.0.1:${port}/healthz`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        return;
      }
    } catch (error) {
      // retry
    }
    await delay(250);
  }
  throw new Error('Server did not become ready at /healthz');
}

async function verifyEndpoints(port) {
  const base = `http://127.0.0.1:${port}`;

  const health = await fetch(`${base}/healthz`);
  if (!health.ok) {
    throw new Error(`/healthz returned ${health.status}`);
  }

  const ready = await fetch(`${base}/readyz`);
  if (!ready.ok) {
    throw new Error(`/readyz returned ${ready.status}`);
  }

  const home = await fetch(`${base}/`);
  const html = await home.text();
  if (!html.includes('Your 24/7 Ai Receptionist!')) {
    throw new Error('Homepage missing tagline copy.');
  }
}

(async () => {
  try {
    await ensureDist();

    const port = Number.parseInt(process.env.VERIFY_PORT ?? '', 10) || 4173;
    const server = spawn('node', ['server.mjs'], {
      cwd: projectRoot,
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    try {
      await waitForServer(port);
      await verifyEndpoints(port);
      console.log('VERIFY: PASS');
    } finally {
      server.kill('SIGTERM');
      await delay(200);
    }
  } catch (error) {
    console.error('VERIFY: FAIL');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
})();

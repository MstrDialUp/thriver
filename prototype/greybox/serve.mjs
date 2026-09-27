// Grey-box dev server (PLAN-playtest3 step 2): serves this folder like `python3 -m http.server`,
// and saves playtest runs into the repo so no data is lost to a restart or a closed tab.
//
//   node serve.mjs [port]          (default 8000)
//
//   GET  /api/ping  → { ok, commit }
//   POST /api/run   → writes the body to playtests/greybox/<YYYY-MM-DD>/<runId>.json
//
// No dependencies. Binds to localhost only.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const RUNS = path.join(REPO, 'playtests', 'greybox');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 8000);
const MAX_BODY = 5 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function gitCommit() {
  try {
    const sha = execSync('git rev-parse --short HEAD', { cwd: HERE, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execSync('git status --porcelain -- .', { cwd: HERE, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return dirty ? `${sha}+dirty` : sha;
  } catch { return null; }
}

// "2026-09-27T16-40-12_s1" → ["2026-09-27", "2026-09-27T16-40-12_s1"]. Anything else is refused.
export function runPath(runId) {
  if (typeof runId !== 'string' || !/^\d{4}-\d{2}-\d{2}T[\w-]{1,60}$/.test(runId)) return null;
  return path.join(RUNS, runId.slice(0, 10), `${runId}.json`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/ping') return send(res, 200, { ok: true, commit: gitCommit() });
  if (url.pathname === '/api/run' && req.method === 'POST') {
    let run;
    try { run = JSON.parse(await readBody(req)); } catch { return send(res, 400, { ok: false, error: 'bad JSON' }); }
    const file = runPath(run?.runId);
    if (!file) return send(res, 400, { ok: false, error: 'bad runId' });
    run.commit ??= gitCommit();
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(run, null, 2) + '\n');
    if (run.ended && run.ended !== 'in-progress') console.log(`saved ${path.relative(REPO, file)} (${run.ended})`);
    return send(res, 200, { ok: true, file: path.relative(REPO, file) });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { ok: false });

  // Static files, confined to this folder.
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(HERE, rel);
  if (!file.startsWith(HERE + path.sep) && file !== HERE) return send(res, 403, 'forbidden', 'text/plain');
  try {
    const st = await fs.stat(file);
    const target = st.isDirectory() ? path.join(file, 'index.html') : file;
    const data = await fs.readFile(target);
    return send(res, 200, data, TYPES[path.extname(target)] ?? 'application/octet-stream');
  } catch { return send(res, 404, 'not found', 'text/plain'); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  http.createServer((req, res) => handle(req, res).catch(e => send(res, 500, { ok: false, error: String(e.message ?? e) })))
    .listen(PORT, '127.0.0.1', () => {
      console.log(`Grey box: http://localhost:${PORT}`);
      console.log(`Runs save to ${path.relative(process.cwd(), RUNS) || RUNS}/<date>/<runId>.json`);
    });
}

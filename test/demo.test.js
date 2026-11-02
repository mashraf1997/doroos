import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from "../src/app.js";

let app, base, jar, dataDir;
before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-'));
  app = createApp({ dataDir, env: { DEMO_MODE: 'true' } });
  base = `http://127.0.0.1:${await app.start(0)}`;
});
after(async () => {
  await app.stop();
  fs.rmSync(dataDir, { recursive: true, force: true });
});
async function call(p, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(base + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(auth && jar ? { cookie: jar } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}
async function signIn() {
  const s = await call('/api/session', { auth: false });
  assert.deepEqual(s.body.demo, { password: 'demo1234', resetMinutes: 60 });
  assert.equal(s.body.needsSetup, false, 'the demo is ready to use');
  assert.equal((await call('/api/setup', { method: 'POST', body: { password: 'takeover-123' }, auth: false })).status, 403);
  const r = await call('/api/login', { method: 'POST', body: { password: 'demo1234' }, auth: false });
  assert.equal(r.status, 200);
  jar = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/password', { method: 'POST', body: { current: 'demo1234', next: 'changed-pass-1' } })).status, 403);
}

test('demo: an academy with courses, students and a transfer waiting', async () => {
  await signIn();
  const o = await call('/api/overview');
  assert.equal(o.body.courses.length, 3);
  assert.equal(o.body.pending, 1);
  assert.ok(o.body.revenueTotal > 0);
  const s = await call('/api/s/login', { method: 'POST', body: { login: 'student1@example.com', password: 'student1234' }, auth: false });
  assert.equal(s.status, 200);
  assert.equal((await call('/api/upload?kind=video', { method: 'POST', body: {} })).status, 403, 'no video uploads in the demo');
  assert.equal((await fetch(base + '/c/product-photos')).status, 200);
});

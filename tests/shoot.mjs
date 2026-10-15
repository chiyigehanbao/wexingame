/**
 * 用本机 Chrome 打开预览页并截图。用法：node tests/shoot.mjs <baseUrl> <outDir>
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2];
const outDir = process.argv[3];
const chrome = process.argv[4];
mkdirSync(outDir, { recursive: true });

const profile = join(tmpdir(), `xty-chrome-${Date.now()}`);
const proc = spawn(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  `--user-data-dir=${profile}`,
  '--remote-debugging-port=9333',
  '--window-size=375,812',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function debuggerUrl() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch('http://127.0.0.1:9333/json/version');
      const json = await res.json();
      if (json.webSocketDebuggerUrl) {
        return json.webSocketDebuggerUrl;
      }
    } catch (e) {
      await sleep(150);
    }
  }
  throw new Error('chrome devtools not ready');
}

const ws = new WebSocket(await debuggerUrl());
await new Promise((r) => { ws.addEventListener('open', r); });

let seq = 0;
const waiters = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && waiters.has(msg.id)) {
    waiters.get(msg.id)(msg);
    waiters.delete(msg.id);
  }
});
function send(method, params = {}, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    waiters.set(id, (msg) => (msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)));
    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }
    ws.send(JSON.stringify(payload));
  });
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const cdp = (method, params) => send(method, params, sessionId);

await cdp('Page.enable');
await cdp('Network.enable');
await cdp('Network.setCacheDisabled', { cacheDisabled: true });
await cdp('Emulation.setDeviceMetricsOverride', {
  width: 375, height: 812, deviceScaleFactor: 2, mobile: true,
});
await cdp('Page.navigate', { url: `${base}/tests/preview.html` });
await sleep(350);

async function shot(name) {
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(outDir, name), Buffer.from(data, 'base64'));
  console.log('shot', name);
}
async function mouse(type, x, y) {
  await cdp('Input.dispatchMouseEvent', {
    type, x, y, button: 'left', clickCount: 1,
  });
}
async function tap(x, y) {
  await mouse('mousePressed', x, y);
  await sleep(60);
  await mouse('mouseReleased', x, y);
  await sleep(80);
}
async function drag(x0, y, x1) {
  await mouse('mousePressed', x0, y);
  for (let i = 1; i <= 10; i += 1) {
    await sleep(30);
    await mouse('mouseMoved', x0 + ((x1 - x0) * i) / 10, y);
  }
  await sleep(40);
  await mouse('mouseReleased', x1, y);
}

await shot('01-title-in.png');
await sleep(900);
await shot('01-title.png');
await tap(187, 500);
await sleep(1600);
await shot('02-play.png');

await mouse('mousePressed', 187, 520);
for (let i = 1; i <= 8; i += 1) {
  await sleep(40);
  await mouse('mouseMoved', 187 - i * 18, 520);
}
await sleep(120);
await shot('03-dragging.png');
await mouse('mouseReleased', 40, 520);
await sleep(180);
await shot('04-delta.png');
await sleep(1000);
await shot('05-next.png');

const quick = process.argv.includes('--quick');
for (let n = 0; n < (quick ? 0 : 45); n += 1) {
  const right = n % 2 === 0;
  await drag(187, 500, right ? 340 : 30);
  await sleep(520);
}
await sleep(1500);
await shot('05-ending.png');
await tap(125, 740);
await sleep(900);
await shot('06-archive.png');

ws.close();
proc.kill();
process.exit(0);

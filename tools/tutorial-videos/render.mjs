import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve(process.argv[2] || 'tutorial2.html');
const outPath = path.resolve(process.argv[3] || 'tutorial2.mp4');
const FPS = Number(process.argv[4] || 30);
const DT_MS = 1000 / FPS;

const tmpVideo = outPath.replace(/\.mp4$/i, '.tmp.mp4');
const tmpWav = outPath.replace(/\.mp4$/i, '.tmp.wav');

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1
});

const page = await context.newPage();

// Virtual clock + OfflineAudioContext hook
await page.addInitScript(() => {
  const baseNow = Date.now();
  let vt = 0;
  let nextId = 1;
  let rafs = [];
  const timers = new Map();

  window.performance.now = () => vt;
  Date.now = () => baseNow + Math.floor(vt);

  window.requestAnimationFrame = (cb) => {
    const id = nextId++;
    rafs.push({ id, cb });
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    rafs = rafs.filter(r => r.id !== id);
  };

  window.setTimeout = (fn, delay = 0, ...args) => {
    const id = nextId++;
    timers.set(id, { fn, args, next: vt + Math.max(0, Number(delay) || 0), interval: null });
    return id;
  };
  window.clearTimeout = (id) => timers.delete(id);

  window.setInterval = (fn, delay = 0, ...args) => {
    const id = nextId++;
    const iv = Math.max(1, Number(delay) || 1);
    timers.set(id, { fn, args, next: vt + iv, interval: iv });
    return id;
  };
  window.clearInterval = (id) => timers.delete(id);

  window.__stepFrame = (dtMs) => {
    vt += dtMs;
    // Fire due timers
    for (const [id, t] of [...timers.entries()]) {
      if (!timers.has(id)) continue;
      while (t.next <= vt) {
        try { t.fn(...t.args); } catch (e) {}
        if (t.interval === null || !timers.has(id)) {
          timers.delete(id);
          break;
        }
        t.next += t.interval;
      }
    }
    // Fire rAFs
    const batch = rafs;
    rafs = [];
    for (const r of batch) {
      try { r.cb(vt); } catch (e) {}
    }
  };

  const OrigOffline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  window.__realAc = null;
  const FakeAC = function () {
    if (!window.__realAc) {
      // 120s max buffer at 44.1kHz stereo
      window.__realAc = new OrigOffline(2, 44100 * 120, 44100);
    }
    const real = window.__realAc;
    return new Proxy(real, {
      get(target, prop) {
        if (prop === 'currentTime') return vt / 1000;
        if (prop === 'resume') return () => Promise.resolve();
        const val = Reflect.get(target, prop, target);
        return typeof val === 'function' ? val.bind(target) : val;
      }
    });
  };
  window.AudioContext = FakeAC;
  window.webkitAudioContext = FakeAC;

  window.__renderAudioBase64 = async (durationSec) => {
    const ac = window.__realAc;
    if (!ac) return null;
    const rendered = await ac.startRendering();
    const numCh = rendered.numberOfChannels;
    const sr = rendered.sampleRate;
    const len = Math.min(rendered.length, Math.ceil(durationSec * sr));
    const buf = new ArrayBuffer(44 + len * numCh * 2);
    const view = new DataView(buf);
    const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + len * numCh * 2, true);
    writeStr(8, 'WAVEfmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, len * numCh * 2, true);
    const chs = Array.from({ length: numCh }, (_, c) => rendered.getChannelData(c));
    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < numCh; c++) {
        const s = Math.max(-1, Math.min(1, chs[c][i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
      }
    }
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  };
});

await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

// Start animation + audio
await page.click('#stage');
const duration = await page.evaluate(() => (typeof tl !== 'undefined' ? tl.duration() / (tl.timeScale() || 1) : 91));
const totalDuration = duration + 1.0;
const totalFrames = Math.ceil(totalDuration * FPS);
console.log(`Rendering ${totalDuration.toFixed(2)}s @ ${FPS}fps (${totalFrames} frames)...`);

const ff = spawn('ffmpeg', [
  '-y',
  '-f', 'image2pipe',
  '-vcodec', 'png',
  '-r', String(FPS),
  '-i', '-',
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-preset', 'medium',
  '-crf', '18',
  tmpVideo
], { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < totalFrames; i++) {
  await page.evaluate((dt) => window.__stepFrame(dt), DT_MS);
  const png = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) {
    await new Promise(r => ff.stdin.once('drain', r));
  }
  if ((i + 1) % 300 === 0 || i === totalFrames - 1) {
    console.log(`Frame ${i + 1}/${totalFrames}`);
  }
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg video failed ' + c))));

console.log('Rendering audio...');
const b64 = await page.evaluate((d) => window.__renderAudioBase64(d), totalDuration);
await browser.close();

if (b64) {
  fs.writeFileSync(tmpWav, Buffer.from(b64, 'base64'));
  console.log('Muxing audio + video...');
  await new Promise((res, rej) => {
    const mux = spawn('ffmpeg', [
      '-y',
      '-i', tmpVideo,
      '-i', tmpWav,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      outPath
    ], { stdio: 'inherit' });
    mux.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg mux failed ' + c)));
  });
  fs.unlinkSync(tmpVideo);
  fs.unlinkSync(tmpWav);
} else {
  fs.renameSync(tmpVideo, outPath);
}

console.log('Done:', outPath);

#!/usr/bin/env node
/**
 * 给每家店抓「真实探店实拍图」——来自 B 站探店视频封面。
 *
 * 原理：按店名搜索 B 站 → 拿到视频列表 → 用免签名的 view 接口取标题/UP主/封面
 *      → 只保留标题或简介里提到这家店的视频 → 下载封面 → 写 assets/photos.js
 *
 * 用法：node scripts/fetch-photos.mjs [只跑前N家]
 * 产出：assets/photos/<店id>/<BV号>.jpg  +  assets/photos.js
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9341;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const outDir = path.join(root, 'assets', 'photos');
const only = Number(process.argv[2] || 0);

const src = fs.readFileSync(path.join(root, 'assets', 'data.js'), 'utf8');
const { SHOPS } = new Function(src + '\nreturn { SHOPS };')();

const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function launch() {
  return spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--mute-audio',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(root, '_research', '_cdp_bili_photos'),
    '--window-size=1400,1000',
    '--user-agent=' + UA,
    'about:blank'
  ], { stdio: 'ignore' });
}
async function waitPort() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return await r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('chrome 未就绪，检查 CHROME_PATH');
}
function cdp(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  });
  return (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
}

// view 接口免签名
async function view(bvid) {
  try {
    const r = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid, { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } });
    const j = await r.json();
    if (j.code !== 0) return null;
    const d = j.data;
    return { title: d.title, owner: d.owner.name, pic: d.pic.replace(/^http:/, 'https:'), pubdate: d.pubdate, desc: (d.desc || '').slice(0, 600), view: d.stat ? d.stat.view : 0 };
  } catch { return null; }
}

const mainName = n => n.replace(/[（(].*?[)）]/g, '').replace(/\s+/g, '').trim();
const branch = n => { const m = n.match(/[（(](.*?)[)）]/); return m ? m[1].replace(/\s+/g, '') : ''; };

const proc = launch();
let results = {};
const photoPath = path.join(root, 'assets', 'photos.js');
if (fs.existsSync(photoPath)) {
  // 只读回已有数据（用 Function 取），避免重跑覆盖
  try { results = new Function(fs.readFileSync(photoPath, 'utf8') + '\nreturn PHOTOS;')(); } catch {}
}
const done = new Set(Object.keys(results));
if (done.size) console.log('已有 ' + done.size + ' 家，跳过');

(async () => {
  await waitPort();
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  const send = cdp(ws);
  await send('Page.enable');
  await send('Runtime.enable');

  let i = 0;
  for (const shop of SHOPS) {
    i++;
    if (done.has(shop.id)) continue;
    if (only && i > only) break;
    const kw = shop.kw || mainName(shop.name);
    try {
      await send('Page.navigate', { url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(kw) });
      // 等结果卡片渲染出来（最多 12s，出现 >=6 个 BV 就提前走）
      let bvRaw = '';
      for (let k = 0; k < 12; k++) {
        await sleep(900);
        const r0 = await send('Runtime.evaluate', {
          expression: `(()=>{const s=new Set();document.querySelectorAll('a[href*="/video/BV"]').forEach(a=>{const m=(a.getAttribute('href')||'').match(/BV[0-9A-Za-z]{10}/);if(m)s.add(m[0])});return [...s].join(',')})()`,
          returnByValue: true
        });
        bvRaw = (r0.result && r0.result.value) || '';
        if (bvRaw.split(',').filter(Boolean).length >= 6) break;
      }
      const r = { result: { value: bvRaw } };
      const bvs = ((r.result && r.result.value) || '').split(',').filter(Boolean).slice(0, 14);
      const mn = mainName(shop.name);
      const br = branch(shop.name);
      const picked = [];
      for (const bv of bvs) {
        const v = await view(bv);
        await sleep(120);
        if (!v) continue;
        const text = v.title + ' ' + v.desc;
        const hitMain = mn.length >= 3 && text.includes(mn);
        const hitBranch = br && text.includes(br) && text.includes('顺德');
        if (!hitMain && !hitBranch) continue;
        picked.push({ bv, ...v, why: hitMain ? mn : br });
        if (picked.length >= 3) break;
      }
      if (!picked.length) { console.log('· 没图  ' + shop.name + '  (搜到 ' + bvs.length + ' 条，无一提到店名)'); results[shop.id] = []; continue; }

      const dir = path.join(outDir, shop.id);
      fs.mkdirSync(dir, { recursive: true });
      const arr = [];
      for (const p of picked) {
        const url = p.pic + '@640w_400h_1c.jpg';
        const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } })).arrayBuffer());
        const file = p.bv + '.jpg';
        fs.writeFileSync(path.join(dir, file), buf);
        arr.push({ src: 'assets/photos/' + shop.id + '/' + file, bv: p.bv, up: p.owner, title: p.title, date: new Date(p.pubdate * 1000).toISOString().slice(0, 10) });
      }
      results[shop.id] = arr;
      console.log('✓ ' + shop.name + '  → ' + arr.length + ' 张 (' + arr.map(a => a.bv).join(' ') + ')');
    } catch (e) {
      console.log('! 失败 ' + shop.name + ' : ' + e.message);
      results[shop.id] = results[shop.id] || [];
    }
    // 每 5 家写一次盘
    if (i % 5 === 0) writeOut(results);
  }
  writeOut(results);
  const n = Object.values(results).reduce((a, b) => a + b.length, 0);
  console.log('\n完成：' + Object.keys(results).length + ' 家，' + n + ' 张图');
  ws.close(); proc.kill(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); proc.kill(); process.exit(1); });

function writeOut(obj) {
  const body = '/* 真实探店实拍图：来自 B 站探店视频封面，bv 可点开核对。自动生成，勿手改。 */\nconst PHOTOS = ' +
    JSON.stringify(obj, null, 1) + ';\n';
  fs.writeFileSync(path.join(root, 'assets', 'photos.js'), body, 'utf8');
}

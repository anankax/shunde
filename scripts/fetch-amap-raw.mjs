#!/usr/bin/env node
/**
 * 第一步：把高德 POI 相册的原始图抓到 _staging/<shopId>/ 下，并记录 POI 元信息。
 * 这一版只负责「多抓」，不作为最终入库——后面要人工逐张过一眼，
 * 把门头、菜单、室内空景、自拍剔掉，再压图编号写 assets/photos-amap.js。
 *
 * 用法：node scripts/fetch-amap-raw.mjs <KEY>
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.argv[2] || process.env.AMAP_KEY;
if (!KEY) { console.error('缺 key'); process.exit(1); }

const root = path.resolve(import.meta.dirname, '..');
const stage = path.join(root, '_staging');
const { SHOPS } = new Function(fs.readFileSync(path.join(root, 'assets', 'data.js'), 'utf8') + '\nreturn { SHOPS };')();

const sleep = ms => new Promise(r => setTimeout(r, ms));
const CENTER = { lat: 22.812, lng: 113.245 };
const mainName = n => n.replace(/[（(].*?[)）]/g, '').replace(/\s+/g, '').trim();
const dist = (a, b) => Math.hypot((a.lng - b.lng) * 111 * Math.cos(a.lat * Math.PI / 180), (a.lat - b.lat) * 111);

const norm = v => Array.isArray(v) ? v.join(' ') : (v || '');

async function search(kw) {
  const url = 'https://restapi.amap.com/v3/place/text?' + new URLSearchParams({
    key: KEY, keywords: kw, city: '佛山', citylimit: 'true',
    offset: '10', page: '1', extensions: 'all', output: 'JSON'
  });
  const j = await (await fetch(url)).json();
  if (j.status !== '1') throw new Error(j.info + '/' + j.infocode);
  return (j.pois || []).map(p => {
    const [lng, lat] = String(p.location || '0,0').split(',').map(Number);
    return {
      name: norm(p.name), id: p.id, lat, lng, addr: norm(p.address),
      tel: norm(p.tel), type: norm(p.type),
      photos: (p.photos || []).map(x => ({ title: norm(x.title), url: norm(x.url) })).filter(x => x.url)
    };
  });
}

function pick(list, shop) {
  const mn = mainName(shop.name);
  return list.map(p => ({
    p, s: (p.name.includes(mn) ? 0 : 1) * 10 + dist(p, shop) * 0.1
  })).sort((a, b) => a.s - b.s)[0]?.['p'] || null;
}

fs.mkdirSync(stage, { recursive: true });
const metaPath = path.join(stage, 'meta.json');
const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};

(async () => {
  let got = 0, none = 0;
  for (const shop of SHOPS) {
    if (meta[shop.id]?.photos?.length) { got++; continue; }
    try {
      const list = await search(shop.kw || mainName(shop.name));
      const best = pick(list, shop);
      if (!best) { console.log('· 没搜到   ' + shop.name); meta[shop.id] = { poi: null, photos: [] }; none++; continue; }
      if (!best.photos.length) { console.log('· 无相册   ' + shop.name + '  (命中 ' + best.name + ')'); meta[shop.id] = { poi: best.name, addr: best.addr, photos: [] }; none++; continue; }

      const dir = path.join(stage, shop.id);
      fs.mkdirSync(dir, { recursive: true });
      const arr = [];
      for (let i = 0; i < Math.min(best.photos.length, 10); i++) {
        const ph = best.photos[i];
        const u = ph.url.replace(/^http:/, 'https:');
        try {
          const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.amap.com/' } });
          if (!r.ok) continue;
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length < 5000) continue;
          const file = 'raw_' + (i + 1) + '.jpg';
          fs.writeFileSync(path.join(dir, file), buf);
          arr.push({ file, title: ph.title, url: u, bytes: buf.length });
        } catch { }
        await sleep(80);
      }
      meta[shop.id] = { poi: best.name, addr: best.addr, tel: best.tel, type: best.type, lat: best.lat, lng: best.lng, photos: arr };
      if (arr.length) { got++; console.log('✓ ' + shop.name.padEnd(18, '　') + ' ' + arr.length + ' 张 ← ' + best.name); }
      else { none++; console.log('· 下载全失败 ' + shop.name); }
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1));
    } catch (e) {
      console.log('! ' + shop.name + ' : ' + e.message);
      none++;
    }
    await sleep(180);
  }
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1));
  console.log('\n完成：' + got + ' 家有图，' + none + ' 家没有');
})();

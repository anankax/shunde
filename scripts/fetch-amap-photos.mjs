#!/usr/bin/env node
/**
 * 抓「高德地图」上这家店的真实评价返图（POI 相册）。
 *
 * 为什么需要 key：高德网页版的 POI 详情/相册接口有登录态与风控（实测跳滑块验证），
 * 唯一稳定的正路是开放平台的 Web 服务 API。个人开发者免费额度足够跑完这份清单。
 *
 * 用法：
 *   1. https://lbs.amap.com 注册 → 控制台 → 应用管理 → 创建应用 → 添加 Key
 *      服务平台选「Web服务」，不用填域名
 *   2. node scripts/fetch-amap-photos.mjs 你的KEY
 *      或 AMAP_KEY=你的KEY node scripts/fetch-amap-photos.mjs
 *
 * 产出：
 *   assets/photos-amap/<店id>/<序号>.jpg     高德 POI 相册原图
 *   assets/photos-amap.js                    索引（含图片来源与标题）
 *
 * 前端会优先显示高德相册，没有的再回落到 B 站探店视频实拍（assets/photos.js）。
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.argv[2] || process.env.AMAP_KEY;
if (!KEY) {
  console.error('缺少高德 Key。用法：node scripts/fetch-amap-photos.mjs 你的KEY');
  process.exit(1);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const outDir = path.join(root, 'assets', 'photos-amap');
const src = fs.readFileSync(path.join(root, 'assets', 'data.js'), 'utf8');
const { SHOPS } = new Function(src + '\nreturn { SHOPS };')();

const sleep = ms => new Promise(r => setTimeout(r, ms));
const CENTER = { lat: 22.812, lng: 113.245 };
const mainName = n => n.replace(/[（(].*?[)）]/g, '').replace(/\s+/g, '').trim();
const dist = (a, b) => {
  const dx = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  const dy = (a.lat - b.lat) * 111;
  return Math.hypot(dx, dy);
};

async function search(keyword) {
  const url = 'https://restapi.amap.com/v3/place/text?' + new URLSearchParams({
    key: KEY, keywords: keyword, city: '佛山', citylimit: 'true',
    offset: '10', page: '1', extensions: 'all', output: 'JSON'
  });
  const json = await (await fetch(url)).json();
  if (json.status !== '1') throw new Error('高德返回 ' + json.info + ' / ' + json.infocode);
  return (json.pois || []).map(p => {
    const [lng, lat] = String(p.location || '0,0').split(',').map(Number);
    return {
      name: p.name, id: p.id, lat, lng, addr: p.address,
      photos: (p.photos || []).map(x => ({ title: x.title || '', url: x.url }))
    };
  });
}

/** 挑最可能是同一家的那条 POI：名字含主名，且离顺德中心近 */
function pick(list, shop) {
  const mn = mainName(shop.name);
  const scored = list.map(p => ({
    p,
    s: (p.name.includes(mn) ? 0 : 1) * 10 + dist(p, shop.lat && shop.lng ? shop : CENTER) * 0.1
  })).sort((a, b) => a.s - b.s);
  return scored.length ? scored[0].p : null;
}

const outPath = path.join(root, 'assets', 'photos-amap.js');
let db = {};
if (fs.existsSync(outPath)) {
  try { db = new Function(fs.readFileSync(outPath, 'utf8') + '\nreturn AMAP_PHOTOS;')(); } catch {}
}

function writeDB() {
  fs.writeFileSync(outPath,
    '/* 高德地图 POI 相册原图，由 scripts/fetch-amap-photos.mjs 生成。图注/来源可点进高德核对。 */\nconst AMAP_PHOTOS = ' +
    JSON.stringify(db, null, 1) + ';\n', 'utf8');
}

(async () => {
  let ok = 0, none = 0;
  for (const shop of SHOPS) {
    if (db[shop.id] && db[shop.id].length) { ok++; continue; }
    const kw = shop.kw || mainName(shop.name);
    try {
      const list = await search(kw);
      const best = pick(list, shop);
      if (!best || !best.photos.length) {
        console.log('· 无相册  ' + shop.name + (best ? '（命中 ' + best.name + '，没图）' : '（没搜到）'));
        db[shop.id] = [];
        none++;
        await sleep(150);
        continue;
      }
      const dir = path.join(outDir, shop.id);
      fs.mkdirSync(dir, { recursive: true });
      const arr = [];
      for (let i = 0; i < Math.min(best.photos.length, 4); i++) {
        const ph = best.photos[i];
        const u = ph.url.replace(/^http:/, 'https:');
        try {
          const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.amap.com/' } });
          if (!r.ok) continue;
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length < 3000) continue;
          const file = (i + 1) + '.jpg';
          fs.writeFileSync(path.join(dir, file), buf);
          arr.push({ src: 'assets/photos-amap/' + shop.id + '/' + file, title: ph.title, from: 'amap', poi: best.id });
        } catch {}
        await sleep(120);
      }
      db[shop.id] = arr;
      if (arr.length) { ok++; console.log('✓ ' + shop.name + '  → ' + arr.length + ' 张（' + best.name + '）'); }
      else { none++; console.log('· 图片下载失败 ' + shop.name); }
    } catch (e) {
      console.log('! ' + shop.name + ' : ' + e.message);
      db[shop.id] = db[shop.id] || [];
    }
    await sleep(150);
    if (ok % 8 === 0) writeDB();
  }
  writeDB();
  console.log('\n完成：' + ok + ' 家有图，' + none + ' 家没有');
  console.log('已写入 assets/photos-amap.js，刷新页面即生效。');
})();

#!/usr/bin/env node
/**
 * 定向重抓：把第一轮匹配错的、没相册的店，用更准的关键词重搜，
 * 并按「店名包含 + 地址字串重合」挑 POI，而不是按距离（data.js 里的坐标是手写近似值）。
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.argv[2] || process.env.AMAP_KEY;
const root = path.resolve(import.meta.dirname, '..');
const stage = path.join(root, '_staging');
const { SHOPS } = new Function(fs.readFileSync(path.join(root, 'assets', 'data.js'), 'utf8') + '\nreturn { SHOPS };')();
const meta = JSON.parse(fs.readFileSync(path.join(stage, 'meta.json'), 'utf8'));

const OVERRIDE = {
  zhuroupo: '猪肉婆私房菜 容桂', huangdanji: '黄但记 陈村', dabanqiao: '大板桥农庄 杏坛',
  dongyiwan: '东逸湾酒店 容桂', fengchengyupi: '凤城鱼皮 大良', xiongdi: '兄弟干蒸排骨 羊额',
  zizhenggong: '滋整公 干蒸排骨饭', aduo: '阿多私房菜 勒流', niuzhan: '牛展煲仔饭 大良',
  guyue: '金榜古月鱼皮', taigenbao: '太艮堡毋米粥', shunderenjia: '顺德人家 太艮路',
  shuixiantou: '水仙头私房菜 容桂', xiangjiang: '香江饭店 大良', jufu: '聚福山庄 勒流',
  maijiazhuang: '麦家庄 陈村', xile: '喜乐茶档 陈村', moshijibao: '莫氏鸡煲 陈村',
  weikedaoo: '味可道 容桂', dadi: '大地醉鹅 大良', damengong: '大门公 容桂',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = v => Array.isArray(v) ? v.join(' ') : (v || '');
const mainName = n => n.replace(/[（(].*?[)）]/g, '').replace(/\s+/g, '').trim();
const BAD = /停车场|出入口|公交|地铁|有限公司|食品公司|练习场|大道$/;
const addrKey = a => (a || '').replace(/[\s（）()·,，、\-—]/g, '');

function score(p, shop) {
  const mn = mainName(shop.name);
  const pn = p.name.replace(/[\s（）()·\-—]/g, '');
  let s = 0;
  if (BAD.test(p.name)) return -99;
  if (pn.includes(mn)) s += 10;
  else if (mn.startsWith(pn) || pn.startsWith(mn.slice(0, Math.min(4, mn.length)))) s += 3;
  else s -= 6;
  // 地址重合字数
  const a = addrKey(shop.addr), b = addrKey(p.addr);
  for (let i = 0; i + 4 <= a.length; i++) if (b.includes(a.slice(i, i + 2))) s += 0.35;
  return s;
}

async function search(kw) {
  const url = 'https://restapi.amap.com/v3/place/text?' + new URLSearchParams({
    key: KEY, keywords: kw, city: '佛山', citylimit: 'true',
    offset: '10', page: '1', extensions: 'all', output: 'JSON'
  });
  const j = await (await fetch(url)).json();
  if (j.status !== '1') throw new Error(j.info + '/' + j.infocode);
  return (j.pois || []).map(p => {
    const [lng, lat] = String(p.location || '0,0').split(',').map(Number);
    return { name: norm(p.name), id: p.id, lat, lng, addr: norm(p.address), tel: norm(p.tel),
      photos: (p.photos || []).map(x => ({ title: norm(x.title), url: norm(x.url) })).filter(x => x.url) };
  });
}

(async () => {
  for (const [id, kw] of Object.entries(OVERRIDE)) {
    const shop = SHOPS.find(s => s.id === id);
    if (!shop) { console.log('? 没有这个店 ' + id); continue; }
    try {
      const list = (await search(kw)).map(p => ({ p, s: score(p, shop) })).sort((a, b) => b.s - a.s);
      const best = list[0];
      if (!best || best.s < 3) { console.log('· 仍没匹配上 ' + shop.name + '  最佳候选：' + (best ? best.p.name + '（' + best.s.toFixed(1) + '）' : '无')); continue; }
      const p = best.p;
      if (!p.photos.length) { console.log('· 仍无相册 ' + shop.name + ' （' + p.name + '）'); meta[id] = { ...(meta[id] || {}), poi: p.name, addr: p.addr, photos: [] }; continue; }

      const dir = path.join(stage, id);
      fs.mkdirSync(dir, { recursive: true });
      for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
      const arr = [];
      for (let i = 0; i < Math.min(p.photos.length, 10); i++) {
        const u = p.photos[i].url.replace(/^http:/, 'https:');
        try {
          const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.amap.com/' } });
          if (!r.ok) continue;
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length < 5000) continue;
          const file = 'raw_' + (i + 1) + '.jpg';
          fs.writeFileSync(path.join(dir, file), buf);
          arr.push({ file, title: p.photos[i].title, url: u, bytes: buf.length });
        } catch { }
        await sleep(80);
      }
      meta[id] = { poi: p.name, addr: p.addr, tel: p.tel, lat: p.lat, lng: p.lng, photos: arr };
      console.log('✓ ' + shop.name.padEnd(16, '　') + arr.length + ' 张 ← ' + p.name + ' | ' + p.addr + '（' + best.s.toFixed(1) + '）');
    } catch (e) { console.log('! ' + shop.name + ' : ' + e.message); }
    await sleep(220);
  }
  fs.writeFileSync(path.join(stage, 'meta.json'), JSON.stringify(meta, null, 1));
})();

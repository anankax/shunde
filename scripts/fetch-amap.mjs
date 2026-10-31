#!/usr/bin/env node
/**
 * 用高德开放平台「Web 服务 API」给店铺补真实的评分 / 人均 / 坐标 / 营业时间。
 *
 * 用法：
 *   1. 到 https://lbs.amap.com 申请「Web服务」类型的 Key（个人开发者免费额度够用）
 *   2. node scripts/fetch-amap.mjs 你的KEY
 *      或  AMAP_KEY=你的KEY node scripts/fetch-amap.mjs
 *
 * 产出：assets/amap-enrich.json
 *   { "minxin": { "rating": 4.3, "cost": "25.00", "lat": 22.8410, "lng": 113.2920, "open": "08:00-23:30" } }
 *
 * 注意：
 *   - 高德 v3/place/text 的 extensions=all 才返回 biz_ext（评分/人均）
 *   - 同名店很多，脚本会按「关键词命中 + 距离最近的顺德 POI」挑一条，
 *     结果请人工过一眼再用，别直接信。
 *   - 大众点评必吃榜、美团没有对第三方开放榜单 API，这个脚本拿不到它们的榜单，
 *     那部分只能走公开名单人工录入（见 assets/data.js 里的 MUST_EAT）。
 */

import fs from 'node:fs';
import path from 'node:path';

const KEY = process.argv[2] || process.env.AMAP_KEY;
if (!KEY) {
  console.error('缺少高德 Key。用法：node scripts/fetch-amap.mjs 你的KEY');
  process.exit(1);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const dataPath = path.join(root, 'assets', 'data.js');
const outPath = path.join(root, 'assets', 'amap-enrich.json');

// data.js 不是 ES module，用 Function 包一层取数据
const src = fs.readFileSync(dataPath, 'utf8');
const { SHOPS } = new Function(src + '\nreturn { SHOPS };')();

const SHUNDE_CENTER = { lat: 22.812, lng: 113.245 };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function dist(a, b) {
  const dx = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  const dy = (a.lat - b.lat) * 111;
  return Math.sqrt(dx * dx + dy * dy);
}

async function query(keyword) {
  const url = 'https://restapi.amap.com/v3/place/text?' + new URLSearchParams({
    key: KEY,
    keywords: keyword,
    city: '佛山',
    citylimit: 'true',
    offset: '10',
    page: '1',
    extensions: 'all',
    output: 'JSON'
  });
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== '1') throw new Error('高德返回错误：' + (json.info || '') + ' ' + (json.infocode || ''));
  return (json.pois || []).map(p => {
    const [lng, lat] = String(p.location || '0,0').split(',').map(Number);
    const biz = p.biz_ext || {};
    return {
      name: p.name,
      addr: p.address,
      lat, lng,
      tel: p.tel || null,
      rating: biz.rating ? Number(biz.rating) : null,
      cost: biz.cost || null,
      open: biz.opentime2 || biz.opentime || null,
      type: p.type
    };
  });
}

const out = {};
let hit = 0, miss = 0;

for (const shop of SHOPS) {
  const kw = shop.kw || shop.name;
  try {
    const list = await query(kw);
    if (!list.length) {
      console.log('✗ 没搜到   ', shop.name);
      miss++;
      await sleep(120);
      continue;
    }
    // 优先选名字包含门店主名的，其次按离顺德中心距离排序
    const mainName = shop.name.replace(/[（(].*?[)）]/g, '').slice(0, 4);
    list.sort((a, b) => {
      const sa = a.name.includes(mainName) ? 0 : 1;
      const sb = b.name.includes(mainName) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return dist(a, SHUNDE_CENTER) - dist(b, SHUNDE_CENTER);
    });
    const best = list[0];
    out[shop.id] = best;
    hit++;
    console.log(
      '✓ ' + shop.name.padEnd(22, '　').slice(0, 22) +
      ' → ' + (best.name || '').padEnd(18, '　').slice(0, 18) +
      ' 评分 ' + (best.rating ?? '—') +
      ' 人均 ' + (best.cost ?? '—') +
      ' @ ' + best.lat.toFixed(4) + ',' + best.lng.toFixed(4)
    );
  } catch (e) {
    console.log('! 失败     ', shop.name, e.message);
    miss++;
  }
  await sleep(120); // 别把免费额度打太快
}

fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('\n完成：命中 ' + hit + ' 家，缺失 ' + miss + ' 家');
console.log('结果写入 ' + path.relative(root, outPath) + '，核对无误后再合并进 data.js。');

/* ==========================================================
   顺德寻味地图 · 交互层
   底图：高德地图瓦片（无需申请 key）
   若需要官方 SDK 的精准 POI / 路径规划，可把 CONFIG.amapKey
   填上高德 Web JS API 的 key，另接即可，瓦片模式不受影响。
   ========================================================== */

const CONFIG = {
  center: [22.8220, 113.2720],
  // 12 在 16:9 的屏上横向能看到 37 公里，从番禺一直看到中山，顺德反而成了中间一小块；
  // 13 大约 18 公里，起手就是大良+容桂，其余镇街拖一下就到。
  zoom: 13,
  tileStandard: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
  tileSatellite: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
};

const ANCHORS = [
  ['大良', 22.8405, 113.2910], ['容桂', 22.7780, 113.2855],
  ['伦教', 22.8700, 113.2500], ['陈村', 22.9650, 113.1450],
  ['勒流', 22.8560, 113.1800], ['杏坛', 22.7900, 113.1450],
  ['均安', 22.7480, 113.1180]
];

const state = {
  cat: 'all', area: 'all', q: '', activeId: null, focusId: null,
  satellite: false, view: 'map', creator: 'all',
  origin: null, radius: 0, nearSort: false   // 出发点 / 距离筛选(km) / 按远近排
};

let map = null, markerLayer = null, anchorLayer = null, activeTileLayer = null, focusLayer = null;
let originLayer = null;
let markers = {};
const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

/* ---------------- 小工具 ---------------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function normalize(s) {
  return String(s).toLowerCase().replace(/[\s·（）()]/g, '');
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
}
function filtered() {
  const q = normalize(state.q);
  let list = SHOPS.filter(s => {
    if (state.cat !== 'all' && s.cat !== state.cat) return false;
    if (state.area !== 'all' && s.area !== state.area) return false;
    if (state.creator !== 'all' && !(s.visited || []).some(v => v.cid === state.creator)) return false;
    if (!q) return true;
    const who = (s.visited || []).map(v => v.name).join('');
    // kw / navKw 是高德导航用的别名关键词（含旧店名、地标、村名），搜「大良毋米粥」「顺博创意园」也能命中
    const hay = normalize([s.name, s.area, s.addr, s.desc, s.sig.join(''), catMap[s.cat].name,
      s.featured || '', who, s.kw || '', s.navKw || '', s.tip || ''].join(' '));
    return hay.includes(q);
  });
  // 设了出发点、又选了距离，就只留这个圈里的
  if (state.origin && state.radius > 0) {
    list = list.filter(s => distKm(state.origin, s) <= state.radius);
  }
  // 按镇街聚拢，逛起来不用来回横跳；要看「离我最近」就改成按距离排
  if (state.origin && state.nearSort) {
    return list
      .map((s, i) => ({ s, i, d: distKm(state.origin, s) }))
      .sort((a, b) => (a.d - b.d) || (a.i - b.i))
      .map(x => x.s);
  }
  const order = Object.fromEntries(AREAS.map((a, i) => [a, i]));
  return list
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (order[a.s.area] - order[b.s.area]) || (a.i - b.i))
    .map(x => x.s);
}
function relevantSources(shop) {
  const out = [];
  const sig = shop.sig.join('');
  if (shop.cat === 'fish' || /鱼生|鱼皮|鱼骨/.test(sig)) out.push(SOURCES[0]);
  if (['roast', 'rice', 'snack', 'beef', 'noodle'].includes(shop.cat)) out.push(SOURCES[1]);
  if (['private', 'farm'].includes(shop.cat) || /打边炉|桑拿|蒸猪|白切|盐水鸡/.test(sig)) out.push(SOURCES[2]);
  return out.filter((v, i, a) => a.indexOf(v) === i);
}

/* ---------------- 地图 ---------------- */
function addAnchors() {
  if (!anchorLayer) return;
  anchorLayer.clearLayers();
  ANCHORS.forEach(([n, lat, lng]) => {
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'anchor-lbl',
        html: '<div style="font-size:11px;font-weight:700;color:#9A9288;letter-spacing:2px;' +
              'text-shadow:0 1px 3px #fff,0 0 6px #fff,0 0 10px #fff;white-space:nowrap">' + n + '</div>',
        iconSize: [40, 14], iconAnchor: [20, 7]
      }),
      interactive: false
    }).addTo(anchorLayer);
  });
}

function clusterIcon(cluster) {
  const n = cluster.getChildCount();
  const size = n < 10 ? 34 : n < 20 ? 40 : 46;
  return L.divIcon({
    className: 'cl-wrap',
    html: '<div class="cl-badge" style="width:' + size + 'px;height:' + size + 'px">' + n + '</div>',
    iconSize: [size, size]
  });
}

function initMap() {
  const host = document.getElementById('map');
  if (typeof L === 'undefined') {
    host.innerHTML =
      '<div style="display:grid;place-items:center;height:100%;text-align:center;padding:40px;' +
      'font-size:14px;line-height:2;color:#6B645B">地图组件没能加载（大概率是网络受限）。<br>' +
      '左侧店铺列表和全部资料照常可用，<br>点任意一家店，「高德地图导航」可以直接跳过去。</div>';
    return;
  }

  map = L.map('map', {
    center: CONFIG.center, zoom: CONFIG.zoom,
    zoomControl: false, attributionControl: true
  });

  activeTileLayer = L.tileLayer(CONFIG.tileStandard, {
    subdomains: '1234', maxZoom: 18, minZoom: 9,
    attribution: '地图数据 © 高德地图 AutoNavi'
  }).addTo(map);

  // 比例尺：17 级街道图上整屏也就一公里多，没有它容易把「1.3 km」看成一步路
  L.control.scale({ position: 'bottomright', imperial: false, maxWidth: 110 }).addTo(map);

  let tileFails = 0;
  activeTileLayer.on('tileerror', () => {
    if (++tileFails === 6) {
      map.removeLayer(activeTileLayer);
      activeTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '地图数据 © OpenStreetMap'
      }).addTo(map);
    }
  });

  anchorLayer = L.layerGroup().addTo(map);
  focusLayer = L.layerGroup().addTo(map);

  // 有聚合插件就聚合，没有就老老实实铺点
  if (typeof L.markerClusterGroup === 'function') {
    markerLayer = L.markerClusterGroup({
      maxClusterRadius: 48,
      disableClusteringAtZoom: 15,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: clusterIcon
    }).addTo(map);
  } else {
    markerLayer = L.layerGroup().addTo(map);
  }

  addAnchors();
  renderAll();
  drawOrigin();
}

function fitTo(list) {
  if (!map || !list.length) return;
  try {
    const b = L.latLngBounds(list.map(s => [s.lat, s.lng]));
    map.fitBounds(b, { padding: [56, 56], maxZoom: 13, animate: false });
  } catch (e) { /* 忽略 */ }
}

function renderMarkers(list) {
  if (!map || !markerLayer) return;
  markerLayer.clearLayers();
  markers = {};

  list.forEach((shop, i) => {
    const color = catMap[shop.cat].color;
    const mk = L.marker([shop.lat, shop.lng], {
      icon: L.divIcon({
        className: 'mk-wrap',
        html: '<div class="mk" style="background:' + color + '"><span>' + (i + 1) + '</span></div>',
        iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24]
      }),
      riseOnHover: true
    });
    mk.bindPopup(popupHTML(shop, i + 1), { maxWidth: 290, offset: [0, 0] });
    markerLayer.addLayer(mk);
    markers[shop.id] = mk;
  });
}

function popupHTML(shop, no) {
  return '<div class="pop">' +
    '<h3>' + no + '. ' + esc(shop.name) + '</h3>' +
    '<div class="pop-area">' + esc(shop.area) + ' · ' + esc(catMap[shop.cat].name) + ' · ' + esc(shop.price) + '</div>' +
    '<div class="pop-sig">' + shop.sig.slice(0, 3).map(s => '· ' + esc(s)).join('<br>') + '</div>' +
    '<div class="pop-btns">' +
      '<a class="pb-nav" href="' + amapNavLink(shop) + '" target="_blank" rel="noopener">高德导航</a>' +
      '<a class="pb-more" href="javascript:void(0)" data-open="' + shop.id + '">详情 &amp; 视频</a>' +
    '</div></div>';
}

/* 店名里的「（分店名）」单独起一行做小字，避免在一行里被拦腰折断 */
function nameHTML(name) {
  const s = String(name);
  const m = s.match(/^(.*?)[（(](.+?)[)）]\s*$/);
  if (!m) return esc(s);
  return esc(m[1].trim()) + '<span class="nm-sub">' + esc(m[2].trim()) + '</span>';
}

/* 高德 POI 的公开数据（评分/人均/营业时间），见 assets/amap-src.js */
function amapOf(shop) {
  return (window.AMAP_SRC && window.AMAP_SRC[shop.id]) || null;
}

function badgeHTML(shop) {
  let h = '';
  if (shop.badge) h += '<span class="badge-must">★ ' + esc(shop.badge) + '</span>';
  const a = amapOf(shop);
  if (shop.rating) h += '<span class="rate">点评 ' + shop.rating.toFixed(1) + ' 分</span>';
  else if (a && a.r) h += '<span class="rate-am">高德 ' + a.r.toFixed(1) + ' 分</span>';
  return h;
}

/* 站内 9 位博主之外、B 站上点名这家店的公开视频（见 assets/more-videos.js） */
function moreVideos(shop) {
  return (window.MORE_VIDEOS && window.MORE_VIDEOS[shop.id]) || [];
}
function fmtView(n) {
  if (!n) return '—';
  return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + ' 万' : String(n);
}

/* 详情页顶部那条「这家为什么在图上」的来源小标 */
function srcStrip(shop) {
  const chips = [];
  if (shop.badge) chips.push('<span class="src-chip must">★ ' + esc(shop.badge) + '</span>');
  if (shop.rating) chips.push('<span class="src-chip dianping">点评 ' + shop.rating.toFixed(1) + ' 分' +
    (shop.reviews ? ' · ' + shop.reviews.toLocaleString('zh-CN') + ' 评' : '') + '</span>');
  const vs = (shop.visited || []).filter(v => v.url && !/\/search/.test(v.url));
  if (vs.length) {
    chips.push('<span class="src-chip video">' +
      (vs.length === 1 ? esc(vs[0].name) + ' 探过' : vs.length + ' 位博主探过') + '</span>');
  }
  const a = amapOf(shop);
  if (a) {
    const txt = '高德收录' + (a.r ? ' ' + a.r.toFixed(1) + ' 分' : ' 门店');
    chips.push('<a class="src-chip amap" href="https://www.amap.com/detail/' + a.poi +
      '" target="_blank" rel="noopener">' + txt + '</a>');
  }
  if (!chips.length) chips.push('<span class="src-chip none">没有公开榜单或探店记录佐证</span>');
  return '<div class="dw-src">' + chips.join('') + '</div>';
}

/* ---------------- 列表 ---------------- */
function renderList(list) {
  const box = document.getElementById('list');
  document.getElementById('cnt').textContent = list.length;

  if (!list.length) {
    // 空结果别只丢一句「没找到」：给几家招牌店垫底，再给一个一键清空筛选的出口
    // 只看距离这一条把人都筛没了，才用「最近的一家在 X 外」这句；
    // 叠着搜索词或分类时，空的原因可能是别的，别把话说死
    const nearEmpty = state.origin && state.radius > 0 &&
      !state.q && state.cat === 'all' && state.area === 'all' &&
      (!state.creator || state.creator === 'all');
    const byNear = nearEmpty
      ? SHOPS.slice().sort((a, b) => distKm(state.origin, a) - distKm(state.origin, b))
      : null;
    const nearest = byNear ? distKm(state.origin, byNear[0]) : null;
    const sug = byNear ? byNear.slice(0, 3) : SHOPS.filter(s => s.badge || s.rating).slice(0, 3);
    box.innerHTML = '<div class="empty">' +
      (nearEmpty
        ? state.radius + ' km 内没有收录的店。<br>最近的一家在 ' + fmtDist(nearest) + ' 外：'
        : state.q ? '没找到「' + esc(state.q) + '」这家店。<br>换个关键词试试，或者先看看这几家：'
                  : '这个筛选下没有店。<br>把条件放宽一点，或者看看这几家：') +
      '<div class="empty-sug">' + sug.map(s =>
        '<button class="empty-shop" type="button" data-open="' + s.id + '">' +
          esc(s.name) + '<span>' + esc(s.area) + '</span></button>').join('') +
      '</div>' +
      (nearEmpty ? '<button class="empty-reset" type="button" data-geo-off>不限距离，按离我最近排</button>'
                 : '<button class="empty-reset" type="button">清除筛选，看全部 ' + SHOPS.length + ' 家</button>') +
    '</div>';
    return;
  }

  box.innerHTML = list.map((shop, i) => {
    const c = catMap[shop.cat];
    const d = distOf(shop);
    return '<div class="item' + (shop.id === state.activeId ? ' on' : '') + '" data-id="' + shop.id + '">' +
      '<div class="item-top">' +
        '<div class="item-no" style="background:' + c.color + '">' + (i + 1) + '</div>' +
        '<div class="item-name">' + nameHTML(shop.name) + '</div>' +
        ((typeof picRowHTML === 'function') ? picRowHTML(shop) : '') +
        '<a class="item-nav" href="' + amapNavLink(shop) + '" target="_blank" rel="noopener"' +
          ' title="在高德地图搜索「' + esc(shop.kw || shop.name) + '」">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 3 3 10.5l7.5 3L14 21z"/>' +
          '</svg>导航</a>' +
      '</div>' +
      '<div class="item-meta">' +
        (d != null ? '<span class="dist-chip">距你 ' + fmtDist(d) + '</span>' : '') +
        '<span class="tagcat" style="background:' + hexA(c.color, .12) + ';color:' + c.color + '">' + c.name + '</span>' +
        '<span>' + esc(shop.area) + '</span>' +
        badgeHTML(shop) +
        '<span class="item-price">' + esc(shop.price) + '</span>' +
      '</div>' +
      '<div class="item-addr">' + esc(shop.addr) + '</div>' +
      '<div class="item-sig">' + esc(shop.sig.join(' / ')) + '</div>' +
      (shop.visited && shop.visited.length
        ? '<div class="item-visit">' +
            '<span class="iv-lb">探店</span>' +
            shop.visited.map(v => '<span class="vchip" data-cid="' + (v.cid || '') + '">' + esc(v.name) + '</span>').join('') +
          '</div>'
        : '') +
    '</div>';
  }).join('');
}

/* ---------------- 选中联动 ---------------- */
function activate(id) {
  const shop = SHOPS.find(s => s.id === id);
  if (!shop) return;
  state.activeId = id;
  if (history.replaceState) history.replaceState(null, '', '#shop=' + id);

  document.querySelectorAll('.item').forEach(el => el.classList.toggle('on', el.dataset.id === id));
  const el = document.querySelector('.item.on');
  const box = document.getElementById('list');
  if (el && box) {
    const r = el.getBoundingClientRect(), br = box.getBoundingClientRect();
    box.scrollTop += (r.top - br.top) - (box.clientHeight - el.offsetHeight) / 2;
  }

  setFocus(shop);
  openDrawer(shop);
}

/* 选中一家店：直接拉到街道级，并在那个点上打一圈会呼吸的蓝色光圈 + 店名条。
   15 级时店只是一颗和周围几十颗一样的小图钉，看不出「定位到哪了」，所以拉到 17。 */
function setFocus(shop) {
  if (!map) return;
  state.focusId = shop.id;
  if (!focusLayer) focusLayer = L.layerGroup().addTo(map);
  focusLayer.clearLayers();
  document.querySelectorAll('.mk.is-focus').forEach(el => el.classList.remove('is-focus'));

  // 放大之后这家店才从聚合里散出来，所以缩放停了再补一次高亮
  const markDot = () => {
    if (state.activeId !== shop.id) return;   // 连点两家时，前一次的回调别来抢高亮
    const mk = markers[shop.id];
    const el = mk && mk.getElement ? mk.getElement() : null;   // 聚合里的店还没有 DOM
    const dot = el ? el.querySelector('.mk') : null;
    if (dot) dot.classList.add('is-focus');
  };
  markDot();
  map.once('moveend', markDot);

  L.marker([shop.lat, shop.lng], {
    icon: L.divIcon({
      className: 'focus-wrap',
      html: '<div class="focus-glow"></div>' +
            '<div class="focus-ring"></div>' +
            '<div class="focus-ring r2"></div>' +
            '<div class="focus-dot"></div>' +
            '<div class="focus-name">' + esc(shop.name) + '</div>',
      iconSize: [0, 0], iconAnchor: [0, 0]
    }),
    interactive: false, keyboard: false, zIndexOffset: 1500
  }).addTo(focusLayer);

  // 定了位就把「我 → 这家店」拉一条虚线，中间标上直线距离：
  // 光在列表里写「距你 1.3 km」，在 17 级的街道图上看着不像，画出来才知道量的就是这一段
  // 人不在附近就别拉线了：一千公里外那条线会横穿整张图，还没有标签，看着像画错了
  if (state.origin && distKm(state.origin, shop) <= 12) {
    const a = [state.origin.lat, state.origin.lng];
    const b = [shop.lat, shop.lng];
    L.polyline([a, b], {
      color: '#2563EB', weight: 2, opacity: .7, dashArray: '6 7', interactive: false
    }).addTo(focusLayer);
    L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], {
      icon: L.divIcon({
        className: 'dline-wrap',
        html: '<div class="dline">直线 ' + fmtDist(distOf(shop)) + '</div>',
        iconSize: [0, 0], iconAnchor: [0, 0]
      }),
      interactive: false, keyboard: false, zIndexOffset: 1600
    }).addTo(focusLayer);
  }

  flyToShop(shop);
}

/* 把地图飞到这家店。
   手机在「店铺列表」那一栏时地图是 display:none，getSize() 是 0×0，这时 project/unproject
   会算出 NaN，flyTo 直接抛「Invalid LatLng object」，把后面打开抽屉那步一起带崩——
   表现就是「有时候点店不弹详情」。所以没量出尺寸就不飞，飞不动也不能影响开抽屉。 */
function flyToShop(shop) {
  if (!map || !shop) return;
  const size = map.getSize();
  if (!size || !size.x || !size.y) return;
  // 抽屉盖住右边一条，把店挪到剩下那块的正中，别让它躲在抽屉底下
  const dw = document.getElementById('drawer');
  const dwW = (dw && window.innerWidth > 760) ? Math.round(dw.offsetWidth) : 0;
  try {
    // 定了位就把「我」和这家店一起框进画面：只飞到店，人在屏幕外，那条虚线就只剩一截，
    // 反而更看不出 1.5 km 有多远。太远（不在顺德附近）就别框了，否则一屏缩到全国
    if (state.origin && distKm(state.origin, shop) <= 12) {
      map.flyToBounds(L.latLngBounds([state.origin.lat, state.origin.lng], [shop.lat, shop.lng]), {
        maxZoom: 17, duration: .8,
        paddingTopLeft: [40, 40],
        paddingBottomRight: [dwW + 60, 60]
      });
      return;
    }
    const shift = Math.round(dwW / 2);
    const p = map.project(L.latLng(shop.lat, shop.lng), 17).add([shift, 0]);
    map.flyTo(map.unproject(p, 17), 17, { duration: .8 });
  } catch (e) { /* 地图还没准备好，这次不飞 */ }
}

function clearFocus() {
  if (focusLayer) focusLayer.clearLayers();
  document.querySelectorAll('.mk.is-focus').forEach(el => el.classList.remove('is-focus'));
}

/* ---------------- 我现在在哪：定位 / 直线距离 ---------------- */
const GEO_KEY = 'shunde.origin.v1';
let locating = false;      // 正在等浏览器的定位结果
let pickHandler = null;    // 「点地图选位置」临时挂上的点击回调

/* 两点间直线距离（球面大圆距离），单位公里。只用来排序和筛，不是路线长度 */
function distKm(a, b) {
  const rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function fmtDist(km) {
  if (km == null) return '';
  if (km < 1) return Math.round(km * 1000) + ' m';
  if (km < 10) return km.toFixed(1) + ' km';
  return Math.round(km).toLocaleString('zh-CN') + ' km';
}

function distOf(shop) {
  return state.origin ? distKm(state.origin, shop) : null;
}

/* 位置存在本机 localStorage，不上传；下次打开接着用，不用重新定位 */
function saveGeo() {
  try {
    localStorage.setItem(GEO_KEY, JSON.stringify({
      o: state.origin, r: state.radius, s: state.nearSort
    }));
  } catch (e) { /* 隐私模式不给存就算了，不影响本次使用 */ }
}
function loadGeo() {
  try {
    const raw = localStorage.getItem(GEO_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d && d.o && isFinite(d.o.lat) && isFinite(d.o.lng)) {
      const r = +d.r;
      state.origin = { lat: +d.o.lat, lng: +d.o.lng };
      state.radius = [0, 2, 5, 10].includes(r) ? r : 0;   // 只认这四档，别被手改的值卡住
      state.nearSort = !!d.s;
    }
  } catch (e) { /* 坏数据当没存过 */ }
}

/* 地图上的「我」：蓝点 + 名字；选了距离再套一个虚线圈 */
function drawOrigin() {
  if (!map) return;
  if (!originLayer) originLayer = L.layerGroup().addTo(map);
  originLayer.clearLayers();
  if (!state.origin) return;
  const { lat, lng } = state.origin;
  L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'me-wrap',
      html: '<div class="me-pulse"></div><div class="me-dot"></div><div class="me-lbl">我的位置</div>',
      iconSize: [0, 0], iconAnchor: [0, 0]
    }),
    interactive: false, keyboard: false, zIndexOffset: 1800
  }).addTo(originLayer);
  if (state.radius > 0) {
    L.circle([lat, lng], {
      radius: state.radius * 1000, color: '#2563EB', weight: 1.5,
      dashArray: '6 6', fillColor: '#2563EB', fillOpacity: .05, interactive: false
    }).addTo(originLayer);
  }
}

let pendingOriginFly = false;   // 手机在列表栏定位时地图是隐藏的，等切到地图栏再飞

function flyToOrigin() {
  if (!map || !state.origin) return;
  const size = map.getSize();
  if (!size || !size.x || !size.y) { pendingOriginFly = true; return; }   // 隐藏状态下飞会算出 NaN
  pendingOriginFly = false;
  try {
    map.flyTo([state.origin.lat, state.origin.lng], Math.max(map.getZoom(), 15), { duration: .8 });
  } catch (e) { /* 地图还没准备好，这次不飞 */ }
}

function setOrigin(latlng) {
  state.origin = { lat: +latlng.lat, lng: +latlng.lng };
  saveGeo();
  endPick();
  renderGeoBar();
  renderAll();
  drawOrigin();
  // 站在顺德境内才把地图拉过去；人在外地的电脑上点「定位」不该把地图甩到一千公里外
  if (map && distKm(state.origin, { lat: CONFIG.center[0], lng: CONFIG.center[1] }) < 40) {
    flyToOrigin();
  }
}

function locateMe() {
  if (locating) return;
  if (!navigator.geolocation) { startPick('这个浏览器不给定位'); return; }
  locating = true;
  renderGeoBar();
  navigator.geolocation.getCurrentPosition(
    p => {
      locating = false;
      setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude });
    },
    err => {
      locating = false;
      renderGeoBar();
      // 微信内置浏览器、http 页面、拒绝过权限都会走到这里 —— 直接请他自己点一个
      const why = err && err.code === 1 ? '浏览器没给定位权限'
        : err && err.code === 3 ? '定位超时'
        : '没拿到当前位置';
      startPick(why);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  );
}

/* 点地图选出发点。手机上这时得先切到地图那一栏，不然点了也没反应 */
function startPick(msg) {
  if (!map) return;
  const tabs = document.querySelector('.mobile-tabs');
  const onPhone = tabs && getComputedStyle(tabs).display !== 'none';
  if (onPhone) {
    const b = tabs.querySelector('button[data-view="map"]');
    if (b) b.click();
    closeDrawer();
  }
  endPick();
  const hint = document.getElementById('pickHint');
  if (hint) {
    hint.querySelector('.ph-txt').textContent =
      (msg ? msg + '，' : '') + '在地图上点一下，当作出发点';
    hint.hidden = false;
  }
  const c = map.getContainer();
  c.classList.add('picking');
  pickHandler = e => setOrigin(e.latlng);
  map.on('click', pickHandler);
}

function endPick() {
  const hint = document.getElementById('pickHint');
  if (hint) hint.hidden = true;
  if (map) {
    map.getContainer().classList.remove('picking');
    if (pickHandler) { map.off('click', pickHandler); pickHandler = null; }
  }
}

/* 列表上方那条：没定位时是入口，定位后是距离筛选 */
function renderGeoBar() {
  const bar = document.getElementById('geoBar');
  if (!bar) return;
  if (!state.origin) {
    bar.className = 'geo-bar';
    bar.innerHTML =
      '<div class="geo-row">' +
        '<button class="geo-set" id="geoSet" type="button">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
            'stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>' +
          (locating ? '正在定位…' : '定位我的位置，按远近找店') +
        '</button>' +
        '<button class="geo-pick" id="geoPick" type="button" title="不方便开定位时，直接在地图上点一个位置">地图上选</button>' +
      '</div>';
    return;
  }
  const far = distKm(state.origin, { lat: CONFIG.center[0], lng: CONFIG.center[1] });
  bar.className = 'geo-bar has';
  bar.innerHTML =
    '<div class="geo-row">' +
      '<button class="geo-sort' + (state.nearSort ? ' on' : '') + '" id="geoSort" type="button" ' +
        'aria-pressed="' + (state.nearSort ? 'true' : 'false') + '">离我最近</button>' +
      '<span class="geo-note">' + (far > 40
        ? '你现在离顺德约 ' + fmtDist(far)
        : '直线距离，不含路线') + '</span>' +
      '<button class="geo-x" id="geoClear" type="button" aria-label="清除位置" title="清除位置">✕</button>' +
    '</div>' +
    '<div class="geo-row wrap">' +
      [0, 2, 5, 10].map(km =>
        '<button class="geo-chip' + (state.radius === km ? ' on' : '') + '" data-km="' + km + '" type="button">' +
          (km ? km + 'km内' : '不限') + '</button>').join('') +
      '<button class="geo-again" id="geoAgain" type="button" title="重新定位；拿不到位置就改成在地图上点">重定位</button>' +
    '</div>';
}

/* ---------------- 抽屉 ---------------- */
function openDrawer(shop) {
  const c = catMap[shop.cat];
  const srcs = relevantSources(shop);

  document.getElementById('drawer').innerHTML =
    '<div class="dw-head">' +
      '<button class="dw-close" id="dwClose" aria-label="关闭">✕</button>' +
      '<div class="dw-cat" style="color:' + c.color + '">' + c.name + '</div>' +
      '<div class="dw-title-row">' +
        '<div class="dw-title">' + esc(shop.name) + '</div>' +
        '<button class="dw-map" id="dwMap" type="button" title="关闭详情，在地图上看这家店的位置">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
            'stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/>' +
            '<circle cx="12" cy="10" r="2.6"/></svg>看地图</button>' +
      '</div>' +
      (shop.featured ? '<div class="dw-featured">' + esc(shop.featured) + '</div>' : '') +
      '<div class="dw-sub"><span>' + esc(shop.area) + '</span><span class="sep"></span>' +
        '<span>' + esc(shop.price) + '/人</span><span class="sep"></span>' +
        '<span>' + esc(shop.addr) + '</span></div>' +
      srcStrip(shop) +
    '</div>' +
    '<div class="dw-body">' +
      '<div class="dw-sec"><h4>实拍' +
        ((typeof shopPhotos === 'function' && shopPhotos(shop.id).length) ? '<span class="h4-n">' + shopPhotos(shop.id).length + ' 张</span>' : '') +
        '</h4>' +
        ((typeof galleryHTML === 'function') ? galleryHTML(shop) : '') +
      '</div>' +
      '<div class="dw-sec"><h4>为什么值得去</h4><div class="dw-desc">' + esc(shop.desc) + '</div></div>' +
      '<div class="dw-sec"><h4>必点</h4><div class="sig-list">' +
        shop.sig.map(s => '<span class="sig-tag">' + esc(s) + '</span>').join('') + '</div></div>' +
      '<div class="dw-sec"><h4>实用提醒</h4><div class="dw-tip">' + esc(shop.tip) + '</div>' +
        (function () {
          const a = amapOf(shop);
          if (!a) return '';
          const bits = [];
          if (a.cost) bits.push('人均 ¥' + a.cost);
          if (a.open) bits.push('营业 ' + a.open);
          if (!bits.length) return '';
          return '<div class="dw-open">高德标注：' + esc(bits.join(' · ')) + '（以现场为准）</div>';
        })() +
      '</div>' +
      '<div class="dw-sec"><h4>谁吃过这家</h4>' +
        (shop.visited && shop.visited.length
          ? shop.visited.map(v => {
              const kw = v.name + ' ' + (v.kw || shop.name);
              const kind = urlKind(v.url);
              const tagText = kind === 'video' ? '' : kind === 'home' ? '主页合集' : kind === 'search' ? '搜索入口' : '链接待补';
              return '<div class="vcard">' +
                '<a class="vc-main" href="' + (v.url || '#') + '" target="_blank" rel="noopener">' +
                  '<div class="vc-top"><span class="vc-name">' + esc(v.name) + '</span>' +
                    '<span class="vc-pf">' + (PLATFORM_LABEL[v.platform] || '') + '</span>' +
                    (tagText ? '<span class="vg-tag ' + (kind === 'home' ? 'home' : 'todo') + '">' + tagText + '</span>' : '') +
                  '</div>' +
                  '<div class="vc-note">' + esc(v.note) + '</div>' +
                '</a>' +
                '<div class="vg-plats">' +
                  '<a class="vg-pf-btn bili" href="' + platformSearch('bilibili', kw) + '" ' +
                    'target="_blank" rel="noopener">B站</a>' +
                  '<a class="vg-pf-btn dou" href="' + platformSearch('douyin', kw) + '" ' +
                    'target="_blank" rel="noopener">抖音</a>' +
                '</div>' +
              '</div>';
            }).join('')
          : '<div class="dw-tip">' + (moreVideos(shop).length
              ? '站内收录的 9 位博主里没核到单独探过这家；下面「其他公开探店视频」里有 B 站上点名这家的片段。'
              : '暂未核到有博主单独探过这家。下面的搜索按钮可以直接查最新结果。') + '</div>') +
        '<div class="must-state ' + (shop.badge ? 'in' : 'out') + '">' +
          (shop.badge
            ? '★ 大众点评 2025 必吃榜 · 在榜'
            : '大众点评 2025 必吃榜 · 未上榜（顺德区共 15 家）') +
        '</div>' +
      '</div>' +
      (moreVideos(shop).length
        ? '<div class="dw-sec"><h4>其他公开探店视频</h4>' +
            '<div class="hint" style="margin-bottom:10px">这几位不在站内收录的 9 位博主里，是 B 站上标题直接点名这家店的公开视频，按播放量排。</div>' +
            moreVideos(shop).map(v =>
              '<a class="verified" href="' + v.url + '" target="_blank" rel="noopener">' +
                '<div class="vp">BILIBILI · ' + v.date + ' · 播放 ' + fmtView(v.view) + '</div>' +
                '<div class="vt">' + esc(v.title) + '</div>' +
                '<div class="vn">UP 主：' + esc(v.up) + '</div>' +
              '</a>').join('') +
          '</div>'
        : '') +
      '<div class="dw-sec"><h4>去之前</h4>' +
        (state.origin
          ? '<div class="dw-dist">📍 距你 <b>' + fmtDist(distOf(shop)) + '</b>' +
            '<span>直线距离，不是路线长度</span></div>'
          : '') +
        '<div class="link-grid">' +
          '<a class="link-btn primary" href="' + amapNavLink(shop) + '" target="_blank" rel="noopener">' +
            '<span class="lg">德</span>高德地图导航</a>' +
          '<a class="link-btn" href="' + douyinLink(shop) + '" target="_blank" rel="noopener">' +
            '<span class="lg">抖</span>抖音探店</a>' +
          '<a class="link-btn" href="' + biliLink(shop) + '" target="_blank" rel="noopener">' +
            '<span class="lg">B</span>B站搜测评</a>' +
        '</div>' +
        '<div class="hint">两个视频按钮走平台搜索直达，点开就是这家店最新最热的探店结果。</div>' +
      '</div>' +
      (srcs.length && !(shop.visited && shop.visited.length)
        ? '<div class="dw-sec"><h4>同类参考视频</h4>' +
            '<div class="dw-tip" style="margin-bottom:10px">这几条<b>不是这家店</b>，是同品类的做法和吃法参考，' +
            '没有博主单独探过这家的实拍。</div>' +
            srcs.map(v =>
              '<a class="verified" href="' + v.url + '" target="_blank" rel="noopener">' +
                '<div class="vp">' + (v.platform === 'bilibili' ? 'BILIBILI' : 'DOUYIN') +
                  (v.kind === 'space' ? ' · 博主主页' : v.kind === 'collection' ? ' · 合集' : '') + '</div>' +
                '<div class="vt">' + esc(v.title) + '</div>' +
                (v.why ? '<div style="font-size:12px;color:#B4442C;margin:2px 0 4px">同品类：' + esc(v.why) + '</div>' : '') +
                '<div class="vn">' + esc(v.note) + '</div>' +
              '</a>').join('') +
          '</div>'
        : '') +
      '<div class="hint" style="border-top:1px solid #E6DED2;padding-top:14px;margin-top:2px">' +
        (shop.approx
          ? '这家在高德上没搜到对应门店，地图点按所在街区近似落位，'
          : '坐标为高德地图上这家店 POI 的位置，') +
        '实际导航以高德关键词搜索为准。' +
      '</div>' +
    '</div>';

  document.getElementById('drawer').classList.add('open');
  document.getElementById('dwClose').addEventListener('click', closeDrawer);

  /* 「看地图」：手机上证个位置得先叉掉详情再切到地图，两步；这里一步做完 */
  document.getElementById('dwMap').addEventListener('click', () => {
    const sid = shop.id;
    closeDrawer();
    state.focusId = sid;          // closeDrawer 只清 activeId，这里显式留一手
    const tabs = document.querySelector('.mobile-tabs');
    const onPhone = tabs && getComputedStyle(tabs).display !== 'none';
    if (onPhone) {
      const b = tabs.querySelector('button[data-view="map"]');
      if (b) b.click();           // 走原来那套：切栏 → invalidateSize → setFocus
    } else if (map) {
      setFocus(shop);             // 桌面地图一直在，重新点上光圈就行
    }
  });
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  state.activeId = null;
  clearFocus();
  document.querySelectorAll('.item').forEach(el => el.classList.remove('on'));
}

/* ---------------- 必吃榜视图 ---------------- */
function renderMust() {
  const box = document.getElementById('mustlist');
  const d = MUST_EAT;

  box.innerHTML =
    '<div class="must-hero">' +
      '<div class="must-kicker">DAZHONGDIANPING · MUST-EAT</div>' +
      '<div class="must-title">' + d.year + ' 大众点评必吃榜</div>' +
      '<div class="must-sub">佛山顺德区 · ' + d.items.length + ' 家上榜</div>' +
      '<div class="must-note">' + esc(d.sourceNote) + '</div>' +
    '</div>' +
    d.items.map((it, i) => {
      const onMap = it.mapId && SHOPS.some(s => s.id === it.mapId);
      // 榜单项没有独立 shop 对象，按「店名 + 镇街」走同一套搜索逻辑
      const linked = it.mapId ? SHOPS.find(s => s.id === it.mapId) : null;
      const nav = amapNavLink({
        navKw: (linked && linked.navKw) || null,
        name: it.name,
        area: it.area
      });
      const bili = 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(it.name + ' 顺德');
      // 整张卡片都能点：点哪都直接飞地图并展开详情，不用再去找按钮
      return '<div class="must-card' + (onMap ? ' clickable' : '') + '"' +
          (onMap ? ' data-goto="' + it.mapId + '" role="button" tabindex="0"' : '') + '>' +
        '<div class="must-rank">' + (i + 1) + '</div>' +
        '<div class="must-body">' +
          '<div class="must-name">' + esc(it.name) + (onMap ? '<span class="must-arrow">地图定位 →</span>' : '') + '</div>' +
          '<div class="must-meta">' + esc(it.area) + ' · ' + esc(it.kind) + ' · ' + esc(it.price) + '/人' +
            (it.rating ? '<span class="rate">' + it.rating.toFixed(1) + ' 分' +
              (it.reviews ? ' · ' + it.reviews.toLocaleString('zh-CN') + ' 评' : '') + '</span>' : '') +
          '</div>' +
          '<div class="must-desc">' + esc(it.note) + '</div>' +
          '<div class="must-addr">' + esc(it.addr) + (it.hours ? ' · ' + esc(it.hours) : '') + '</div>' +
          '<div class="must-btns">' +
            '<a class="mb mb-nav" href="' + nav + '" target="_blank" rel="noopener">高德导航</a>' +
            '<a class="mb" href="' + bili + '" target="_blank" rel="noopener">B站搜</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') +
    '<div class="must-foot">点卡片任意位置，地图直接飞过去并展开这家店的详情。' +
      '右边两个按钮是新窗口：高德导航 / B 站搜这家。</div>';
}

function switchView(v) {
  state.view = v;
  document.querySelectorAll('.vtab').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  const isMust = v === 'must';
  document.getElementById('filtersBox').hidden = isMust;
  document.getElementById('geoBar').hidden = isMust;
  document.getElementById('listHead').hidden = isMust;
  document.getElementById('list').hidden = isMust;
  document.getElementById('mustlist').hidden = !isMust;
  document.querySelector('.layout').classList.toggle('must-mode', isMust);
  if (isMust) {
    renderMust();
    closeDrawer();
    // 列表隐藏后地图容器要重新量一次，否则瓦片按旧尺寸铺，画面会错位
    if (map) setTimeout(() => map.invalidateSize(), 50);
  } else {
    renderAll();
  }
}

/* ---------------- 总渲染 ---------------- */
let firstRender = true;
function noFilter() {
  // 注意 creator / area 的空值是字符串 'all'，不是 null，别用 !state.xxx 判
  return state.cat === 'all' && state.area === 'all' && !state.q &&
    (!state.creator || state.creator === 'all');
}
function renderAll() {
  const list = filtered();
  renderList(list);
  renderMarkers(list);
  const sl = document.getElementById('sortLbl');
  if (sl) sl.textContent = (state.origin && state.nearSort) ? '按离你距离排序' : '按街区排序';
  // 首屏不 fit：50 家跨六个镇街，fit 出来会缩到广州去。
  // 榜单视图下地图只是背景，更不能 fit；没筛选时也回到顺德中心，别让地图乱跑。
  if (!firstRender) {
    if (state.view === 'must') {
      /* 不动地图 */
    } else if (noFilter() && map) {
      map.setView(CONFIG.center, CONFIG.zoom, { animate: false });
    } else {
      fitTo(list);
    }
  }
  firstRender = false;
}

// 空结果里那个按钮：三个筛选 + 搜索框一起归零，按钮高亮也跟着复原
function resetAll() {
  state.cat = 'all'; state.area = 'all'; state.creator = 'all'; state.q = '';
  // 距离档也算一层筛选，一起放开；但出发点（蓝点）留着，不然又得重新定位
  state.radius = 0;
  saveGeo(); renderGeoBar(); drawOrigin();
  const q = document.getElementById('q');
  if (q) q.value = '';
  const c = document.getElementById('clr');
  if (c) c.classList.remove('on');
  document.querySelectorAll('#chips .chip').forEach(b => b.classList.toggle('on', b.dataset.cat === 'all'));
  document.querySelectorAll('#areas .area-btn').forEach(b => b.classList.toggle('on', b.dataset.area === 'all'));
  document.querySelectorAll('#creators .cr-btn').forEach(b => b.classList.toggle('on', b.dataset.cr === 'all'));
  renderAll();
}

/* ---------------- 事件 ---------------- */
function bind() {
  // 视图切换
  document.getElementById('viewtabs').addEventListener('click', e => {
    const b = e.target.closest('.vtab');
    if (b) switchView(b.dataset.view);
  });

  // 必吃榜：整张卡片点哪都能定位，不用去点按钮；里面两个外链是新窗口，别抢
  function gotoShop(id) {
    switchView('map');
    if (window.innerWidth <= 900) {
      document.querySelectorAll('.mobile-tabs button').forEach(x => x.classList.toggle('on', x.dataset.view === 'map'));
      document.querySelector('.layout').classList.add('show-map');
      if (map) setTimeout(() => map.invalidateSize(), 60);
    }
    setTimeout(() => activate(id), 260);
  }

  document.addEventListener('click', e => {
    if (e.target.closest('.must-btns a')) return;
    const g = e.target.closest('[data-goto]');
    if (g) gotoShop(g.dataset.goto);
  });

  // 键盘也能进：Tab 到卡片按回车
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const g = e.target.closest && e.target.closest('[data-goto]');
    if (!g || e.target.closest('.must-btns')) return;
    e.preventDefault();
    gotoShop(g.dataset.goto);
  });

  // 分类 chips
  const chips = document.getElementById('chips');
  chips.innerHTML = CATEGORIES.map(c => {
    const n = c.id === 'all' ? SHOPS.length : SHOPS.filter(s => s.cat === c.id).length;
    return '<button class="chip' + (c.id === 'all' ? ' on' : '') + '" data-cat="' + c.id + '">' +
      (c.id !== 'all' ? '<i class="dot" style="background:' + c.color + '"></i>' : '') +
      c.name + '<span style="opacity:.4;margin-left:1px">' + n + '</span></button>';
  }).join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    chips.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    state.cat = b.dataset.cat;
    renderAll();
  });

  // 区域
  const areas = document.getElementById('areas');
  areas.innerHTML = '<button class="area-btn on" data-area="all">全区</button>' +
    AREAS.map(a => '<button class="area-btn" data-area="' + a + '">' + a + '</button>').join('');
  areas.addEventListener('click', e => {
    const b = e.target.closest('.area-btn');
    if (!b) return;
    areas.querySelectorAll('.area-btn').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    state.area = b.dataset.area;
    renderAll();
  });

  // 博主筛选：只看某位探过的店
  const creators = document.getElementById('creators');
  const withShops = CREATORS.filter(c => SHOPS.some(s => (s.visited || []).some(v => v.cid === c.id)));
  creators.innerHTML =
    '<button class="cr-btn on" data-cr="all">不限博主</button>' +
    withShops.map(c => '<button class="cr-btn" data-cr="' + c.id + '">' + esc(c.name) + '</button>').join('');
  creators.addEventListener('click', e => {
    const b = e.target.closest('.cr-btn');
    if (!b) return;
    creators.querySelectorAll('.cr-btn').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    state.creator = b.dataset.cr;
    renderAll();
  });

  // 搜索
  const input = document.getElementById('q');
  const clr = document.getElementById('clr');
  // 窄屏上长 placeholder 会被截掉半句，换成短的；示例字样留在桌面端
  if (window.innerWidth < 520) input.placeholder = '搜店名、菜式或镇街';
  input.addEventListener('input', () => {
    state.q = input.value.trim();
    clr.classList.toggle('on', !!state.q);
    renderAll();
  });
  clr.addEventListener('click', () => {
    input.value = ''; state.q = ''; clr.classList.remove('on');
    renderAll(); input.focus();
  });

  // 列表点击（事件委托，重渲染也不会丢）
  document.getElementById('list').addEventListener('click', e => {
    // 距离筛出来是空的：那个按钮只放开距离，改成就近排序
    if (e.target.closest('[data-geo-off]')) {
      state.radius = 0;
      state.nearSort = true;
      saveGeo(); renderGeoBar(); renderAll(); drawOrigin();
      return;
    }
    // 空结果里的「清除筛选」：把三个筛选和搜索框一起复位
    if (e.target.closest('.empty-reset')) { resetAll(); return; }
    // 导航键是新窗口跳转、实拍图是开灯箱，都不抢卡片的选中行为
    if (e.target.closest('.item-nav')) return;
    if (e.target.closest('.item-pic')) return;
    const item = e.target.closest('.item');
    if (item) activate(item.dataset.id);
  });

  // 地图弹窗里的「详情」/ 视频清单里的店名
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open]');
    if (t) {
      const s = SHOPS.find(x => x.id === t.dataset.open);
      if (s) {
        if (map) map.closePopup();
        // 从弹层跳过去，弹层得让开
        document.getElementById('sheet').classList.remove('on');
        document.getElementById('mask').classList.remove('on');
        activate(s.id);
      }
    }
  });

  // 底图切换
  const tileBtn = document.getElementById('tileBtn');
  tileBtn.addEventListener('click', () => {
    if (!map) return;
    state.satellite = !state.satellite;
    tileBtn.classList.toggle('on', state.satellite);
    tileBtn.textContent = state.satellite ? '路' : '卫';
    map.removeLayer(activeTileLayer);
    activeTileLayer = L.tileLayer(
      state.satellite ? CONFIG.tileSatellite : CONFIG.tileStandard,
      { subdomains: '1234', maxZoom: 18, minZoom: 9, attribution: '地图数据 © 高德地图 AutoNavi' }
    ).addTo(map);
  });

  // 复位
  document.getElementById('resetBtn').addEventListener('click', () => {
    closeDrawer();
    state.focusId = null;
    fitTo(filtered());
  });

  // 定位 / 距离：整条 geoBar 用事件委托，条子里的按钮会被重画，一个个绑会丢
  const geoBar = document.getElementById('geoBar');
  renderGeoBar();
  geoBar.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'geoSet' || t.id === 'geoAgain') { locateMe(); return; }
    if (t.id === 'geoPick') { startPick(''); return; }
    if (t.id === 'geoClear') {
      state.origin = null; state.radius = 0; state.nearSort = false;
      saveGeo(); renderGeoBar(); renderAll(); drawOrigin();
      return;
    }
    if (t.id === 'geoSort') {
      state.nearSort = !state.nearSort;
      saveGeo(); renderGeoBar(); renderAll();
      return;
    }
    if (t.dataset.km !== undefined) {
      state.radius = +t.dataset.km;
      saveGeo(); renderGeoBar(); renderAll(); drawOrigin();
    }
  });
  document.getElementById('pickCancel').addEventListener('click', endPick);

  // 地图右上角那个准星：没定位过就先定位，定过了就飞回我这儿
  document.getElementById('meBtn').addEventListener('click', () => {
    if (state.origin) flyToOrigin(); else locateMe();
  });

  // 信源弹层
  const sheet = document.getElementById('sheet');
  const mask = document.getElementById('mask');
  const openSheet = () => { sheet.classList.add('on'); mask.classList.add('on'); };
  const closeSheet = () => { sheet.classList.remove('on'); mask.classList.remove('on'); };
  document.getElementById('srcBtn').addEventListener('click', () => { renderSrcSheet(); openSheet(); });
  document.getElementById('videoBtn').addEventListener('click', () => { renderVideoSheet(); openSheet(); });
  mask.addEventListener('click', closeSheet);
  document.getElementById('sheetClose').addEventListener('click', closeSheet);

  // 移动端切换
  const layout = document.querySelector('.layout');
  document.querySelectorAll('.mobile-tabs button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.mobile-tabs button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      layout.classList.toggle('show-map', b.dataset.view === 'map');
      if (b.dataset.view !== 'map') endPick();   // 离开地图就等于放弃这次选点
      if (b.dataset.view === 'map' && map) {
        // 从列表切过来时地图才有尺寸；刚在列表里点过的那家，这时候再飞过去并点上光圈
        setTimeout(() => {
          map.invalidateSize();
          const s = SHOPS.find(x => x.id === state.focusId);
          if (s) setFocus(s);
          else if (pendingOriginFly) flyToOrigin();   // 在列表栏定的位，这时候再拉过去
        }, 80);
      }
    });
  });

  // ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); closeSheet(); endPick(); }
  });
}

/* ---------------- 弹层内容：博主信源 / 视频清单 ---------------- */
const SHEET_SRC = {
  title: '博主信源',
  desc: '8 位博主的档案与真实主页 / 合集链接。打「已核到」的是确有顺德探店内容、下面是挂到店的；' +
        '打「未核到」的是检索过但没有公开的顺德记录 —— 这种情况不挂店，也不编造视频地址。'
};

function renderSrcSheet() {
  document.getElementById('sheetTitle').textContent = SHEET_SRC.title;
  document.getElementById('sheetDesc').textContent = SHEET_SRC.desc;
  document.getElementById('srcList').innerHTML = CREATORS.map(c => {
    const shops = SHOPS.filter(s => (s.visited || []).some(v => v.cid === c.id));
    return '<div class="creator-card' + (c.covered ? '' : ' off') + '">' +
      '<a class="cc-main" href="' + c.url + '" target="_blank" rel="noopener">' +
      '<div class="cc-top">' +
        '<span class="cc-name">' + esc(c.name) + '</span>' +
        '<span class="cc-pf">' + esc(c.platformName) + '</span>' +
        '<span class="cc-st ' + (c.covered ? 'ok' : 'no') + '">' + (c.covered ? '已核到' : '未核到') + '</span>' +
      '</div>' +
      (c.alias ? '<div class="cc-alias">' + esc(c.alias) + '</div>' : '') +
      '<div class="cc-role">' + esc(c.role) + '</div>' +
      '<div class="cc-note">' + esc(c.note) + '</div>' +
      '<div class="cc-hl">' + esc(c.highlight) + '</div>' +
      (shops.length
        ? '<div class="cc-shops">挂到 ' + shops.length + ' 家：' + shops.map(s => esc(s.name)).join('、') + '</div>'
        : (c.unnamed ? '<div class="cc-shops">视频里没报店名，暂不挂店</div>' : '')) +
      '</a>' +
      // 两个平台都给：主链接只是他主战场那个，另一边也留个门槛低的入口
      '<div class="cc-plats">' +
        '<a class="vg-pf-btn bili" href="' + platformSearch('bilibili', c.name) + '" ' +
          'target="_blank" rel="noopener">B站搜「' + esc(c.name) + '」</a>' +
        '<a class="vg-pf-btn dou" href="' + platformSearch('douyin', c.name) + '" ' +
          'target="_blank" rel="noopener">抖音搜「' + esc(c.name) + '」</a>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderVideoSheet() {
  // 只看当前筛选结果里的店
  const list = filtered().filter(s => s.visited && s.visited.length);
  const total = list.reduce((n, s) => n + s.visited.length, 0);
  const withVideo = list.reduce((n, s) =>
    n + s.visited.filter(v => urlKind(v.url) === 'video').length, 0);

  document.getElementById('sheetTitle').textContent = '博主视频清单';
  document.getElementById('sheetDesc').textContent =
    '当前筛选出 ' + list.length + ' 家店、' + total + ' 条博主记录：' + withVideo +
    ' 条有确切视频链接，其余如实标注为「主页合集」或「搜索入口」。每条右边都有 B站 / 抖音 两个按钮，' +
    '点哪个就在哪个平台搜「博主 + 店名」，两边都留着。';

  if (!list.length) {
    document.getElementById('srcList').innerHTML =
      '<div class="vg-empty">当前筛选里没有博主探过的店。<br>把筛选放宽一点，或者点上面的「不限博主」。</div>';
    return;
  }

  document.getElementById('srcList').innerHTML = list.map(shop => {
    const links = shop.visited.map(v => {
      const kind = urlKind(v.url);
      const kw = v.name + ' ' + (v.kw || shop.name);
      const tag = kind === 'video' ? '<span class="vg-tag ok">视频</span>'
        : kind === 'home' ? '<span class="vg-tag home">主页合集</span>'
        : kind === 'search' ? '<span class="vg-tag todo">链接待补</span>'
        : '<span class="vg-tag">链接</span>';
      return '<div class="vg-item">' +
        '<a class="vg-main" href="' + (v.url || '#') + '" target="_blank" rel="noopener">' +
          '<span class="vg-who">' + esc(v.name) + '</span>' + tag +
          '<span class="vg-pf">' + esc(PLATFORM_LABEL[v.platform] || '') + '</span>' +
          '<span class="vg-note">' + esc(v.note || v.title || '') + '</span>' +
        '</a>' +
        // 两个平台都给，不用二选一
        '<div class="vg-plats">' +
          '<a class="vg-pf-btn bili" href="' + platformSearch('bilibili', kw) + '" ' +
            'target="_blank" rel="noopener" title="在 B站 搜「' + esc(kw) + '」">B站</a>' +
          '<a class="vg-pf-btn dou" href="' + platformSearch('douyin', kw) + '" ' +
            'target="_blank" rel="noopener" title="在抖音搜「' + esc(kw) + '」">抖音</a>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="vg-shop">' +
      '<a class="vg-shop-name" href="javascript:void(0)" data-open="' + shop.id + '">' +
        esc(shop.name) + '<span class="vg-area">' + esc(shop.area) + '</span>' +
      '</a>' + links +
    '</div>';
  }).join('');
}

/* ---------------- 启动 ---------------- */
// 顶部三个数字和两个 tab 上的人数都从数据里数出来，别再写死（删一家店就得改五处，容易漏）
function syncStats() {
  const n = SHOPS.length;
  const must = MUST_EAT.items.length;
  const visited = SHOPS.filter(s => (s.visited || []).length).length;
  const put = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  put('statShops', n); put('tabMap', n);
  put('statMust', must); put('tabMust', must);
  put('statVisited', visited);
}

document.addEventListener('DOMContentLoaded', () => {
  syncStats();
  renderSrcSheet();

  loadGeo();          // 上次定位的点、距离筛选，接着用
  bind();
  initMap();

  // 支持 ?view=must / ?creator=xxx / #shop=xxx 直接打开
  const vm = (location.search.match(/view=(\w+)/) || [])[1];
  if (vm === 'must') setTimeout(() => switchView('must'), 180);
  const cm = (location.search.match(/creator=([\w-]+)/) || [])[1];
  if (cm) setTimeout(() => {
    const b = document.querySelector('.cr-btn[data-cr="' + cm + '"]');
    if (b) b.click();
  }, 220);
  const sm = location.hash.match(/shop=([\w-]+)/);
  if (sm) setTimeout(() => activate(sm[1]), 420);
});

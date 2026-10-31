/* ==========================================================
   店铺实拍图 · 缩略图 + 灯箱放大
   图片来源：B 站探店视频封面（assets/photos.js，由 scripts/fetch-photos.mjs 抓取）
   每条都能顺着 BV 号回到原视频核对，不是画出来的图。
   ========================================================== */
(function () {
  var DB = (typeof PHOTOS !== 'undefined' && PHOTOS) ? PHOTOS : {};
  var AM = (typeof AMAP_PHOTOS !== 'undefined' && AMAP_PHOTOS) ? AMAP_PHOTOS : {};

  var MAX = 4;
  function ok(p) { return p && p.src; }

  // 高德相册（食客实拍返图）优先；不够 MAX 张时，用已经核对过店名的 B 站探店画面补齐，
  // 一家店只有 1 张图太单薄，混着放比空着强，灯箱里会按条标出各自来源。
  function photosOf(id) {
    var am = (AM[id] || []).filter(ok);
    var bb = (DB[id] || []).filter(ok);
    if (!am.length) return bb.slice(0, MAX);
    if (am.length >= MAX) return am.slice(0, MAX);
    return am.concat(bb.slice(0, MAX - am.length));
  }
  window.shopPhotos = photosOf;

  /* ---------- 列表里的菜品小图（店名右边一排，不动卡片高度） ---------- */
  // 卡片上这排小图实际只有 28px，原图是 800px、平均 62KB。
  // assets/thumbs 下是同一批图压到 160px 的 WebP（约 4KB），路径规则一一对应；
  // 万一某张缩略图没生成，onerror 退回原图，不会开天窗。
  function thumbOf(src) {
    return src.replace(/^assets\//, 'assets/thumbs/').replace(/\.(jpe?g|png)$/i, '.webp');
  }

  window.picRowHTML = function (shop) {
    var ps = photosOf(shop.id);
    if (!ps.length) return '';
    return '<div class="pic-row">' + ps.slice(0, 3).map(function (p, i) {
      var tip = (p.title ? p.title + ' · ' : '') + shop.name + (p.branch ? '（图为同品牌' + p.branch + '）' : '');
      return '<img class="pmini" src="' + thumbOf(p.src) + '" data-fallback="' + p.src + '"' +
        ' alt="' + esc(tip) + '" title="' + esc(tip) + '"' +
        ' onerror="this.onerror=null;this.src=this.dataset.fallback"' +
        ' loading="lazy" decoding="async" data-pic="' + shop.id + '" data-idx="' + i + '">';
    }).join('') + '</div>';
  };

  /* ---------- 抽屉里的图集 ---------- */
  window.galleryHTML = function (shop) {
    var ps = photosOf(shop.id);
    if (!ps.length) {
      return '<div class="dw-noimg">这家还没核到能对上的实拍图。' +
        '<a class="dw-noimg-a" href="' + amapNavLink(shop) + '" target="_blank" rel="noopener">在高德看这家店的相册 →</a></div>';
    }
    var nAm = ps.filter(function (p) { return p.from === 'amap'; }).length;
    var br = branchOf(ps);
    var note;
    if (nAm && nAm < ps.length) {
      note = '前 ' + nAm + ' 张取自高德地图上这家店的门店相册，其余为 B 站探店画面。点图放大。';
    } else if (nAm) {
      note = '图片取自高德地图上这家店的门店相册，点图放大。';
    } else {
      note = '实拍来自 B 站探店视频，点图放大，可顺着 BV 号回原视频核对。';
    }
    if (br) note += ' 注意：这几张拍的是同品牌「' + br + '」，不是这家门店。';
    return '<div class="dw-gal">' +
      ps.map(function (p, i) {
        return '<button class="dg" type="button" data-pic="' + shop.id + '" data-idx="' + i + '">' +
          '<img src="' + p.src + '" alt="' + esc(p.title || shop.name) + '" loading="lazy" decoding="async">' +
          '</button>';
      }).join('') +
      '</div>' +
      '<div class="dw-gal-note">' + esc(note) + '</div>';
  };

  // 图可能来自同品牌其他分店，取第一条的 branch 用来说明
  function branchOf(list) {
    for (var i = 0; i < list.length; i++) if (list[i].branch) return list[i].branch;
    return '';
  }

  function shopById(id) {
    if (typeof SHOPS === 'undefined' || !SHOPS) return null;
    for (var i = 0; i < SHOPS.length; i++) if (SHOPS[i].id === id) return SHOPS[i];
    return null;
  }

  /* ---------- 灯箱 ---------- */
  var lb = null, cur = { id: null, idx: 0, list: [] };

  function build() {
    if (lb) return lb;
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.innerHTML =
      '<div class="lb-bg"></div>' +
      '<button class="lb-x" type="button" aria-label="关闭">✕</button>' +
      '<button class="lb-prev" type="button" aria-label="上一张">‹</button>' +
      '<button class="lb-next" type="button" aria-label="下一张">›</button>' +
      '<div class="lb-stage">' +
        '<div class="lb-frame"><img alt=""></div>' +
        '<div class="lb-bar">' +
          '<div class="lb-cap"></div>' +
          '<div class="lb-meta"></div>' +
          '<a class="lb-src" target="_blank" rel="noopener">看原视频 ↗</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(lb);

    lb.querySelector('.lb-bg').addEventListener('click', close);
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    // 点图也翻页，符合直觉
    lb.querySelector('.lb-frame').addEventListener('click', function (e) {
      var r = this.getBoundingClientRect();
      step(e.clientX < r.left + r.width / 2 ? -1 : 1);
    });
    return lb;
  }

  function paint() {
    var p = cur.list[cur.idx];
    if (!p) return;
    var shop = cur.shop;
    var img = lb.querySelector('.lb-frame img');
    img.src = p.src;
    img.alt = p.title || (shop ? shop.name : '');
    lb.querySelector('.lb-cap').textContent = p.title || (shop ? shop.name : '实拍');
    var who = p.from === 'amap' ? '高德地图 · 门店相册' : (p.up ? '@' + p.up : '');
    var meta = [who, p.date || '', cur.idx + 1 + ' / ' + cur.list.length].filter(Boolean).join('  ·  ');
    if (p.branch) meta += '  ·  图为同品牌「' + p.branch + '」';
    lb.querySelector('.lb-meta').textContent = meta;
    var a = lb.querySelector('.lb-src');
    if (p.bv) {
      a.href = 'https://www.bilibili.com/video/' + p.bv;
      a.textContent = '看原视频 ↗';
      a.style.display = '';
    } else if (p.from === 'amap') {
      // 图地址本身常不带 POI id；同一家店只要有一条带，就借用它的，别把两条外链指向不同地方
      var poi = p.poi || '';
      if (!poi) {
        for (var k = 0; k < cur.list.length; k++) {
          if (cur.list[k].from === 'amap' && cur.list[k].poi) { poi = cur.list[k].poi; break; }
        }
      }
      a.href = poi ? 'https://www.amap.com/detail/' + poi
                   : (shop ? amapNavLink(shop) : 'https://www.amap.com/');
      a.textContent = poi ? '在高德看这家 ↗' : '在高德搜这家 ↗';
      a.style.display = '';
    } else {
      a.removeAttribute('href');
      a.style.display = 'none';
    }
    var many = cur.list.length > 1;
    lb.querySelector('.lb-prev').style.display = many ? '' : 'none';
    lb.querySelector('.lb-next').style.display = many ? '' : 'none';
  }

  function open(id, idx) {
    var ps = photosOf(id);
    if (!ps.length) return;
    cur = { id: id, idx: Math.max(0, Math.min(idx || 0, ps.length - 1)), list: ps, shop: shopById(id) };
    build();
    paint();
    lb.classList.add('on');
    document.body.classList.add('lb-lock');
  }
  function close() {
    if (!lb) return;
    lb.classList.remove('on');
    document.body.classList.remove('lb-lock');
  }
  function step(d) {
    if (cur.list.length < 2) return;
    cur.idx = (cur.idx + d + cur.list.length) % cur.list.length;
    paint();
  }
  window.openLightbox = open;

  /* ---------- 事件 ---------- */
  // 缩略图/图集点击（含重渲染后的元素，全走委托）
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-pic]');
    if (!t) return;
    e.stopPropagation();
    e.preventDefault();
    open(t.dataset.pic, parseInt(t.dataset.idx || '0', 10));
  });

  // 键盘：灯箱开着就只服务灯箱
  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('on')) return;
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.stopPropagation(); step(-1); }
    else if (e.key === 'ArrowRight') { e.stopPropagation(); step(1); }
  }, true);

  // 图挂了就把那块收掉，别留破图
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    var pic = img.closest('.item-pic');
    if (pic) { pic.remove(); return; }
    var dg = img.closest('.dg');
    if (dg) { dg.remove(); }
  }, true);
})();

/* 蛋蛋島衣櫃的小窩聯名預覽測試（Claude B）：在蛋蛋島 repo 根目錄跑 python3 -m http.server 8766，再 node 這個檔 <輸出資料夾>。
   1) 一般網址：衣櫃裡沒有聯名外觀（ITEMS 77 件）
   2) ?collab=1：三件出現在各自分類、標「小窩聯名・準備中」、點了是試穿（不能穿上），截圖
   3) 地圖月亮物件修正前後對照 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8766/';
const OUT = path.resolve(process.argv[2] || 'shots'); fs.mkdirSync(OUT, { recursive: true });
const errors = [];
async function open(b, q){
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(q + ' pageerror: ' + e.message));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p.goto(BASE + 'index.html' + q, { waitUntil: 'load' });
  await p.waitForTimeout(5000);
  const st = await p.$('#btn-start'); if (st && await st.isVisible()) { await st.click().catch(() => {}); await p.waitForTimeout(3500); }
  return p;
}
(async () => {
  const b = await chromium.launch();
  // 1) 一般網址
  let p = await open(b, '');
  const plain = await p.evaluate(async () => { const m = await import('./js/cosmetics.js?v=20261128b'); return { n: m.ITEMS.length, nest: m.ITEMS.filter(i => /\.nest$/.test(i.id)).length }; });
  console.log('plain', JSON.stringify(plain));
  await p.context().close();
  // 2) ?collab=1
  p = await open(b, '?collab=1');
  const col = await p.evaluate(async () => { const m = await import('./js/cosmetics.js?v=20261128b'); return { n: m.ITEMS.length, nest: m.ITEMS.filter(i => /\.nest$/.test(i.id)).map(i => i.id) }; });
  console.log('collab', JSON.stringify(col));
  await p.evaluate(() => document.getElementById('btn-closet').click());
  await p.waitForTimeout(1500);
  const res = {};
  for (const [tab, name] of [['theme', '薯餅的小窩'], ['fx', '小屋愛心'], ['ring', '小窩']]){
    await p.evaluate(t => { const b = [...document.querySelectorAll('#cl-tabs .cl-tab')].find(x => x.getAttribute('aria-label') && x.querySelector('.ct-s') && ({ theme: '主題', fx: '特效', ring: '外圈' })[t] === x.querySelector('.ct-s').textContent); if (b) b.click(); }, tab);
    await p.waitForTimeout(500);
    const cell = p.locator('#cl-grid .cl-item', { hasText: name }).last();
    res[tab] = { found: await cell.count(), state: await cell.locator('.ci-state').textContent().catch(() => null) };
    if (res[tab].found){ await cell.scrollIntoViewIfNeeded(); await cell.click(); await p.waitForTimeout(tab === 'fx' ? 700 : 900); res[tab].after = await cell.getAttribute('class'); }
    await p.screenshot({ path: path.join(OUT, `egg-closet-${tab}.png`) });
  }
  console.log('closet', JSON.stringify(res));
  await p.context().close();
  // 3) 地圖月亮：原本的 path 和修正後的
  p = await (await b.newContext({ viewport: { width: 360, height: 120 }, deviceScaleFactor: 2 })).newPage();
  await p.setContent(`<body style="margin:0;background:#33397a;display:flex;gap:30px;color:#fff;font:14px sans-serif;align-items:center;padding:10px">
    <div>修正前<svg width="110" height="90" viewBox="-30 -60 80 66"><path d="M6-40A18 18 0 1 0 6-4A14 14 0 1 1 6-40Z" fill="#fff1b0"/></svg></div>
    <div>修正後<svg width="110" height="90" viewBox="-30 -60 80 66"><path d="M6-40A18 18 0 1 0 6-4A22 22 0 0 1 6-40Z" fill="#fff1b0"/></svg></div></body>`);
  await p.screenshot({ path: path.join(OUT, 'egg-map-moon-fix.png') });
  await b.close();
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
})();

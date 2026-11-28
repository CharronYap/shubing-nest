/* 小窩真實房間混搭測試（Claude B）：不改小窩任何檔案。
   用 Playwright 攔截 index.html，把 collab-moon / collab-hook-furn 插在 furn4 後面、collab-hook-trip 插在 abroad 後面，
   再把月亮島夜燈和兩件土產擺進臥室，舊風格（?look=old）和新風格（紙片）各截一張，另外把三張明信片和護照章畫出來。
   用法：先在 shubing-nest 根目錄跑 python3 -m http.server 8765，再 node collab/tests/nest_room_mix.cjs <輸出資料夾> */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8765/';
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'collab', 'shots'));
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
async function page(b, q){
  const ctx = await b.newContext({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(q + ' pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(q + ' console: ' + m.text()); });
  await p.route('**/index.html*', async r => {
    const res = await r.fetch(); let html = await res.text();
    html = html.replace("'furn4',", "'furn4','collab-moon','collab-hook-furn',").replace("'abroad',", "'abroad','collab-hook-trip',");
    await r.fulfill({ response: res, body: html, headers: { ...res.headers(), 'content-type': 'text/html; charset=utf-8' } });
  });
  for (const n of ['collab-moon', 'collab-hook-furn', 'collab-hook-trip'])
    await p.route(`**/js/${n}.js*`, r => r.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: fs.readFileSync(path.join(ROOT, 'collab', 'nest', n + '.js'), 'utf8') }));
  // 擋掉外面的網路（Firebase 等），只測本機畫面
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  return p;
}
(async () => {
  const b = await chromium.launch();
  for (const [q, tag] of [['?look=old', 'old'], ['', 'paper']]){
    const p = await page(b, tag);
    await p.goto(BASE + 'index.html' + q, { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    // 第一次：把聯名的東西放進存檔，擺在臥室，再重新整理
    await p.evaluate(() => {
      const bed = S.home.bed; let u = 9000;
      const put = (id, x, y) => { if (!bed.items.some(i => i.id === id)) bed.items.push({ uid: u++, kind: 'furn', id, x, y, sit: null, seat: 0 }); FURN_OWN[id] = 1; };
      put('egm_moonlamp', 70, 70); put('tvs_moonmodel', 52, 66); put('tvs_moonbadge', 60, 92);
      put('moonlamp', 90, 70);   // 中秋月亮燈放旁邊比大小
      S.opened = true; writeLocal();
    });
    await p.goto(BASE + 'index.html' + q, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const info = await p.evaluate(() => ({
      furn: ['egm_moonlamp', 'tvs_moonmodel', 'tvs_moonbadge'].map(id => !!FURN[id]),
      inRoomTray: ROOM_FURN.bed.includes('egm_moonlamp'),
      clawPool: Object.keys(FURN).filter(id => !FURN[id].season && !FURN[id].gift).filter(id => /^egm_|moonmodel|moonbadge/.test(id)),
      place: TV_PLACES.moonisle && TV_PLACES.moonisle.name,
      screen: document.body.className,
    }));
    console.log(tag, JSON.stringify(info));
    // 想辦法進到臥室：有封面就點開始，再點房間鈕
    for (const sel of ['#cover button', '.cv-start', '#start']) { const e = await p.$(sel); if (e && await e.isVisible()) { await e.click().catch(() => {}); await p.waitForTimeout(800); } }
    await p.evaluate(() => { if (typeof goRoom === 'function') goRoom('bed'); else if (typeof switchRoom === 'function') switchRoom('bed'); });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(OUT, `nest-bedroom-${tag}.png`) });
    if (tag === 'paper'){
      // 三張明信片（貼上龍龍和薯餅）、護照章、土產
      await p.evaluate(() => {
        const box = document.createElement('div'); box.id = 'cbx';
        box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fbf6ea;padding:10px;overflow:auto;display:flex;flex-direction:column;gap:8px';
        box.innerHTML = [0, 1, 2].map(i => `<div style="width:396px">${tvCardHTML('moonisle', i, i === 1 ? ['dino', 'sloth'] : [['sloth'], [], ['dino']][i])}</div>`).join('')
          + `<div style="display:flex;gap:14px;align-items:center;color:#3f6f93"><svg viewBox="0 0 24 24" width="56" height="56">${TV_PLACES.moonisle.stamp}</svg>`
          + ['tvs_moonmodel', 'tvs_moonbadge', 'egm_moonlamp', 'moonlamp'].map(id => `<div style="width:80px">${furnSVG(id)}</div>`).join('') + '</div>';
        document.body.appendChild(box);
      });
      await p.setViewportSize({ width: 420, height: 1420 });
      await p.waitForTimeout(800);
      await p.screenshot({ path: path.join(OUT, 'nest-postcards.png'), fullPage: false });
      // 字型：聯名的字粉圓（huninn）有沒有缺；缺的話小窩會整段換成源泉圓體（js/fontfix.js），看得到但字體不一樣
      const miss = await p.evaluate(() => {
        const t = TV_PLACES.moonisle, e = window.TV_EGG.moonisle, all = [FURN.egm_moonlamp.name, TV_SOUV.moonbadge.name, TV_SOUV.moonmodel.name, t.name, t.country, t.dir,
          ...TV_CARDS.moonisle.map(c => c.name), ...Object.values(TV_LINES.moonisle).flat(), ...TV_DUO.moonisle.flatMap(d => d.slice(2)), ...Object.values(e.diary).flat(), ...Object.values(e.memo).flat()];
        const bad = new Set(); all.forEach(s => [...s].forEach(ch => { if (!huninnHas(ch)) bad.add(ch); }));
        return { strings: all.length, missing: [...bad].join('') };
      });
      console.log('font huninn', JSON.stringify(miss));
    }
    await p.context().close();
  }
  await b.close();
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
})();

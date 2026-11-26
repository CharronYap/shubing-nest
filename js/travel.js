/* 旅行第一版（2026-11-26，企劃「旅行第一版的細節」）。資料和圖在 js/traveldata.js。
   想要的感覺：娃娃有自己的生活。玩家只準備行李，誰去、去哪、什麼時候去都是牠們自己決定；路上寄明信片回來，回家帶土產。
   - 行李：客廳門邊固定放一個背包，點它打開。三格：點心（決定走多遠）、護身符、道具。用品在火腿的小店買。
     誰出門誰背走，背走之後背包空了，可以再準備下一份。沒準備牠們也會出門，只去最近的公園，明信片只有一張。
   - 出門：打開小窩、放好行李之後，在家的娃娃看心情決定。上次回來超過 2 小時才會再出門；蛋黃哥要背包裡有便當才肯；
     下雨天要有摺疊傘；夜市要傍晚以後、而且有手電筒。一次最多 2 隻在外面，家裡至少留一隻。大約三趟有一趟是兩隻結伴。
   - 用真的時間：近的 2～3 小時、中等的 6～8 小時、遠的 20～30 小時。不能加速，也沒有任何懲罰。
     很久沒打開：最多連續算 3 趟，所以信箱不會一次塞滿。
   - 結果在出門那一刻就決定好存起來（去哪、幾點回、哪幾張明信片、背面哪一句、什麼土產），之後只是照時間揭曉，
     所以重新整理、換裝置都不會變。
   - 不在家：出門的娃娃從房間拿掉（跟去朋友家過夜同一種做法），所以自己動、小劇場、躲貓貓、過夜都不會找到牠；
     原本的位置留一張紙條，收納架那隻標背包，回來放回原位。
   存檔：全部在 S.album.tv，明信片的信在 S.mail.l（k 是「娃娃.pc.0#p=地方;c=第幾張;l=哪一句」）。不加最上層欄位、不改規則。
     tv = {bag:{food,charm,tool}, inv:{用品:幾個}, tool:{道具:1}, out:[旅程], back:{娃娃:回來的時間}, cards:{地方:收到哪幾張},
           sv:{土產:拿過幾次}, cnt:{娃娃:{地方:幾次}}, log:{娃娃:['日期|地方|同行|日記第幾句']}, wel:[還沒看的回家通知], free:'沒帶行李出門的那天'}
     旅程 = {id, ds:[娃娃], p, t0, t1, food, charm, tool, hm:{娃娃:{r,x,y}}, pcs:[{c,at,d,l 或 u}], sent, sv:{娃娃:土產}, di:{娃娃:日記第幾句}}
     沒有陣列直接包陣列（Firestore 不收）。
   測試：console 打 tvDebug.skip(小時) 把時間往後撥（只在這次開著的時候有效，不存）、tvDebug.go() 叫牠們現在看要不要出門。 */
const TV_REST_H = 2, TV_MAX_OUT = 2, TV_CHAIN = 3, TV_PAIR = 1 / 3, TV_PAIR_MEET = .75, TV_INV_MAX = 9;
const TV_BAG_ICON = '<svg viewBox="0 0 24 24"><path d="M9 6V5a3 3 0 0 1 6 0v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="currentColor"/><rect x="8.500" y="12" width="7" height="5.500" rx="1.500" fill="#fff" opacity=".85"/></svg>';
ICON.trip = TV_BAG_ICON;
let tvSkew = 0;
const tvNow = () => Date.now() + tvSkew;
const tvPad = n => String(n).padStart(2, '0');
const tvDate = ms => { const d = new Date(ms); return `${d.getFullYear()}-${tvPad(d.getMonth() + 1)}-${tvPad(d.getDate())}`; };
const tvPart = h => (h < 5 ? '半夜' : h < 11 ? '早上' : h < 13 ? '中午' : h < 17 ? '下午' : h < 19 ? '傍晚' : '晚上');
// 大概什麼時候（不寫幾點幾分：不催人）
function tvWhen(ms){
  const d = new Date(ms), n = new Date(tvNow()), day0 = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day0(d) - day0(n)) / 864e5);
  return (diff <= 0 ? '今天' : diff === 1 ? '明天' : diff === 2 ? '後天' : `${d.getMonth() + 1}月${d.getDate()}日`) + tvPart(d.getHours());
}
function tvData(){
  const t = S.album.tv = S.album.tv || {};
  ['bag', 'inv', 'tool', 'back', 'cards', 'sv', 'cnt', 'log'].forEach(k => { if (!t[k] || typeof t[k] !== 'object' || Array.isArray(t[k])) t[k] = {}; });
  if (!Array.isArray(t.out)) t.out = [];
  if (!Array.isArray(t.wel)) t.wel = [];
  t.out = t.out.filter(o => o && Array.isArray(o.ds) && TV_PLACES[o.p] && Array.isArray(o.pcs));
  return t;
}
const tvTrip = d => tvData().out.find(o => o.ds.includes(d)) || null;
const tvNames = ds => ds.map(d => DOLL_NAME[d]).join('和');
const tvPacked = () => { const b = tvData().bag; return !!(b.food || b.charm || b.tool); };
// 道具可以兩樣一起帶：bag.tool 和旅程的 tool 都是用逗號接起來的字（'torch,umb'）
const tvToolList = s => String(s || '').split(',').filter(id => TV_GOODS[id] && TV_GOODS[id].slot === 'tool');
const tvToolFree = id => !!tvData().tool[id] && !tvData().out.some(o => tvToolList(o.tool).includes(id));
// 收納架、過夜、小島都用 whereDoll 看娃娃在哪：旅行中的回 'trip'
{
  const prev = whereDoll;
  whereDoll = function(id){ return (typeof S !== 'undefined' && S.album && S.album.tv && Array.isArray(S.album.tv.out) && S.album.tv.out.some(o => o && Array.isArray(o.ds) && o.ds.includes(id))) ? 'trip' : prev(id); };
}
// 在家的：有這隻、沒去旅行、沒去朋友家過夜、沒在小島幫忙
const tvHomeDolls = () => DOLLS.filter(d => DOLL_N[d] && !['trip', 'out', 'yard'].includes(whereDoll(d)));

/* ---------- 出門：這一刻把整趟的結果決定好 ---------- */
const tvPickW = (list, wOf) => { const ws = list.map(wOf), sum = ws.reduce((a, b) => a + b, 0); let r = Math.random() * sum; for (let i = 0; i < list.length; i++){ r -= ws[i]; if (r <= 0) return list[i]; } return list[list.length - 1]; };
const tvShuffle = a => { for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function tvPlan(now){
  const t = tvData(), bag = t.bag;
  const outN = t.out.reduce((n, o) => n + o.ds.length, 0), homeD = tvHomeDolls();
  if (outN >= TV_MAX_OUT || homeD.length < 2) return null;
  const hr = new Date(now).getHours();
  const tools = tvToolList(bag.tool).filter(tvToolFree), tool = tools.join(',');
  if (typeof skyWeather === 'function' && skyWeather(tvDate(now)) === 'rain' && !tools.includes('umb')) return null;   // 下雨天沒有傘，大家都不想出門
  const food = TV_GOODS[bag.food] ? bag.food : '', charm = TV_GOODS[bag.charm] ? bag.charm : '';
  const tier = food === 'bento' ? 3 : food === 'sand' ? 2 : 1;
  const p = tier === 3 ? 'onsen' : tier === 2 ? (tools.includes('torch') && (hr >= 15 || hr < 2) ? 'market' : 'beach') : 'park';
  const P = TV_PLACES[p];
  const hid = typeof hideGet === 'function' && hideGet() ? hideGet().d : '';
  const can = homeD.filter(d => now - (t.back[d] || 0) >= TV_REST_H * 36e5 && (d !== 'egg' || food === 'bento') && d !== hid);
  if (!can.length) return null;
  const a = tvPickW(can, d => (TV_LOVE[d] || 1) * (P.fav.includes(d) ? 2.2 : 1));
  const ds = [a];
  // 兩隻結伴：越要好的越常一起；正在吵架的平常不會，偶爾被湊在一起（回來就和好）
  if (outN + 2 <= TV_MAX_OUT && homeD.length >= 3 && can.length >= 2 && Math.random() < (charm === 'meet' ? TV_PAIR_MEET : TV_PAIR)){
    const pals = typeof palsData === 'function' ? palsData() : {};
    const b = tvPickW(can.filter(d => d !== a), d => (typeof fightOf === 'function' && fightOf(a, d) ? .08 : 1 + Math.min(4, (pals[palKey(a, d)] || 0) / 60)) * (P.fav.includes(d) ? 1.6 : 1));
    if (b) ds.push(b);
  }
  const [h0, h1] = TV_HOURS[tier], dur = (h0 + Math.random() * (h1 - h0)) * 36e5;
  const o = {id: 't' + Math.round(now / 1000).toString(36) + a, ds, p, t0: Math.round(now), t1: Math.round(now + dur), food, charm, tool, hm: {}, pcs: [], sent: 0, sv: {}, di: {}};
  // 明信片：有帶點心 2 張、沒帶 1 張，幸運符多 1 張。還沒收過的那幾張先寄
  const n = Math.min(3, (food ? 2 : 1) + (charm === 'luck' ? 1 : 0)), got = t.cards[p] || 0;
  const order = [...tvShuffle([0, 1, 2].filter(c => !(got & (1 << c)))), ...tvShuffle([0, 1, 2].filter(c => got & (1 << c)))].slice(0, n);
  const duo = ds.length > 1 ? TV_DUO[p].findIndex(x => (x[0] === ds[0] && x[1] === ds[1]) || (x[0] === ds[1] && x[1] === ds[0])) : -1;
  // 同一趟不寫重複的話：每一隻先寫這個地方的兩句（順序隨機），第三張起改寫哪裡都能用的那兩句
  const wrote = {}, first = {};
  order.forEach((c, i) => {
    const at = Math.round(now + dur * (i + 1) / (n + 1));
    if (i === 0 && duo >= 0){ o.pcs.push({c, at, d: TV_DUO[p][duo][0], u: duo}); return; }
    const d = ds[i % ds.length], k = wrote[d] || 0, own = TV_LINES[p][d].length;
    if (!(d in first)) first[d] = Math.floor(Math.random() * own);
    o.pcs.push({c, at, d, l: k < own ? (first[d] + k) % own : own + Math.floor(Math.random() * (TV_MORE[d] || ['']).length)});
    wrote[d] = k + 1;
  });
  // 土產：一隻一樣，沒拿過的優先；沒帶點心的那一趟不一定有
  const taken = [];
  ds.forEach(d => {
    o.di[d] = Math.floor(Math.random() * TV_DIARY[d].length);
    if (!food && Math.random() >= .4) return;
    const fresh = P.sv.filter(k => !t.sv[k] && !taken.includes(k)), pool = fresh.length ? fresh : P.sv.filter(k => !taken.includes(k));
    const k = pool[Math.floor(Math.random() * pool.length)]; if (k){ o.sv[d] = k; taken.push(k); }
  });
  // 從房間拿走，記下原本在哪（沒擺在房間裡的就不用記）
  ds.forEach(d => {
    const r = RIDS.find(r => home[r] && home[r].items.some(i => i.kind === 'doll' && i.id === d)); if (!r) return;
    const it = home[r].items.find(i => i.kind === 'doll' && i.id === d);
    o.hm[d] = {r, x: Math.round(it.x), y: Math.round(it.y)};
    // 坐在家具上的：存檔裡牠的位置是畫的時候才算的，這裡自己算一次（紙條貼在那個座位上），回來坐回同一個位子
    const f = it.sit ? home[r].items.find(x => x.uid === it.sit && x.kind === 'furn' && FURN[x.id] && FURN[x.id].seats) : null;
    if (f){ try { const [sx, sy] = seatPos(f, it.seat || 0); Object.assign(o.hm[d], {x: Math.round(sx), y: Math.round(sy), sit: f.uid, seat: it.seat || 0}); } catch (e) { Object.assign(o.hm[d], {x: Math.round(f.x), y: Math.round(f.y)}); } }
    home[r].items.forEach(x => { if (x.sit === it.uid) x.sit = null; });
    home[r].items.splice(home[r].items.indexOf(it), 1);
  });
  if (food || charm || tool) t.bag = {};   // 背走了，背包空了
  t.out.push(o);
  return o;
}

/* ---------- 照時間揭曉：寄到的明信片、回家 ---------- */
function tvDeliver(o, pc){
  const t = tvData(), m = mailInit(), other = o.ds.find(d => d !== pc.d) || '';
  const k = `${pc.d}.pc.0#p=${o.p};c=${pc.c}` + (typeof pc.u === 'number' ? `;u=${pc.u}` : `;l=${pc.l | 0}`) + (other ? `;w=${other}` : '');
  m.l.unshift({k, t: tvDate(pc.at), r: 0, a: null, g: 0});
  while (m.l.length > MAIL_MAX){
    let j = -1;
    for (let x = m.l.length - 1; x >= 0; x--) if (m.l[x].r && (!m.l[x].a || m.l[x].g)){ j = x; break; }
    if (j < 0) break;
    m.l.splice(j, 1);
  }
  t.cards[o.p] = (t.cards[o.p] || 0) | (1 << pc.c);
}
function tvPutBack(d, h){
  if (!DOLL_N[d] || !h || RIDS.some(r => home[r] && home[r].items.some(i => i.kind === 'doll' && i.id === d))) return;
  if (!RIDS.includes(h.r) || !home[h.r]) return;
  const it = {uid: uid++, kind: 'doll', id: d, x: typeof h.x === 'number' ? h.x : 50, y: typeof h.y === 'number' ? h.y : 90, sit: null, seat: 0};
  // 原本坐著的那件家具還在、位子也還空著，就坐回去
  const f = h.sit ? home[h.r].items.find(x => x.uid === h.sit && x.kind === 'furn' && FURN[x.id] && FURN[x.id].seats) : null;
  if (f && !home[h.r].items.some(x => x.kind === 'doll' && x.sit === f.uid && (x.seat || 0) === (h.seat || 0))){ it.sit = f.uid; it.seat = h.seat || 0; }
  home[h.r].items.push(it);
}
function tvReturn(o){
  const t = tvData(), day = tvDate(o.t1);
  t.out.splice(t.out.indexOf(o), 1);
  o.ds.forEach(d => {
    const other = o.ds.find(x => x !== d) || '';
    tvPutBack(d, o.hm[d]);
    t.back[d] = o.t1;
    const c = t.cnt[d] = t.cnt[d] || {}; c[o.p] = (c[o.p] || 0) + 1;
    const l = t.log[d] = t.log[d] || []; l.push(`${day}|${o.p}|${other}|${o.di[d] | 0}`); if (l.length > 12) l.splice(0, l.length - 12);
    const k = TV_SOUV[o.sv[d]] ? o.sv[d] : '';
    let dup = 0;
    if (k){
      const fid = tvSouvId(k);
      if (FURN_OWN[fid]){ dup = 1; S.coins += TV_SOUV_COIN; } else { FURN_OWN[fid] = 1; if (typeof newFurnAdd === 'function') newFurnAdd(fid); }
      t.sv[k] = (t.sv[k] || 0) + 1;
    }
    t.wel.push({d, p: o.p, sv: k, dup, di: o.di[d] | 0, w: other});
  });
  if (t.wel.length > 8) t.wel.splice(0, t.wel.length - 8);
  if (o.ds.length > 1){
    // 一起去過：交情加一點；出門前在吵架的，回來就和好了
    const [a, b] = o.ds;
    if (typeof palsData === 'function'){ const p = palsData(), k = palKey(a, b); p[k] = Math.round((p[k] || 0) + 30); }
    if (typeof fightOf === 'function' && fightOf(a, b)) delete S.album.fight;
  }
}
// 回 {pc: 這次寄到幾張, back: 這次回來的娃娃}
function tvSettle(now){
  const t = tvData(), res = {pc: 0, back: [], from: []};
  t.out.slice().forEach(o => {
    while (o.sent < o.pcs.length && o.pcs[o.sent].at <= now){ tvDeliver(o, o.pcs[o.sent]); o.sent++; res.pc++; res.from.push(o); }
    if (o.t1 <= now){ res.back.push(...o.ds); tvReturn(o); }
  });
  return res;
}
// 畫面跟著換：房間、收納架、信箱的數字
function tvRefresh(){
  if (!VISIT){ if (RIDS.includes(roomId)) load(); else renderTray(); }
  if (typeof mailBadge === 'function') mailBadge();
  if (typeof renderHud === 'function') renderHud();
}
// 打開小窩時：先結算，再補算不在的這段時間（最多連續 TV_CHAIN 趟）
let tvOpened = false;
function tvCheck(){
  if (VISIT) return;
  const t = tvData(), now = tvNow();
  let res = tvSettle(now), pcN = res.pc, back = res.back.slice(), changed = !!(res.pc || res.back.length);
  if (!tvOpened){
    tvOpened = true;
    const last = LAST_T || now;
    if (now - last >= 3 * 36e5){
      let vt = last + (tvPacked() ? 20 + Math.random() * 70 : 120 + Math.random() * 180) * 60000;
      for (let i = 0; i < TV_CHAIN && vt < now - 5 * 60000; i++){
        const o = tvPlan(vt); if (!o) break;
        changed = true;
        res = tvSettle(now); pcN += res.pc; back.push(...res.back);
        if (t.out.includes(o)) break;   // 這一趟還沒回來
        vt = o.t1 + (TV_REST_H * 60 + 30 + Math.random() * 150) * 60000;
      }
    }
  }
  if (!changed) return;
  save(); tvRefresh();
  if (!back.length && pcN) toast(pcN > 1 ? `信箱有 ${pcN} 張新的明信片` : '信箱有一張新的明信片');
  if (back.length) tvWelcome();
}
// 人在的時候：看要不要出門。why：open 剛打開、pack 剛放好行李、tick 開著的時候偶爾看一次
function tvLive(why){
  if (VISIT || document.hidden) return null;
  if (typeof skitOn !== 'undefined' && skitOn) return null;   // 正在演小劇場，等一下再說
  const t = tvData(), packed = tvPacked();
  let chance;
  if (packed) chance = why === 'open' ? .85 : why === 'pack' ? .6 : why === 'force' ? 1 : .35;
  else { if (t.free === todayStr() && why !== 'force') return null; chance = why === 'open' ? .3 : why === 'force' ? 1 : .08; }
  if (Math.random() >= chance) return null;
  const o = tvPlan(tvNow()); if (!o) return null;
  if (!packed) t.free = todayStr();
  save(); tvRefresh();
  if (!$('#sheet').hidden && $('#sheet .tv-bagbox')) tvBagOpen();
  toast(`${tvNames(o.ds)}${packed ? '背著背包出門了' : '自己出門走走了'}，${TV_PLACES[o.p].dir}`);
  return o;
}

/* ---------- 兩台裝置的進度合在一起（js/account.js 的 mergeSave 會叫）----------
   m：合併後的那份（以雲端為底，房間擺設是雲端的）；g：這台的。兩邊都是純資料，這裡不碰畫面也不碰 S。
   取法：
   - 行李用品的數量取多的、道具兩邊有的都算；收到的明信片、土產、去過幾次、日記、回來的時間：兩邊合起來，數字取大的。
   - 在外面的旅程：兩邊的都拿來，同一趟（id 一樣）只留一份、寄到第幾張取多的；
     同一隻娃娃在兩台各出門一趟的，留出門時間比較早的那一趟，另一趟當作沒發生（行李不補）。
   - 已經在另一台回過家的那一趟（回來的時間記過了）不再算在外面，不然會回家兩次、土產拿兩份。
   - 最後把房間對齊：留下來的旅程，娃娃不能還擺在房間裡；被拿掉的旅程，娃娃要回到原本的位置。 */
function tvMerge(m, g){
  const gt = g && g.album && g.album.tv; if (!gt || typeof gt !== 'object') return m;
  const ma = m.album = m.album || {}, had = ma.tv && typeof ma.tv === 'object';
  const t = ma.tv = had ? ma.tv : {};
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {}), arr = x => (Array.isArray(x) ? x : []);
  const okTrip = o => o && typeof o.id === 'string' && Array.isArray(o.ds) && o.ds.length && Array.isArray(o.pcs) && typeof o.t0 === 'number' && typeof o.t1 === 'number';
  if (!had) t.bag = obj(gt.bag); else t.bag = obj(t.bag);
  t.inv = obj(t.inv); Object.entries(obj(gt.inv)).forEach(([k, n]) => { t.inv[k] = Math.max(t.inv[k] || 0, n | 0); });
  t.tool = Object.assign({}, obj(gt.tool), obj(t.tool));
  t.cards = obj(t.cards); Object.entries(obj(gt.cards)).forEach(([k, b]) => { t.cards[k] = (t.cards[k] || 0) | (b | 0); });
  t.sv = obj(t.sv); Object.entries(obj(gt.sv)).forEach(([k, n]) => { t.sv[k] = Math.max(t.sv[k] || 0, n | 0); });
  t.back = obj(t.back); Object.entries(obj(gt.back)).forEach(([d, x]) => { t.back[d] = Math.max(t.back[d] || 0, +x || 0); });
  t.cnt = obj(t.cnt); Object.entries(obj(gt.cnt)).forEach(([d, c]) => { const mc = t.cnt[d] = obj(t.cnt[d]); Object.entries(obj(c)).forEach(([p, n]) => { mc[p] = Math.max(mc[p] || 0, n | 0); }); });
  t.log = obj(t.log); Object.entries(obj(gt.log)).forEach(([d, l]) => { t.log[d] = [...new Set([...arr(t.log[d]), ...arr(l)])].sort().slice(-12); });
  const wk = w => JSON.stringify(w), seenW = new Set(arr(t.wel).map(wk));
  t.wel = [...arr(t.wel), ...arr(gt.wel).filter(w => !seenW.has(wk(w)))].slice(-8);
  t.free = [t.free || '', gt.free || ''].sort().pop(); if (!t.free) delete t.free;
  // 旅程
  const all = {};
  [...arr(t.out), ...arr(gt.out)].filter(okTrip).forEach(o => { const e = all[o.id]; if (!e) all[o.id] = JSON.parse(JSON.stringify(o)); else e.sent = Math.max(e.sent | 0, o.sent | 0); });
  const keep = [], drop = [], busy = new Set();
  Object.values(all).sort((a, b) => a.t0 - b.t0).forEach(o => {
    const done = o.ds.every(d => (t.back[d] || 0) >= o.t1);
    if (done || o.ds.some(d => busy.has(d))) drop.push(o); else { keep.push(o); o.ds.forEach(d => busy.add(d)); }
  });
  t.out = keep;
  // 房間對齊
  const H = m.home || {}, rooms = Object.keys(H).filter(r => H[r] && Array.isArray(H[r].items));
  const where = d => rooms.find(r => H[r].items.some(i => i && i.kind === 'doll' && i.id === d));
  keep.forEach(o => o.ds.forEach(d => { const r = where(d); if (!r) return; const it = H[r].items.find(i => i.kind === 'doll' && i.id === d); H[r].items.forEach(x => { if (x.sit === it.uid) x.sit = null; }); H[r].items.splice(H[r].items.indexOf(it), 1); }));
  let next = Math.max(m.uid || 0, g.uid || 0, ...rooms.map(r => Math.max(0, ...H[r].items.map(i => i.uid || 0)))) + 1;
  const out = obj(ma.out).d;   // 去朋友家過夜的那一隻不在房間裡是對的
  drop.forEach(o => o.ds.forEach(d => {
    if (busy.has(d) || d === out || where(d) || !(m.dollN && m.dollN[d])) return;
    const h = obj(o.hm)[d]; if (!h || !rooms.includes(h.r)) return;
    H[h.r].items.push({uid: next++, kind: 'doll', id: d, x: typeof h.x === 'number' ? h.x : 50, y: typeof h.y === 'number' ? h.y : 90, sit: null, seat: 0});
  }));
  m.uid = Math.max(m.uid || 0, next);
  return m;
}

/* ---------- 明信片的樣子 ---------- */
// ds：貼在上面的娃娃（空的 = 只有風景，相簿的小圖用）
function tvCardHTML(p, c, ds){
  const card = (TV_CARDS[p] || [])[c]; if (!card) return '';
  const [x, y, w] = card.at, two = ds.length > 1;
  const dolls = ds.filter(d => SPR[d]).slice(0, 2).map((d, i) => `<span class="tvpc-d" style="left:${x + (two ? (i ? 11 : -11) : 0)}%;top:${y - (two && i ? 1.5 : 0)}%;width:${w * (two ? .88 : 1)}%"><img src="${SPR[d]}" alt="${DOLL_NAME[d]}"></span>`).join('');
  return `<div class="tvpc"><svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${card.svg()}</svg>${dolls}</div>`;
}
// 信箱（js/mail.js 的 mailText）用：標題、背面的話、寄的人、圖
function tvMailText(d, q){
  const P = TV_PLACES[q.p], c = +q.c || 0, card = P && TV_CARDS[q.p][c];
  if (!P || !card) return {title: '明信片', body: '', from: DOLL_NAME[d] || '', pic: ''};
  const duo = q.u !== undefined ? TV_DUO[q.p][+q.u] : null;
  const ds = duo ? [duo[0], duo[1]] : (DOLLS.includes(q.w) ? [d, q.w] : [d]);
  const body = duo ? `${DOLL_NAME[duo[0]]}：${duo[2]}\n${DOLL_NAME[duo[1]]}：${duo[3]}` : tvLinesOf(q.p, d)[+q.l || 0] || '';
  return {title: `${P.name}的明信片`, body, from: duo ? tvNames(ds) : DOLL_NAME[d], pic: tvCardHTML(q.p, c, ds) + `<p class="tvpc-cap">${P.name}・${card.name}${ds.length > 1 && !duo ? `（和${DOLL_NAME[q.w]}一起）` : ''}</p>`};
}

/* ---------- 背包（客廳門邊，固定在那裡）和原本位置的紙條 ---------- */
function tvBagSVG(){
  const pk = tvPacked(), pal = window.PAPER ? window.PAPER.tone() : null;
  const c = pal ? {a: pal.a2, b: pal.a2d || pal.a2, s: pal.sun, w: pal.wood, p: pal.paper, k: pal.ink} : {a: '#7fc4d8', b: '#4a9fd0', s: '#ffd75e', w: '#a8714f', p: '#fff', k: '#6b2d4a'};
  const ol = pal ? '' : ` stroke="${c.b}" stroke-width="2" stroke-linejoin="round"`;
  return `<svg viewBox="0 0 60 66"><path d="M22 14c0-10 16-10 16 0" fill="none" stroke="${c.w}" stroke-width="3.400" stroke-linecap="round"/>
    ${pk ? `<circle cx="22" cy="14" r="7" fill="${c.p}"/><rect x="18" y="14" width="8" height="6" fill="${c.k}"/><circle cx="38" cy="13" r="6" fill="${c.s}"/>` : ''}
    <path d="M10 ${pk ? 20 : 24}c0-5 4-8 9-8h22c5 0 9 3 9 8v32c0 5-4 8-9 8H19c-5 0-9-3-9-8z" fill="${c.a}"${ol}/>
    <path d="M10 ${pk ? 24 : 28}h40v10c0 3-2 5-5 5H15c-3 0-5-2-5-5z" fill="${c.b}"/>
    <rect x="18" y="44" width="24" height="13" rx="4" fill="${c.p}" opacity=".9"/><rect x="26" y="33" width="8" height="9" rx="2.500" fill="${c.s}"/>
    <path d="M6 30c-3 2-4 18 0 24" fill="none" stroke="${c.w}" stroke-width="3" stroke-linecap="round"/><path d="M54 30c3 2 4 18 0 24" fill="none" stroke="${c.w}" stroke-width="3" stroke-linecap="round"/></svg>`;
}
function tvRoomPaint(){
  room.querySelectorAll('.tvx').forEach(e => e.remove());
  if (VISIT) return;
  if (roomId === 'living'){
    const b = document.createElement('button');
    b.className = 'fx fx-bag tvx' + (tvPacked() ? ' on' : ''); b.setAttribute('aria-label', tvPacked() ? '行李（準備好了）' : '行李');
    b.setAttribute('style', 'left:66.500%;width:11%;bottom:calc(100% - var(--wh,52%) - 3.6%)');
    b.innerHTML = tvBagSVG();
    b.onclick = () => tvBagOpen();
    room.appendChild(b);
  }
  tvData().out.forEach(o => o.ds.forEach(d => {
    const h = o.hm[d]; if (!h || h.r !== roomId) return;
    const n = document.createElement('button');
    n.className = 'tvx st-note tv-note'; n.setAttribute('aria-label', `${DOLL_NAME[d]}去${TV_PLACES[o.p].name}了`);
    n.style.left = h.x + '%'; n.style.top = roomY(h.y) + '%'; n.style.zIndex = 60 + Math.round(h.y * 3);
    n.innerHTML = `<span>${DOLL_NAME[d]}<br>去${TV_PLACES[o.p].name.replace('山上的', '')}了</span>`;
    n.onclick = () => tvNoteTap(d);
    room.appendChild(n);
  }));
}
// 房間每次重畫完補回去（接在 away.js、stay.js 的 afterRoomRender 後面）；固定的構造重畫時也補
{
  const prev = typeof afterRoomRender === 'function' ? afterRoomRender : null;
  afterRoomRender = function(){ if (prev) prev(); tvRoomPaint(); };
  if (typeof fixPaint === 'function'){ const fp = fixPaint; fixPaint = function(){ fp.apply(this, arguments); tvRoomPaint(); }; }
}
const tvOutLine = o => `${tvNames(o.ds)}去${TV_PLACES[o.p].name}了，大概${tvWhen(o.t1)}回來`;
function tvNoteTap(d){
  const o = tvTrip(d); if (!o) return;
  const P = TV_PLACES[o.p];
  openSheet(`<div class="hd">${TV_BAG_ICON}<span>${tvNames(o.ds)}去旅行了</span></div>
    <div class="st-box"><p class="st-hi">${P.dir}走了，大概${tvWhen(o.t1)}回來。</p>
      <p class="bk-note">路上會寄明信片到信箱${o.sent ? `，已經寄了 ${o.sent} 張` : ''}。不用等牠，時間到了牠自己會回家。</p></div>
    <div class="ml-ft"><button class="btn" data-tv="bag">看行李</button><button class="btn" data-tv="album">旅行相簿</button></div>`);
  evOpen = false; alOpen = false;
}

/* ---------- 行李 ---------- */
function tvBagOpen(){
  if (VISIT) return;
  const t = tvData(), bag = t.bag;
  const slot = ([k, name, tip]) => {
    const ids = Object.keys(TV_GOODS).filter(id => TV_GOODS[id].slot === k);
    const have = ids.filter(id => (k === 'tool' ? t.tool[id] : (t.inv[id] || 0) > 0 || bag[k] === id));
    const chips = have.map(id => {
      const g = TV_GOODS[id], on = k === 'tool' ? tvToolList(bag.tool).includes(id) : bag[k] === id, away = k === 'tool' && !tvToolFree(id);
      return `<button class="ng-chip tv-chip ${on ? 'on' : ''}" data-tvp="${id}" ${away ? 'disabled' : ''} aria-pressed="${on}" aria-label="${g.name}${on ? '，已經放進背包' : ''}">${g.ic}<span>${g.name}${k === 'tool' ? (away ? '（帶出門了）' : '') : ` ×${(t.inv[id] || 0) + (on ? 1 : 0)}`}</span></button>`;
    }).join('');
    const picked = k === 'tool' ? tvToolList(bag.tool) : (TV_GOODS[bag[k]] ? [bag[k]] : []);
    const now = picked.length ? `<small class="tv-tip">${picked.map(id => TV_GOODS[id].tip).join('、')}</small>` : '';
    return `<div class="tv-slot"><div class="al-sec">${name}<small>${tip}</small></div>${have.length ? `<div class="ng-chips">${chips}</div>${now}` : '<p class="bk-note">還沒有。火腿的小店有賣。</p>'}</div>`;
  };
  const out = t.out.length ? `<div class="al-sec">出門的</div><ul class="al-ln al-st">${t.out.map(o => `<li>${tvOutLine(o)}</li>`).join('')}</ul>` : '';
  openSheet(`<div class="hd">${TV_BAG_ICON}<span>行李</span></div>
    <div class="tv-box tv-bagbox"><p class="st-hi">${tvPacked() ? '放好了。誰想出門，會自己背走。' : '想放什麼就放，放好就不用管了。誰去、去哪裡，牠們自己決定。'}</p>
      ${TV_SLOTS.map(slot).join('')}${out}
      <p class="bk-note">沒放東西牠們也會出門，只是走不遠。點一下放進去，再點一下拿出來。</p></div>
    <div class="ml-ft"><button class="btn" data-tv="shop">去小店</button><button class="btn" data-tv="album">旅行相簿</button></div>`);
  evOpen = false; alOpen = false;
}
let tvPackT = 0;
function tvPack(id){
  const g = TV_GOODS[id]; if (!g) return;
  const t = tvData(), bag = t.bag, k = g.slot;
  if (k === 'tool'){
    if (!tvToolFree(id)) return;
    const l = tvToolList(bag.tool);
    bag[k] = (l.includes(id) ? l.filter(x => x !== id) : [...l, id]).join(',');
  } else if (bag[k] === id){ t.inv[id] = (t.inv[id] || 0) + 1; bag[k] = ''; }
  else {
    if (!(t.inv[id] > 0)) return;
    if (bag[k] && TV_GOODS[bag[k]]) t.inv[bag[k]] = (t.inv[bag[k]] || 0) + 1;   // 原本放的那個拿回來
    t.inv[id]--; bag[k] = id;
  }
  if (!bag[k]) delete bag[k];
  save(); tvRoomPaint(); tvBagOpen();
  // 放好之後過一下，看有沒有誰想出門
  clearTimeout(tvPackT);
  if (tvPacked()) tvPackT = setTimeout(() => tvLive('pack'), 20000);
}

/* ---------- 小店多一櫃 ---------- */
function tvShopHTML(){
  const t = tvData();
  const cards = Object.keys(TV_GOODS).map(id => {
    const g = TV_GOODS[id], tool = g.slot === 'tool', n = tool ? (t.tool[id] ? 1 : 0) : (t.inv[id] || 0) + (t.bag[g.slot] === id ? 1 : 0);
    const full = tool ? n > 0 : n >= TV_INV_MAX;
    return `<div class="sp-it tv-git ${tool && n ? 'own' : ''}"><span class="tile tv-gd">${g.ic}${!tool && n ? `<span class="nw">${n}</span>` : ''}</span><b>${g.name}</b><span class="rm-tag">${g.tip}</span>
      ${full ? `<small>${tool ? '有了' : '放不下了'}</small>` : `<button class="btn y sm" data-tvbuy="${id}" aria-label="買${g.name}，${g.price} 枚幣">${COIN}${g.price}</button>`}</div>`;
  }).join('');
  return `<div class="al-sec tv-shophd">行李用品<small>放進客廳門邊的背包。點心和護身符用一次，道具可以一直用</small></div><div class="sp-grid">${cards}</div>`;
}
function tvBuy(id){
  const g = TV_GOODS[id]; if (!g) return;
  const t = tvData();
  if (g.slot === 'tool' ? t.tool[id] : (t.inv[id] || 0) + (t.bag[g.slot] === id ? 1 : 0) >= TV_INV_MAX) return;
  if (S.coins < g.price){ toast(`還差 ${g.price - S.coins} 枚幣`); return; }
  S.coins -= g.price;
  if (g.slot === 'tool') t.tool[id] = 1; else t.inv[id] = (t.inv[id] || 0) + 1;
  renderHud(); save();
  toast(`買了${g.name}，點客廳門邊的背包放進去`);
  if ($('#sheet .sp-box')) shopOpen(true);
}

/* ---------- 回家 ---------- */
let tvWelT = 0;
function tvWelcome(){
  clearTimeout(tvWelT);
  const t = tvData(); if (!t.wel.length || VISIT) return;
  // 封面還在、或別的面板開著：等一下再說
  if (($('#cover') && !$('#cover').hidden) || !$('#sheet').hidden){ tvWelT = setTimeout(tvWelcome, 2500); return; }
  const rows = t.wel.map(w => {
    const P = TV_PLACES[w.p] || TV_PLACES.park, s = TV_SOUV[w.sv];
    const got = s ? `<div class="tv-got"><span class="tile">${furnSVG(tvSouvId(w.sv))}</span><small>帶回來一個${s.name}。${w.dup ? `家裡已經有了，換成 ${TV_SOUV_COIN} 枚幣。` : '放在收納架的家具那一頁，每一間都能擺。'}</small></div>` : '<small class="tv-none">這次沒有帶東西回來。</small>';
    return `<div class="ev tv-wel"><img src="${SPR[w.d]}" alt=""><div><b>${DOLL_NAME[w.d]}從${P.name}回來了${w.w ? `<small>和${DOLL_NAME[w.w]}一起</small>` : ''}</b><p>「${(TV_DIARY[w.d][w.di] || TV_DIARY[w.d][0]).replace(/\{p\}/g, P.name)}」</p>${got}</div></div>`;
  }).join('');
  openSheet(`<div class="hd">${TV_BAG_ICON}<span>回家了</span></div><div class="tv-box">${rows}</div>
    <div class="ml-ft"><button class="btn y" data-tv="welok">好</button><button class="btn" data-tv="album">旅行相簿</button></div>`);
  t.wel = []; save();
  evOpen = false; alOpen = false;
}

/* ---------- 相簿：旅行那一本、每一隻那一頁的幾行、小屋地圖下面的一行 ---------- */
let tvBig = null;
function tvAlbumOpen(){
  const t = tvData();
  const total = Object.keys(TV_PLACES).reduce((n, p) => n + [0, 1, 2].filter(c => (t.cards[p] || 0) & (1 << c)).length, 0);
  const pages = Object.keys(TV_PLACES).map(p => {
    const P = TV_PLACES[p], got = t.cards[p] || 0;
    const cards = [0, 1, 2].map(c => (got & (1 << c)
      ? `<button class="tv-th" data-tvc="${p}:${c}" aria-label="${P.name}，${TV_CARDS[p][c].name}">${tvCardHTML(p, c, [])}<small>${TV_CARDS[p][c].name}</small></button>`
      : '<span class="tv-th no" aria-label="還沒收到"><i></i><small>還沒收到</small></span>')).join('');
    const svs = P.sv.map(k => (t.sv[k] ? `<span class="tv-sv"><span class="tile">${furnSVG(tvSouvId(k))}</span><small>${TV_SOUV[k].name}</small></span>` : '<span class="tv-sv no"><span class="tile"></span><small>？</small></span>')).join('');
    const who = DOLLS.filter(d => t.cnt[d] && t.cnt[d][p]).map(d => `<span class="tv-who"><img src="${SPR[d]}" alt="${DOLL_NAME[d]}">${t.cnt[d][p]}</span>`).join('');
    return `<div class="tv-pl"><div class="al-sec">${P.name}<small>${TV_TIER_NAME[P.tier]}${P.night ? '・晚上才去' : ''}</small></div>
      <div class="tv-cards">${cards}</div><div class="tv-row">${svs}<span class="tv-whos">${who || '<small>還沒有人去過</small>'}</span></div></div>`;
  }).join('');
  const big = tvBig && ((t.cards[tvBig[0]] || 0) & (1 << tvBig[1])) ? `<div class="tv-big">${tvCardHTML(tvBig[0], tvBig[1], [])}<p class="tvpc-cap">${TV_PLACES[tvBig[0]].name}・${TV_CARDS[tvBig[0]][tvBig[1]].name}</p></div>` : '';
  openSheet(`<div class="hd">${TV_BAG_ICON}<span>旅行</span><small class="pc-left">明信片 ${total} / 12</small></div>
    <div class="tv-box tv-album">${t.out.length ? `<ul class="al-ln al-st">${t.out.map(o => `<li>${tvOutLine(o)}</li>`).join('')}</ul>` : ''}${big}${pages}
      <p class="bk-note">明信片是牠們路上寄回來的，信箱裡看得到背面寫的話。土產每一間都能擺。</p></div>
    <div class="ml-ft"><button class="btn" data-tv="bag">看行李</button><button class="btn" data-tv="back">回相簿</button></div>`);
  evOpen = false; alOpen = false;
}
function tvRows(d){
  const t = tvData(), l = t.log[d] || [], o = tvTrip(d);
  if (!l.length && !o) return '';
  return `<div class="al-sec">旅行</div><ul class="al-ln al-st">${o ? `<li>現在去${TV_PLACES[o.p].name}了，大概${tvWhen(o.t1)}回來</li>` : ''}${l.slice().reverse().slice(0, 6).map(x => {
    const [day, p, w, di] = x.split('|'), P = TV_PLACES[p] || TV_PLACES.park;
    return `<li>${md(day)}　${(TV_DIARY[d][+di] || TV_DIARY[d][0]).replace(/\{p\}/g, P.name)}${DOLL_NAME[w] ? `（和${DOLL_NAME[w]}一起）` : ''}</li>`;
  }).join('')}</ul>`;
}
const tvMapNote = () => tvData().out.map(o => `<p class="bk-note tv-mapn">${TV_BAG_ICON}${tvOutLine(o)}。</p>`).join('');
// 相簿最上面多一顆「旅行」
if (typeof openAlbum === 'function'){
  const prev = openAlbum;
  openAlbum = function(d){
    prev(d);
    const hd = $('#sheet .hd');
    if (hd && !VISIT && !hd.querySelector('[data-tv]')) hd.insertAdjacentHTML('beforeend', `<button class="btn sm al-memo al-tv" data-tv="album">旅行</button>`);
  };
}
// 收納架的家具那一頁：最後多一排土產（有了才列；每一間都能擺，擺在別間的標房間，點了搬過來）
{
  const prev = renderTray;
  renderTray = function(){
    prev.apply(this, arguments);
    if (tab !== 'furn' || VISIT) return;
    const own = Object.keys(TV_SOUV).map(tvSouvId).filter(id => FURN_OWN[id]); if (!own.length) return;
    const nw = typeof newFurnList === 'function' ? newFurnList() : [];
    $('#items').insertAdjacentHTML('beforeend', `<span class="grp">${TV_BAG_ICON}</span>` + own.map(id => {
      const w = whereFurn(id), here = w === roomId, away = w && !here;
      return `<button class="tile ${here ? 'placed' : ''} ${away ? 'away' : ''}" data-furn="${id}" aria-label="${FURN[id].name}">${furnSVG(id)}${here ? CK : ''}${away ? `<span class="rm">${ICON[w]}</span>` : ''}${!w && nw.includes(id) ? '<span class="nw">新</span>' : ''}</button>`;
    }).join(''));
  };
}

/* ---------- 按鈕 ---------- */
$('#sheet').addEventListener('click', e => {
  const p = e.target.closest('[data-tvp]'); if (p){ tvPack(p.dataset.tvp); return; }
  const by = e.target.closest('[data-tvbuy]'); if (by){ tvBuy(by.dataset.tvbuy); return; }
  const c = e.target.closest('[data-tvc]'); if (c){ const [pl, i] = c.dataset.tvc.split(':'); tvBig = tvBig && tvBig[0] === pl && tvBig[1] === +i ? null : [pl, +i]; tvAlbumOpen(); const bx = $('#sheet .tv-album'); if (bx) bx.scrollTop = 0; return; }
  const b = e.target.closest('[data-tv]'); if (!b) return;
  const a = b.dataset.tv;
  if (a === 'bag') tvBagOpen();
  else if (a === 'album'){ tvBig = null; tvAlbumOpen(); }
  else if (a === 'shop'){ if (typeof shopOpen === 'function') shopOpen(); }
  else if (a === 'back'){ if (typeof openAlbum === 'function') openAlbum(); }
  else if (a === 'welok') $('#sheet').hidden = true;
});

/* ---------- 什麼時候看 ---------- */
tvCheck();   // 一載入就結算：封面打開之前，房間裡的紙條和回來的娃娃就是對的
$('#coverGo')?.addEventListener('click', () => { setTimeout(tvWelcome, 1600); setTimeout(() => tvLive('open'), 9000); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) tvCheck(); });
setInterval(() => { if (document.hidden) return; tvCheck(); tvLive('tick'); }, 10 * 60000);
// 測試用，只在 console 叫得到；時間只在這次開著的時候往後撥，不會存起來
window.tvDebug = {
  skip(h){ tvSkew += (+h || 0) * 36e5; tvCheck(); return new Date(tvNow()).toString(); },
  go(){ const o = tvLive('force'); return o ? `${tvNames(o.ds)} → ${TV_PLACES[o.p].name}` : '現在沒有人出門'; },
  state(){ return JSON.parse(JSON.stringify(tvData())); },
};

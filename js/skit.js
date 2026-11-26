/* 小劇場（第三步，2026-11-26）：幾隻娃娃真的在房間裡演一小段。劇本在 js/skitdata.js，加新的不用改這裡。
   - 每天自動準備 3～5 段（優先挑還沒看過、演員現在在同一間的）。條件到了（演員都在這一間、需要的家具在、下雨或晚上…），
     帶頭那隻頭上冒「！」，玩家點了才開始演；沒點也不會消失，當天都在，不催人。
   - 演出：一步一步走位、頭上輪流冒對話、做動作；上面一條顯示標題和旁白，可以按「跳過」。
     有些演到一半會問你，選的不一樣結局不一樣。
   - 看完記進相簿（那幾隻的頁面都有），可以重看；每一段第一次看完給 1 枚幣。
   - 連續劇：前一集看過、隔天才會排下一集。
   - 「今天的小事」照舊在清單裡；做完一件時，有關的娃娃會在房間裡跳一下，上面顯示那件事的結果。
   存檔都放在相簿裡的一格（不改雲端規則）：S.album.skit = {d:'今天', q:[今天準備的], done:[今天演過的], s:{代號:第幾個結局}, ep:{連續劇:{n:看到第幾集, d:'哪天看的'}}}
   演的時候娃娃走到哪裡跟平常亂晃一樣不存檔，演完各自回家。 */
const SKIT_COIN = 1;
let skitOn = null, skitReady = {};   // skitOn：正在演的那一段；skitReady：{娃娃: 準備好的那一段}
const skitById = id => SKITS.find(s => s.id === id);
function skitData(){
  const a = S.album.skit = S.album.skit || {};
  a.q = Array.isArray(a.q) ? a.q : []; a.done = Array.isArray(a.done) ? a.done : []; a.s = a.s || {}; a.ep = a.ep || {};
  return a;
}
const skitSeen = id => id in skitData().s;
// 這一段現在排不排得進來：演員都有、要的家具有、連續劇輪到這一集
function skitCan(sc, t){
  if (!sc.cast.every(d => DOLL_N[d])) return false;
  if (sc.need.furn && !FURN_OWN[sc.need.furn]) return false;
  if (sc.need.room && !home[sc.need.room]) return false;
  if (sc.serial){ const e = skitData().ep[sc.serial] || {n: 0}; if (sc.ep !== e.n + 1 || e.d === t) return false; }
  return true;
}
const skitRoomOf = d => RIDS.find(r => home[r].items.some(i => i.kind === 'doll' && i.id === d));
const skitTogether = sc => { const r = skitRoomOf(sc.cast[0]); return !!r && sc.cast.every(d => skitRoomOf(d) === r) && (!sc.need.furn || home[r].items.some(i => i.kind === 'furn' && i.id === sc.need.furn)); };
// 每天排一次：3～5 段。沒看過的優先，演員現在就在同一間的優先；連續劇一天最多排一集
function skitPlan(){
  const a = skitData(), t = todayStr();
  if (a.d === t) return;
  const seed = typeof hashStr === 'function' ? hashStr('skit' + t) ^ (S.seed || 1) : 1, rr = typeof mulberry32 === 'function' ? mulberry32(seed) : Math.random;
  const pool = SKITS.filter(sc => skitCan(sc, t)).map(sc => ({sc, k: (skitSeen(sc.id) ? 0 : 2) + (skitTogether(sc) ? 3 : 0) + rr()})).sort((x, y) => y.k - x.k);
  const n = 3 + Math.floor(rr() * 3), q = [];
  let serial = 0;
  for (const {sc} of pool){ if (q.length >= n) break; if (sc.serial){ if (serial) continue; serial++; } q.push(sc.id); }
  a.d = t; a.q = q; a.done = [];
  save();
}
// 現在這間：哪幾段可以演
function skitScan(){
  const a = skitData(), here = new Set(roamDolls().map(i => i.id));
  const ready = {};
  if (!VISIT && !skitOn) a.q.forEach(id => {
    const sc = skitById(id); if (!sc || a.done.includes(id) || Object.keys(ready).length >= 2) return;
    if (!sc.cast.every(d => here.has(d) && !(typeof asleep === 'function' && asleep(d)))) return;
    if (sc.need.furn && !items.some(i => i.kind === 'furn' && i.id === sc.need.furn)) return;
    if (sc.need.rain && !(typeof skyWeather === 'function' && skyWeather() === 'rain')) return;
    if (sc.need.night && !isNight()) return;
    if (!ready[sc.cast[0]]) ready[sc.cast[0]] = sc;
  });
  skitReady = ready;
  room.querySelectorAll('.it.doll').forEach(el => {
    const it = items.find(i => String(i.uid) === el.dataset.u), on = !!it && !!ready[it.id];
    let b = el.querySelector('.skit-bang');
    if (on && !b){ b = document.createElement('i'); b.className = 'skit-bang'; b.textContent = '！'; b.setAttribute('aria-label', '有小劇場'); el.appendChild(b); }
    else if (!on && b) b.remove();
  });
}

/* ---------- 演 ---------- */
const skitSleep = ms => new Promise(r => setTimeout(r, ms));
const skitDoll = d => items.find(i => i.kind === 'doll' && i.id === d);
function skitTarget(who, to){
  const me = skitDoll(who), [x, y] = roamPos(me);
  if (to === 'c') return [50, 84];
  if (to === 'l') return [22, 86];
  if (to === 'r') return [78, 86];
  const o = skitDoll(to);
  if (o){ const [ox, oy] = roamPos(o); return [Math.max(10, Math.min(90, ox + (x < ox ? -11 : 11))), Math.max(58, Math.min(94, oy + 1))]; }
  const f = items.find(i => i.kind === 'furn' && i.id === to);
  if (f) return [Math.max(10, Math.min(90, f.x + (x < f.x ? -8 : 8))), Math.max(58, Math.min(94, f.y + 3))];
  return [50, 84];
}
function skitBar(title){
  let b = $('#skitBar');
  if (!b){ b = document.createElement('div'); b.id = 'skitBar'; b.className = 'skit-bar'; room.appendChild(b); }
  b.innerHTML = `<b></b><span class="cap"></span><button class="btn sm" data-skip>跳過</button>`;
  b.querySelector('b').textContent = title;
  // 跳過：正在等玩家選的話，也一起收掉
  b.querySelector('[data-skip]').onclick = () => { const r = skitOn; if (!r) return; r.skip = true; if (r.q){ const q = r.q, res = r.res; r.q = null; q.remove(); res(-1); } };
  return b;
}
const skitCap = t => { const c = $('#skitBar .cap'); if (c) c.textContent = t || ''; };
async function skitRun(run, steps){
  for (const s of steps){
    if (run.skip || skitOn !== run) return;
    if (typeof s !== 'string'){
      // 問玩家：等他選
      const pick = await new Promise(res => {
        const q = document.createElement('div'); q.className = 'skit-q';
        q.innerHTML = `<p></p>${s.o.map((o, i) => `<button class="btn ${i ? '' : 'y'}" data-o="${i}"></button>`).join('')}`;
        q.querySelector('p').textContent = s.q;
        q.querySelectorAll('button').forEach((b, i) => { b.textContent = s.o[i][0]; b.onclick = () => { q.remove(); res(i); }; });
        room.appendChild(q); run.q = q; run.res = res;
      });
      run.q = null;
      if (pick < 0 || run.skip || skitOn !== run) return;
      run.end = pick; run.endText = s.o[pick][2];
      await skitRun(run, s.o[pick][1]);
      continue;
    }
    const sp = s.indexOf(' '), t = sp < 0 ? s : s.slice(0, sp), rest = sp < 0 ? '' : s.slice(sp + 1);
    if (t === 'w'){ await skitSleep(900); continue; }
    if (t === 'n'){ skitCap(rest); await skitSleep(1500); continue; }
    const sp2 = rest.indexOf(' '), who = rest.slice(0, sp2), arg = rest.slice(sp2 + 1), it = skitDoll(who);
    if (!it) continue;
    if (t === 's'){ roamSay(it, arg); await skitSleep(1250 + [...arg].length * 95); }
    else if (t === 'a'){ if (!REDUCE) roamIdle(it, arg); await skitSleep(900); }
    else if (t === 'm'){
      if (REDUCE) continue;
      const [x, y] = skitTarget(who, arg);
      await new Promise(res => { roamHopTo(it, x, y, res); const t0 = Date.now(), iv = setInterval(() => { const st = RS[it.uid]; if (!st || !st.busy || Date.now() - t0 > 6000 || skitOn !== run){ clearInterval(iv); res(); } }, 120); });
      await skitSleep(200);
    }
  }
}
async function skitPlay(sc, replay){
  if (skitOn || VISIT) return;
  const run = skitOn = {sc, replay, skip: false, end: 0, endText: sc.end};
  $('#sheet').hidden = true;
  skitScan();
  screen.classList.add('skit-on');
  skitBar(sc.title);
  // 正在動的先停下來
  sc.cast.forEach(d => { const it = skitDoll(d), st = it && RS[it.uid]; if (st){ clearTimeout(st.timer); st.busy = false; } });
  await skitRun(run, sc.steps);
  if (skitOn !== run) return;      // 中途換房間了
  skitEnd(run);
}
function skitEnd(run){
  const sc = run.sc, a = skitData(), first = !skitSeen(sc.id);
  if (run.q){ run.q.remove(); if (run.res) run.res(-1); }
  const bar = $('#skitBar'); if (bar) bar.remove();
  room.querySelectorAll('.say').forEach(e => e.remove());
  screen.classList.remove('skit-on');
  skitOn = null;
  // 演完各自回家（不存位置）
  sc.cast.forEach(d => { const it = skitDoll(d); if (it) roamHome(it); });
  roamDolls().forEach(it => { roamSt(it).next = Date.now() + rnd(6, 14) * 1000; });
  if (!run.replay){
    if (!a.done.includes(sc.id)) a.done.push(sc.id);
    if (!(sc.id in a.s) || !run.skip) a.s[sc.id] = run.end | 0;
    if (sc.serial) a.ep[sc.serial] = {n: Math.max(sc.ep, (a.ep[sc.serial] || {}).n || 0), d: todayStr()};
    for (let i = 0; i < sc.cast.length; i++) for (let j = i + 1; j < sc.cast.length; j++) if (typeof palBump === 'function') palBump(sc.cast[i], sc.cast[j], 3);
    if (first){ S.coins += SKIT_COIN; renderHud(); }
    save();
    toast(first ? `「${sc.title}」收進相簿了，+${SKIT_COIN} 枚幣` : `「${sc.title}」演完了`);
  }
  skitScan();
}
function skitAbort(){
  const run = skitOn; if (!run) return;
  skitOn = null;
  if (run.q){ run.q.remove(); if (run.res) run.res(-1); }
  const bar = $('#skitBar'); if (bar) bar.remove();
  screen.classList.remove('skit-on');
}

/* ---------- 相簿：看過的小劇場，可以重看 ---------- */
function skitEndText(sc){
  const i = skitData().s[sc.id] | 0, q = sc.steps.find(s => typeof s !== 'string');
  return sc.end || (q && q.o[i] ? q.o[i][2] : '');
}
function skitRows(d){
  const a = skitData(), seen = SKITS.filter(sc => sc.cast.includes(d) && sc.id in a.s);
  const total = SKITS.filter(sc => sc.cast.includes(d)).length;
  if (!seen.length) return '';
  return `<div class="al-sec">小劇場 ${seen.length}/${total}</div>${seen.map(sc => `<div class="al-sk"><div><b>${sc.title}</b><p>${skitEndText(sc)}</p></div><button class="btn sm" data-skit="${sc.id}">重看</button></div>`).join('')}`;
}
// 重看：演員都在現在這間就再演一次（不給幣、不改紀錄）；不在的話把台詞列出來
function skitReplay(id){
  const sc = skitById(id); if (!sc) return;
  const here = new Set(roamDolls().map(i => i.id));
  if (!VISIT && page === 'room' && !(typeof yardOn !== 'undefined' && yardOn) && sc.cast.every(d => here.has(d))){ $('#sheet').hidden = true; alOpen = false; skitPlay(sc, true); return; }
  const out = [], walk = (steps, pad) => steps.forEach(s => {
    if (typeof s !== 'string'){ out.push(`<p class="sk-q">${pad}（${s.q}）</p>`); s.o.forEach((o, i) => { out.push(`<p class="sk-o">${pad}▸ ${o[0]}${i === (skitData().s[sc.id] | 0) ? '（你上次選的）' : ''}</p>`); walk(o[1], pad + '　'); }); return; }
    const p = s.split(' ');
    if (p[0] === 's') out.push(`<p>${pad}<b>${DOLL_NAME[p[1]]}</b>：${p.slice(2).join(' ')}</p>`);
    else if (p[0] === 'n') out.push(`<p class="sk-n">${pad}${p.slice(1).join(' ')}</p>`);
  });
  walk(sc.steps, '');
  openSheet(`<div class="hd"><span>${sc.title}</span></div><div class="sk-box">${out.join('')}<p class="bk-note">${sc.cast.map(d => DOLL_NAME[d]).join('、')}都在同一間的時候按「重看」，牠們會再演一次。</p></div>
    <div class="ml-ft"><button class="btn" data-skback="${sc.cast[0]}">回相簿</button></div>`);
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-skit]'); if (b){ skitReplay(b.dataset.skit); return; }
  const k = e.target.closest('[data-skback]'); if (k && typeof openAlbum === 'function') openAlbum(k.dataset.skback);
});

/* ---------- 接到原本的東西 ---------- */
// 點頭上有「！」的娃娃：開始演
{
  const prev = onDollTap;
  onDollTap = function(it){
    if (skitOn) return;
    const sc = !VISIT && skitReady[it.id];
    if (sc){ skitPlay(sc, false); return; }
    prev(it);
  };
}
// 演的時候娃娃不亂晃
{ const prev = roamPaused; roamPaused = function(){ return !!skitOn || prev(); }; }
// 換房間：正在演的那一段收掉，新的房間重新看有沒有可以演的
{ const prev = load; load = function(){ skitAbort(); prev(); skitScan(); }; }
// 今天的小事做完一件：有關的娃娃在房間裡跳一下，上面顯示結果
{
  const prev = doEvent;
  doEvent = function(id){
    const r = prev(id);
    if (r === true && !VISIT && !skitOn){
      const e = typeof evById === 'function' && evById(id);
      const cast = e ? e.d.map(skitDoll).filter(Boolean) : [];
      if (cast.length && !REDUCE){
        cast.forEach(it => { try { roamIdle(it, 'jump'); } catch (err) {} });
        const b = skitBar('今天的小事'); skitCap(e.end); const skip = b.querySelector('[data-skip]'); if (skip) skip.remove();
        setTimeout(() => { if (!skitOn && b.isConnected) b.remove(); }, 4200);
      }
    }
    return r;
  };
}
// 夾到新娃娃：今天多排一段有牠的
{
  const prev = afterPrize;
  afterPrize = function(){
    prev();
    const a = skitData(), t = todayStr();
    if (a.d !== t || a.q.length >= 6) return;
    const add = SKITS.find(sc => !a.q.includes(sc.id) && !skitSeen(sc.id) && skitCan(sc, t) && sc.cast.some(d => DOLL_N[d] === 1 && S.album.met && S.album.met[d] === t));
    if (add){ a.q.push(add.id); save(); }
  };
}
skitPlan();
setTimeout(skitScan, 1500);
setInterval(() => { if (document.hidden) return; skitPlan(); if (!skitOn) skitScan(); }, 3000);

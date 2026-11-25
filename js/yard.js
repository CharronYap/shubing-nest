/* 門外小島：小窩門外一塊浮在雲上的小島，斜 45 度看下去，4×3 共 12 塊地。
   一開始 4 塊空地、5 塊石頭、3 塊草叢。地會這樣變：石頭／草叢 → 空地 → 翻好的土（挖到種子）→ 種下、澆水 → 草地、花圃、樹；空地也可以變池塘。
   不懲罰、不催人：沒有計時、不會枯萎、不會變回去，幾天沒來也一樣。自己動手一天 3 次，娃娃幫忙不算次數（每隻一天幫一次，睡著了不幫）。
   S.yard = {p:[{s:狀態, k:種類, t:'日期'}×12], seeds:{grass, flower, tree}, day:'今天', self:今天自己做了幾次, help:{娃娃:'日期'},
             stay:{娃娃:{p:第幾塊, from:原本的房間, t:'日期'}}, rec:{娃娃:['日期|一句']}, news:['醒來後要說的一句'] } */
const YARD_COLS = 4, YARD_ROWS = 3, YARD_SELF = 3;
const YARD_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 11.5L12 7l9.5 4.5L12 16z"/><path d="M2.5 11.5V13l9.5 4.5 9.5-4.5v-1.5L12 16z" opacity=".55"/><path d="M12 7V3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 3.4c1.6-.8 3.3-.4 4.4.6-1.5.8-3.1.7-4.4-.6z"/><path d="M5 19.4c1-1 2.6-1 3.4 0 .8-.8 2.2-.7 2.8.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const YARD_HAND = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10V4a1.5 1.5 0 0 1 3 0v6V5.5a1.5 1.5 0 0 1 3 0V11v-2a1.5 1.5 0 0 1 3 0v5c0 4-2.8 7-6.6 7h-.8c-2.3 0-4-1-5.3-2.9L4.6 14a1.5 1.5 0 0 1 2.4-1.8L8 13.4z"/></svg>';
// 三種種子：翻土挖到、拔草叢偶爾有，也會夾在信裡
const YARD_SEED = {
  grass:{name:'草的種子', svg:'<svg viewBox="0 0 40 40"><ellipse cx="20" cy="31" rx="13" ry="4" fill="#d8b48c"/><path d="M13 31c-1-6-4-10-7-12 5 1 8 5 9 9M20 31c0-8-1-14-3-18 4 3 6 10 5 18M27 31c1-6 4-10 7-12-5 1-8 5-9 9" fill="#8fd47a" stroke="#4f9a3c" stroke-width="2" stroke-linejoin="round"/></svg>'},
  flower:{name:'花的種子', svg:'<svg viewBox="0 0 40 40"><path d="M20 34V21" stroke="#4f9a3c" stroke-width="2.6" stroke-linecap="round"/><path d="M20 29c-4-1-7-3-8-6 4 0 7 2 8 6z" fill="#8fd47a" stroke="#4f9a3c" stroke-width="1.8" stroke-linejoin="round"/><g fill="#ffb3d3" stroke="#e0609d" stroke-width="1.8"><circle cx="20" cy="9" r="4.4"/><circle cx="26.5" cy="14" r="4.4"/><circle cx="24" cy="21" r="4.4"/><circle cx="16" cy="21" r="4.4"/><circle cx="13.5" cy="14" r="4.4"/></g><circle cx="20" cy="15.5" r="3.6" fill="#ffd75e" stroke="#d98e00" stroke-width="1.6"/></svg>'},
  tree:{name:'樹苗', svg:'<svg viewBox="0 0 40 40"><ellipse cx="20" cy="33" rx="11" ry="3.5" fill="#d8b48c"/><path d="M20 33V17" stroke="#a8714f" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="13" r="8" fill="#8fd47a" stroke="#4f9a3c" stroke-width="2.2"/><circle cx="13.5" cy="19" r="5" fill="#8fd47a" stroke="#4f9a3c" stroke-width="2.2"/><circle cx="26.5" cy="19" r="5" fill="#8fd47a" stroke="#4f9a3c" stroke-width="2.2"/></svg>'},
};
const YARD_SEED_W = {grass:.45, flower:.35, tree:.2};
// 種子當信的附件：附件代號是 seed-種類（js/mail.js）
const yardAtt = a => a && a.startsWith('seed-') ? YARD_SEED[a.slice(5)] : null;
const YARD_DECO = {lamp:'蘑菇燈', bench:'雲朵長椅', sign:'小木牌'};
const YARD_NAME = {rock:'石頭', bush:'草叢', empty:'空地', soil:'翻好的土', seed:'種好的地', sprout:'冒芽了', grass:'草地', flower:'花圃', tree:'樹', pond:'池塘', deco:'裝飾'};
const YARD_DESC = {
  rock:'一顆大石頭，擋在那裡。', bush:'長得亂七八糟的草叢。', empty:'空地。翻一翻會挖到種子。', soil:'翻好的土，可以種東西。',
  seed:'種好了，澆水就會冒芽。', sprout:'冒芽了，明天就長好。', grass:'軟軟的草地。', flower:'花開了。', tree:'一棵樹，下面有一塊陰影。',
  pond:'池塘裡有雲的倒影。',
};
const YARD_DECO_DESC = {lamp:'晚上會自己亮的蘑菇燈。', bench:'雲朵做的長椅，坐下去會陷一點。', sign:'小木牌，上面寫著「薯餅的小窩」。'};
// 娃娃在小島的事蹟：寫進相簿那隻的頁面
const YARD_PAGES = ['那是一個風很大的晚上。後面還沒想好。', '第一章：飛行員在屋頂上醒來。', '那是一個黑漆漆的晚上，突然……（被泥土蓋住了）', '這次的主角是一隻很有名的狗。'];
// 火腿的吐槽：看小島整到哪裡，說下一步
function yardHint(){
  const P = S.yard.p, has = s => P.some(p => p.s === s), own = d => DOLL_N[d];
  if (has('seed')) return '種下去不澆水，是在等下雨嗎？';
  if (has('soil') && yardSeedN()) return '土都翻好了，種子要留著當收藏喔？';
  if (has('empty') && !has('soil') && !has('seed')) return '空地放著也還是空地。翻土啊。';
  if (has('rock')) return own('dino') ? '石頭叫龍龍敲，牠很閒。' : '石頭不會自己走開。';
  if (has('grass') && !has('tree') && own('sloth')) return '讓薯餅在草地睡一晚。牠睡覺的時候比較有用。';
  if (has('flower') && own('nyanko')) return '花開了。貓咪老師說牠不想去，但牠想去。';
  if (has('bush')) return '草叢拔一拔，說不定有種子。';
  return '整理得差不多了。我宣布今天休息。';
}

/* ---------- 存檔 ---------- */
const YARD_START = ['rock','empty','bush','rock', 'empty','rock','empty','bush', 'bush','empty','rock','rock'];
function yardInit(){
  if (!S.yard) S.yard = {};
  const y = S.yard;
  if (!Array.isArray(y.p) || y.p.length !== YARD_COLS * YARD_ROWS) y.p = YARD_START.map(s => ({s}));
  y.seeds = Object.assign({grass:0, flower:0, tree:0}, y.seeds || {});
  y.help = y.help || {}; y.stay = y.stay || {}; y.rec = y.rec || {}; y.news = y.news || [];
  if (typeof y.self !== 'number') y.self = 0;
  return y;
}
const yardSeedN = () => Object.values(S.yard.seeds).reduce((a, b) => a + b, 0);
const yardHas = s => !s || (S.yard && S.yard.p.some(p => p.s === s));
function yardRec(d, line){
  const r = S.yard.rec[d] = S.yard.rec[d] || [];
  r.push(`${todayStr()}|${line}`);
  if (r.length > 12) r.splice(0, r.length - 12);
}
function yardPickSeed(){
  let r = Math.random();
  for (const [k, w] of Object.entries(YARD_SEED_W)){ r -= w; if (r <= 0) return k; }
  return 'grass';
}
// 過了一天：昨天澆過水的長大，在小島睡了一晚的娃娃做完牠的事、回房間
function yardTick(){
  const y = yardInit(), t = todayStr();
  if (y.day === t) return false;
  y.day = t; y.self = 0;
  y.p.forEach(p => { if (p.s === 'sprout' && p.t < t){ p.s = p.k; delete p.k; delete p.t; } });
  for (const [d, st] of Object.entries(y.stay)){
    if (st.t >= t) continue;
    const p = y.p[st.p];
    if (d === 'sloth' && p.s === 'grass'){ p.s = 'tree'; y.news.push('薯餅在草地睡了一晚，醒來旁邊多了一棵樹。'); yardRec(d, '在草地睡了一晚，長出一棵樹。'); }
    else if (d === 'egg' && (p.s === 'empty' || p.s === 'soil')){
      const have = new Set(y.p.filter(q => q.s === 'deco').map(q => q.k));
      const left = Object.keys(YARD_DECO).filter(k => !have.has(k));
      const k = (left.length ? left : Object.keys(YARD_DECO))[Math.floor(Math.random() * (left.length || 3))];
      p.s = 'deco'; p.k = k;
      y.news.push(`蛋黃哥在地上趴了一晚，孵出一個${YARD_DECO[k]}。`); yardRec(d, `趴了一晚，孵出一個${YARD_DECO[k]}。`);
    }
    yardBack(d, st.from);
  }
  save();
  return true;
}
// 從小島回房間：放回原本的房間，那間沒了就放客廳
function yardBack(d, from){
  delete S.yard.stay[d];
  const r = RIDS.includes(from) ? from : 'living', list = home[r].items;
  if (list.some(i => i.kind === 'doll' && i.id === d)) return;
  const cand = [[50,92],[34,94],[66,94],[20,90],[80,90],[50,80],[30,82],[70,82]];
  const c = cand.find(c => !list.some(o => !o.sit && Math.hypot(o.x - c[0], o.y - c[1]) < 9)) || cand[0];
  list.push({uid: uid++, kind:'doll', id:d, x:c[0], y:c[1], sit:null, seat:0});
  if (!yardOn && !VISIT && r === roomId) render();
}
// 收納架點在小島的娃娃：直接叫回來（js/room.js 會接著放進目前的房間）
function yardRecall(d){ delete S.yard.stay[d]; }

/* ---------- 畫小島 ---------- */
const TW = 64, TH = 32;
const yxy = i => { const c = i % YARD_COLS, r = Math.floor(i / YARD_COLS); return [(c - r) * TW / 2, (c + r) * TH / 2]; };
const dia = (x, y, s = 1) => `M${x} ${y - TH / 2 * s}L${x + TW / 2 * s} ${y}L${x} ${y + TH / 2 * s}L${x - TW / 2 * s} ${y}Z`;
const YARD_GROUND = {rock:'#ecdcc2', bush:'#c9e8ad', empty:'#f3dfbd', soil:'#b07b56', seed:'#b07b56', sprout:'#b07b56', grass:'#a6dc86', flower:'#a6dc86', tree:'#a6dc86', pond:'#a6dc86', deco:'#bfe6a0'};
function yardObj(p, x, y){
  switch (p.s){
    case 'rock': return `<ellipse cx="${x - 4}" cy="${y - 5}" rx="14" ry="10" fill="#d4ccdc" stroke="#9e93a8" stroke-width="2"/><ellipse cx="${x + 9}" cy="${y - 1}" rx="8" ry="6" fill="#d4ccdc" stroke="#9e93a8" stroke-width="2"/><path d="M${x - 11} ${y - 9}q4-4 9-3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'bush': return `<g fill="#86cf6e" stroke="#4f9a3c" stroke-width="2"><circle cx="${x - 9}" cy="${y - 4}" r="8"/><circle cx="${x + 9}" cy="${y - 4}" r="8"/><circle cx="${x}" cy="${y - 11}" r="9"/></g><path d="M${x - 14} ${y - 15}l-2-6M${x + 13} ${y - 14}l3-6M${x + 2} ${y - 21}l1-6" stroke="#4f9a3c" stroke-width="2" stroke-linecap="round"/>`;
    case 'soil': return `<path d="M${x - 16} ${y - 2}l12 6M${x - 6} ${y - 7}l12 6M${x + 4} ${y - 11}l12 6" stroke="#8a5a3a" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'seed': return `<g fill="#6e4328"><circle cx="${x - 10}" cy="${y}" r="2.2"/><circle cx="${x}" cy="${y - 4}" r="2.2"/><circle cx="${x + 10}" cy="${y}" r="2.2"/><circle cx="${x}" cy="${y + 5}" r="2.2"/></g>`;
    case 'sprout': return [[-10, 0], [0, -4], [10, 0], [0, 5]].map(([dx, dy]) => `<path d="M${x + dx} ${y + dy}v-6" stroke="#4f9a3c" stroke-width="2" stroke-linecap="round"/><path d="M${x + dx} ${y + dy - 5}c-4-1-5-4-5-5 3 0 5 2 5 5zM${x + dx} ${y + dy - 5}c4-1 5-4 5-5-3 0-5 2-5 5z" fill="#8fd47a" stroke="#4f9a3c" stroke-width="1.2"/>`).join('');
    case 'grass': return `<path d="M${x - 14} ${y + 1}l-1-5m3 5l1-5M${x + 6} ${y - 6}l-1-5m3 5l1-5M${x + 2} ${y + 7}l-1-5m3 5l1-5M${x - 4} ${y - 9}l-1-4m3 4l1-4" stroke="#5bae47" stroke-width="1.8" stroke-linecap="round"/>`;
    case 'flower': return [[-13, 0, '#ffb3d3'], [-2, -7, '#ffd75e'], [9, -2, '#ffb3d3'], [1, 6, '#c9b6ff'], [14, 3, '#ffd75e']].map(([dx, dy, c]) => `<path d="M${x + dx} ${y + dy}v-6" stroke="#4f9a3c" stroke-width="1.8"/><circle cx="${x + dx}" cy="${y + dy - 7}" r="3.6" fill="${c}" stroke="#fff" stroke-width="1.4"/>`).join('');
    case 'tree': return `<ellipse cx="${x + 6}" cy="${y + 3}" rx="16" ry="6" fill="#000" opacity=".1"/><path d="M${x} ${y + 2}v-24" stroke="#a8714f" stroke-width="6" stroke-linecap="round"/><g fill="#86cf6e" stroke="#4f9a3c" stroke-width="2.2"><circle cx="${x - 11}" cy="${y - 26}" r="11"/><circle cx="${x + 11}" cy="${y - 26}" r="11"/><circle cx="${x}" cy="${y - 37}" r="13"/></g><g fill="#ffb3d3"><circle cx="${x - 9}" cy="${y - 30}" r="2.4"/><circle cx="${x + 5}" cy="${y - 41}" r="2.4"/><circle cx="${x + 13}" cy="${y - 27}" r="2.4"/></g>`;
    case 'pond': return `<ellipse cx="${x}" cy="${y}" rx="22" ry="10" fill="#9ad8f5" stroke="#fff" stroke-width="2.4"/><path d="M${x - 10} ${y - 2}q5-3 10 0M${x + 3} ${y + 3}q4-2 8 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    case 'deco':
      if (p.k === 'lamp') return `<ellipse class="yd-glow" cx="${x}" cy="${y - 14}" rx="18" ry="14" fill="#fff3b8"/><rect x="${x - 3.5}" y="${y - 14}" width="7" height="15" rx="3" fill="#fffdf6" stroke="#c9b6a8" stroke-width="1.8"/><path d="M${x - 13} ${y - 13}a13 11 0 0 1 26 0z" fill="#ff8fbf" stroke="#d9649c" stroke-width="2"/><g fill="#fff"><circle cx="${x - 5}" cy="${y - 18}" r="2.2"/><circle cx="${x + 5}" cy="${y - 20}" r="1.8"/><circle cx="${x + 8}" cy="${y - 15}" r="1.4"/></g>`;
      if (p.k === 'bench') return `<path d="M${x - 12} ${y}v5M${x + 12} ${y}v5" stroke="#c9b6a8" stroke-width="2.4" stroke-linecap="round"/><path d="M${x - 18} ${y}c-4 0-6-4-3-7-2-5 4-8 7-5 2-4 8-4 10 0 3-3 9-2 9 2 3-3 8 0 7 4 3 2 1 6-3 6z" fill="#fff" stroke="#c7d9ee" stroke-width="2" stroke-linejoin="round"/>`;
      return `<path d="M${x} ${y + 2}v-18" stroke="#a8714f" stroke-width="3" stroke-linecap="round"/><rect x="${x - 13}" y="${y - 25}" width="26" height="12" rx="3" fill="#e2b98e" stroke="#a8714f" stroke-width="2"/><path d="M${x - 8} ${y - 19}h16" stroke="#a8714f" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  return '';
}
// 朋友來澆過水留下的小牌子（js/water.js）
const yardSign = (x, y) => `<g class="yd-ws"><path d="M${x + 15} ${y + 4}v-13" stroke="#a8714f" stroke-width="2.4" stroke-linecap="round"/><rect x="${x + 7}" y="${y - 19}" width="16" height="11" rx="2.5" fill="#fff" stroke="#4a9fd0" stroke-width="1.8"/><path d="M${x + 15} ${y - 17}c-2 2.6-3 3.8-3 5a3 3 0 0 0 6 0c0-1.2-1-2.4-3-5z" fill="#6cc0ee"/></g>`;
let yardOn = false, ySel = -1, yBusy = null;
// y：畫哪一座島。自己的是 S.yard；去朋友家時是朋友公開的那份（js/water.js）
function yardSVG(y = S.yard){
  const order = y.p.map((p, i) => i).sort((a, b) => { const sa = a % YARD_COLS + Math.floor(a / YARD_COLS), sb = b % YARD_COLS + Math.floor(b / YARD_COLS); return sa - sb || a - b; });
  const stayAt = {};
  for (const [d, st] of Object.entries(y.stay || {})) stayAt[st.p] = d;
  const tiles = order.map(i => {
    const p = y.p[i], [x, yy] = yxy(i), sel = i === ySel;
    const doll = stayAt[i] ? `<image class="yd-sl" href="${SPR[stayAt[i]]}" x="${x - 17}" y="${yy - 36}" width="34" height="38"/><text class="yd-z" x="${x + 14}" y="${yy - 32}">z</text>` : '';
    const act = yBusy && yBusy.i === i ? (yBusy.d === 'me' ? `<g class="yd-me"><path d="${dia(x, yy, .6)}" fill="#fff" opacity=".7"/></g>` : `<image class="yd-hop" href="${SPR[yBusy.d]}" x="${x - 17}" y="${yy - 38}" width="34" height="38"/>`) : '';
    const label = `${p.s === 'deco' ? YARD_DECO[p.k] : YARD_NAME[p.s]}${stayAt[i] ? `，${DOLL_NAME[stayAt[i]]}在這裡睡` : ''}`;
    return `<g class="yd-p ${sel ? 'on' : ''}" data-p="${i}" role="button" tabindex="0" aria-label="${label}" aria-pressed="${sel}">
      <path class="yd-t" d="${dia(x, yy, .94)}" fill="${YARD_GROUND[p.s]}"/>${yardObj(p, x, yy)}${(y.ws || []).some(w => w.p === i) ? yardSign(x, yy) : ''}${doll}${act}</g>`;
  }).join('');
  return `<svg class="yd-svg" viewBox="-108 -72 244 222" aria-label="門外小島">
    <g class="yd-cl" fill="#fff"><circle cx="-70" cy="112" r="20"/><circle cx="-44" cy="124" r="22"/><circle cx="-10" cy="130" r="20"/><circle cx="26" cy="128" r="24"/><circle cx="62" cy="122" r="20"/><circle cx="96" cy="108" r="18"/><circle cx="118" cy="92" r="14"/><circle cx="-92" cy="92" r="14"/></g>
    <path d="M-96 32L32 96V120L-96 56Z" fill="#d6a37c"/><path d="M32 96L128 48V72L32 120Z" fill="#bd8a64"/>
    <path d="M-96 44L32 108M32 108L128 60" stroke="#c49269" stroke-width="2" fill="none" opacity=".6"/>
    <path d="M0 -16L128 48L32 96L-96 32Z" fill="#bfe6a0" stroke="#9fd17f" stroke-width="2"/>
    ${tiles}</svg>`;
}

/* ---------- 下面的面板：選到的地能做什麼 ---------- */
// 每一塊地，自己和娃娃各能做什麼。do 回傳一句結果
function yardActs(i){
  const y = S.yard, p = y.p[i], t = todayStr(), acts = [];
  const me = (label, fn) => acts.push({who:'me', label, fn});
  const doll = (d, label, fn, night) => { if (DOLL_N[d]) acts.push({who:d, label, fn, night}); };
  const turnSoil = d => () => {
    const k = yardPickSeed(); p.s = 'soil'; y.seeds[k]++;
    let extra = '';
    if (d === 'dog' && Math.random() < .2){ extra = '，還挖到一隻拖鞋'; yardRec('dog', '翻土的時候挖到一隻拖鞋，不知道是誰的。'); }
    if (d === 'snoopy' && Math.random() < .2){ const pg = YARD_PAGES[Math.floor(Math.random() * YARD_PAGES.length)]; extra = '，還挖到小說的第一頁'; yardRec('snoopy', `挖到小說的第一頁：「${pg}」`); }
    return `翻好了，挖到一顆${YARD_SEED[k].name}${extra}。`;
  };
  if (p.s === 'rock'){
    me('搬開石頭', () => { p.s = 'empty'; return '石頭搬開了，多了一塊空地。'; });
    doll('dino', '敲石頭', () => {
      p.s = 'empty';
      if (Math.random() < .4){ S.coins++; $('#coins').textContent = S.coins; yardRec('dino', '敲石頭敲出一顆小石子，換了 1 枚幣。'); return '龍龍把石頭敲碎了，還敲出一顆小石子，換 1 枚幣。'; }
      return '龍龍把石頭敲碎了。';
    });
  } else if (p.s === 'bush'){
    me('拔草', () => { p.s = 'empty'; if (Math.random() < .5){ y.seeds.grass++; return '拔乾淨了，草叢裡有一顆草的種子。'; } return '拔乾淨了。'; });
  } else if (p.s === 'empty'){
    me('翻土', turnSoil('me'));
    doll('dog', '翻土', turnSoil('dog'));
    doll('snoopy', '翻土', turnSoil('snoopy'));
    doll('moodeng', '噴水', () => { p.s = 'pond'; yardRec('moodeng', '在空地噴了一大堆水，變成池塘。'); return '彈跳豬噴了一大堆水，空地變成池塘了。'; });
  } else if (p.s === 'seed'){
    me('澆水', () => { p.s = 'sprout'; p.t = t; return '澆好水，冒芽了。明天就長好。'; });
    doll('moodeng', '澆一整排', () => {
      const r = Math.floor(i / YARD_COLS); let n = 0;
      for (let c = 0; c < YARD_COLS; c++){ const q = y.p[r * YARD_COLS + c]; if (q.s === 'seed'){ q.s = 'sprout'; q.t = t; n++; } }
      return n > 1 ? `彈跳豬一口氣澆了一整排，${n} 塊都冒芽了。` : '彈跳豬澆好水，冒芽了。';
    });
  } else if (p.s === 'flower'){
    doll('nyanko', '坐在旁邊', () => {
      const g = Math.random() < .5 ? ['蝴蝶', '牠說是蝴蝶自己要來的。'] : ['小鳥', '貓咪老師假裝沒看到。'];
      yardRec('nyanko', `坐在花圃旁邊，招來一隻${g[0]}。`);
      return `貓咪老師坐在花圃旁邊，招來一隻${g[0]}。${g[1]}`;
    });
  }
  // 過一晚：薯餅睡草地、蛋黃哥趴在整好的地上。不算幫忙的次數
  if (p.s === 'grass') doll('sloth', '在這裡睡一晚', null, true);
  if (p.s === 'empty' || p.s === 'soil') doll('egg', '在這裡趴一晚', null, true);
  return acts;
}
function yardPanel(){
  const y = S.yard, left = YARD_SELF - y.self;
  const seeds = Object.entries(YARD_SEED).map(([k, s]) => `<span class="yd-sd" aria-label="${s.name} ${y.seeds[k]} 顆">${s.svg}<b>${y.seeds[k]}</b></span>`).join('');
  const dots = Array.from({length: YARD_SELF}, (_, j) => `<i class="${j < left ? 'on' : ''}"></i>`).join('');
  let body = '';
  if (y.news.length) body = `<div class="yd-news">${y.news.map(n => `<p>${n}</p>`).join('')}<button class="btn sm" data-yok>好</button></div>`;
  else if (ySel < 0) body = `<p class="yd-hi">點一塊地看看能做什麼。</p>`;
  else {
    const p = y.p[ySel], t = todayStr(), stayHere = Object.keys(y.stay).find(d => y.stay[d].p === ySel);
    const name = p.s === 'deco' ? YARD_DECO[p.k] : YARD_NAME[p.s];
    const desc = p.s === 'deco' ? YARD_DECO_DESC[p.k] : YARD_DESC[p.s];
    let btns = '';
    if (stayHere) btns += `<p class="yd-nt">${DOLL_NAME[stayHere]}在這裡睡，明天早上就知道了。</p><button class="yd-a" data-yback="${stayHere}"><img src="${SPR[stayHere]}" alt=""><span>叫牠回房間</span></button>`;
    else yardActs(ySel).forEach((a, j) => {
      let off = '', why = '';
      if (a.who === 'me'){ if (left <= 0){ off = 'off'; why = '今天先這樣'; } }
      else if (a.night){ if (y.stay[a.who]){ off = 'off'; why = '在別塊地睡'; } }
      else if (y.help[a.who] === t){ off = 'off'; why = '今天幫過了'; }
      else if (whereDoll(a.who) === 'out'){ off = 'off'; why = '去朋友家了'; }
      else if (typeof asleep === 'function' && asleep(a.who)){ off = 'off'; why = '睡著了'; }
      const face = a.who === 'me' ? `<span class="yd-hand">${YARD_HAND}</span>` : `<img src="${SPR[a.who]}" alt="">`;
      btns += `<button class="yd-a ${off}" data-ya="${j}" aria-label="${a.who === 'me' ? '自己' : DOLL_NAME[a.who]}${a.label}${why ? '，' + why : ''}" ${off ? 'aria-disabled="true"' : ''}>${face}<span>${a.label}</span>${why ? `<small>${why}</small>` : ''}</button>`;
    });
    if (p.s === 'soil' && !stayHere){
      btns += Object.entries(YARD_SEED).map(([k, s]) => `<button class="yd-a ${y.seeds[k] ? '' : 'off'}" data-yplant="${k}" aria-label="種${s.name}，還有 ${y.seeds[k]} 顆">${s.svg}<span>種${k === 'tree' ? '樹苗' : s.name.replace('的種子', '')}</span><small>×${y.seeds[k]}</small></button>`).join('');
    }
    body = `<div class="yd-hd"><b>${name}</b><small>${desc}</small></div>${typeof waterSignNote === 'function' ? waterSignNote(ySel) : ''}${btns ? `<div class="yd-acts">${btns}</div>` : ''}`;
  }
  const piggy = DOLL_N.piggy ? `<div class="yd-pg"><img src="${SPR.piggy}" alt=""><p>${yardHint()}</p></div>` : '';
  return `<div class="yd-top"><span class="yd-sds">${seeds}</span><span class="yd-self" aria-label="今天自己還能做 ${Math.max(0, left)} 次">${YARD_HAND}<span class="dots">${dots}</span></span></div>${body}${piggy}`;
}
function yardPaint(){
  if (!yardOn) return;
  if (VISIT){ if (typeof waterPaint === 'function') waterPaint(); return; }   // 朋友的小島
  const el = $('#yard');
  el.classList.toggle('night', isNight());
  $('#ydMap').innerHTML = yardSVG();
  $('#ydPanel').innerHTML = yardPanel();
}

/* ---------- 打開、關上 ---------- */
function yardOpen(){
  if (VISIT){ if (typeof waterOpen === 'function') waterOpen(); return; }
  yardTick(); yardOn = true; ySel = -1;
  $('#yard').hidden = false; screen.classList.add('inyard');
  $('#sheet').hidden = true;
  yardPaint(); renderNav();
  if (!REDUCE) $('#yard').animate([{opacity:0, transform:'translateY(12px)'}, {opacity:1, transform:'none'}], {duration:240, easing:'ease-out'});
}
function yardClose(){
  if (!yardOn) return;
  yardOn = false; yBusy = null;
  $('#yard').hidden = true; screen.classList.remove('inyard');
  // 在小島上可能有娃娃去睡、被叫回來，房間和收納架重畫一次
  if (!VISIT) render();
}
function yardDo(i, a){
  const y = S.yard, t = todayStr();
  yBusy = {i, d: a.who};
  yardPaint();
  setTimeout(() => {
    yBusy = null;
    const msg = a.fn();
    if (a.who === 'me') y.self++; else y.help[a.who] = t;
    save(); yardPaint(); toast(msg);
  }, REDUCE ? 0 : 900);
}
$('#yard').addEventListener('click', e => {
  if (VISIT){ if (typeof waterClick === 'function') waterClick(e); return; }
  if (typeof waterSignClick === 'function' && waterSignClick(e)) return;
  if (yBusy) return;
  const y = S.yard;
  const g = e.target.closest('.yd-p');
  if (g){ const i = +g.dataset.p; ySel = ySel === i ? -1 : i; yardPaint(); return; }
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.yok !== undefined){ y.news = []; save(); yardPaint(); return; }
  if (b.dataset.yback){ const d = b.dataset.yback; yardBack(d, y.stay[d].from); save(); yardPaint(); toast(`${DOLL_NAME[d]}回房間了`); return; }
  if (b.dataset.yplant){
    const k = b.dataset.yplant, p = y.p[ySel];
    if (!y.seeds[k]){ toast('翻土的時候會挖到'); return; }
    y.seeds[k]--; p.s = 'seed'; p.k = k; save(); yardPaint(); toast(`種下${YARD_SEED[k].name.replace('的種子', '')}了，記得澆水`);
    return;
  }
  if (b.dataset.ya !== undefined){
    const a = yardActs(ySel)[+b.dataset.ya]; if (!a) return;
    const small = b.querySelector('small');
    if (b.classList.contains('off')){ if (small) toast(a.who === 'me' ? '今天先這樣，娃娃們還可以幫忙' : `${DOLL_NAME[a.who]}${small.textContent}`); return; }
    if (a.night){
      // 從房間搬到小島，明天早上回原本的房間
      const w = whereDoll(a.who), from = RIDS.includes(w) ? w : null;
      if (from){ const o = home[from].items.find(i => i.kind === 'doll' && i.id === a.who); home[from].items.splice(home[from].items.indexOf(o), 1); }
      y.stay[a.who] = {p: ySel, from: from || 'living', t: todayStr()};
      save(); yardPaint(); toast(a.who === 'sloth' ? '薯餅躺下來了。明天早上看看。' : '蛋黃哥趴下來了。明天早上看看。');
      return;
    }
    yardDo(ySel, a);
  }
});
$('#yard').addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.yd-p')){ e.preventDefault(); e.target.closest('.yd-p').click(); }
});

/* ---------- 相簿：在小島做過的事 ---------- */
function yardRows(d){
  const r = (S.yard && S.yard.rec[d]) || [];
  if (!r.length) return '';
  return `<div class="al-sec">在小島</div><ul class="al-ln al-yd">${r.slice().reverse().map(x => { const [t, l] = x.split('|'); return `<li>${l}<small>${md(t)}</small></li>`; }).join('')}</ul>`;
}

yardInit();
yardTick();
setInterval(() => { if (VISIT) return; if (S.yard.day !== todayStr()){ yardTick(); yardPaint(); } else if (yardOn) $('#yard').classList.toggle('night', isNight()); }, 60000);

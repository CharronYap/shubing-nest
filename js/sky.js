/* 天色和天氣（2026-11-27）：不用存檔、不用連網路。
   - 天色四段：清晨 5–7 點（窗外偏粉橘）、白天、傍晚 17–19 點（偏橘紅）、晚上。開著燈的房間光線也跟著帶一點顏色。
   - 天氣照日期算出來，同一天每個人看到的一樣：晴天五成、多雲三成、下雨兩成。下雨隔天早上（7–11 點）有機會出現彩虹。
   - 下雨天：娃娃有對應的小事（多排一件）和說的話；小島那天不用澆水，種好的地自己冒芽。
   - 窗外的季節景色（js/season.js 的 winSeason）照樣疊在上面。
   不懲罰、不催人：下雨只是多一點事可以看，沒有任何東西會因為天氣變壞。 */
const SKY_NAME = {sun: '晴天', cloud: '多雲', rain: '下雨'};
function skyPhase(){
  if (VISIT && typeof VISIT.night === 'boolean') return VISIT.night ? 'night' : 'day';   // 看明信片
  const h = new Date().getHours();
  return h >= 19 || h < 5 ? 'night' : h < 7 ? 'dawn' : h >= 17 ? 'dusk' : 'day';
}
const skyHash = s => { let h = 2166136261; for (const c of s){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function skyWeather(t = todayStr()){ const r = skyHash('sky' + t) % 100; return r < 50 ? 'sun' : r < 80 ? 'cloud' : 'rain'; }
function skyRainbow(){
  const d = new Date(), y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1), p = n => String(n).padStart(2, '0');
  const ys = `${y.getFullYear()}-${p(y.getMonth() + 1)}-${p(y.getDate())}`;
  return skyWeather(ys) === 'rain' && skyWeather() !== 'rain' && d.getHours() >= 7 && d.getHours() < 11 && skyHash('bow' + todayStr()) % 100 < 60;
}
const skyKey = () => skyPhase() + skyWeather() + (skyRainbow() ? 'b' : '');

/* 窗戶裡面：room.js 的 winSVG 會叫。回傳 {bg, inner} */
function skyWin(){
  const ph = skyPhase(), w = VISIT && VISIT.card ? 'sun' : skyWeather(), rain = w === 'rain';
  const cloud = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M4 12c-5 0-6-7-1-8 1-6 9-7 12-3 5-2 11 2 10 7 4 1 3 6-1 6z" fill="${c}"/>`;
  const drops = '<g class="wrain" stroke="#eaf6ff" stroke-width="1.4" stroke-linecap="round" opacity=".85">' + [[14, 14], [24, 26], [34, 12], [44, 30], [54, 16], [64, 28], [19, 40], [39, 44], [59, 42], [29, 20], [49, 8], [66, 12]].map(([x, y]) => `<path d="M${x} ${y}l-2 6"/>`).join('') + '</g>';
  let bg, inner = '';
  if (ph === 'night'){
    bg = rain ? '#262b5e' : '#2f3478';
    if (w === 'sun') inner = '<circle cx="54" cy="22" r="8" fill="#fff3b0"/><circle cx="58" cy="19" r="7" fill="#2f3478"/><g fill="#fff"><circle cx="20" cy="18" r="1.3"/><circle cx="32" cy="30" r="1"/><circle cx="24" cy="40" r="1.2"/><circle cx="46" cy="42" r="1"/></g>';
    else if (w === 'cloud') inner = '<circle cx="54" cy="22" r="8" fill="#fff3b0"/><circle cx="58" cy="19" r="7" fill="#2f3478"/><circle cx="20" cy="18" r="1.3" fill="#fff"/>' + cloud(38, 22, 1.1, '#5c62a6') + cloud(12, 34, .9, '#4b5196');
    else inner = cloud(12, 10, 1.2, '#4b5196') + cloud(40, 14, 1.1, '#5c62a6') + drops;
  } else {
    const dawn = ph === 'dawn', dusk = ph === 'dusk';
    const top = rain ? (dawn || dusk ? '#b9a6b4' : '#9fb6c9') : dawn ? '#ffb7a6' : dusk ? '#ff9466' : w === 'cloud' ? '#c9e2f2' : '#aee0ff';
    const bot = rain ? (dawn || dusk ? '#d9c6c4' : '#c3d3de') : dawn ? '#ffe7c4' : dusk ? '#ffd08a' : w === 'cloud' ? '#e3f1f9' : '#d3f0ff';
    inner = `<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs><rect x="9" y="9" width="62" height="44" rx="9" fill="url(#skyg)"/>`;
    bg = top;
    if (!rain){
      if (dawn) inner += '<circle cx="24" cy="52" r="10" fill="#fff0b8"/><circle cx="24" cy="52" r="14" fill="#fff0b8" opacity=".35"/>';
      else if (dusk) inner += '<circle cx="56" cy="50" r="10" fill="#ff6f4a"/><circle cx="56" cy="50" r="15" fill="#ff8f5a" opacity=".35"/>';
      else if (w === 'sun') inner += '<circle cx="58" cy="20" r="6" fill="#ffd75e"/>';
      const cc = dawn ? '#fff1e6' : dusk ? '#ffe0c2' : '#fff';
      inner += w === 'cloud' ? cloud(10, 12, 1.2, cc) + cloud(40, 20, 1.1, cc) + cloud(22, 34, .9, cc) : cloud(12, 28, 1, cc);
      if (skyRainbow()) inner += '<g fill="none" stroke-width="2.6" opacity=".85"><path d="M14 54a26 26 0 0 1 52 0" stroke="#ff8fa8"/><path d="M17 54a23 23 0 0 1 46 0" stroke="#ffd66b"/><path d="M20 54a20 20 0 0 1 40 0" stroke="#9be08a"/><path d="M23 54a17 17 0 0 1 34 0" stroke="#8fd3ef"/></g>';
    } else inner += cloud(8, 8, 1.3, '#8497a8') + cloud(38, 12, 1.2, '#93a5b5') + drops;
  }
  return {bg, inner};
}
// 房間的光線：screen 加 dawn / dusk / rainy（顏色在 css）
function skyPaint(){
  const ph = skyPhase(), rain = !(VISIT && VISIT.card) && skyWeather() === 'rain';
  screen.classList.toggle('dawn', ph === 'dawn'); screen.classList.toggle('dusk', ph === 'dusk');
  screen.classList.toggle('rainy', rain && ph !== 'night');
  screen.dataset.sky = skyKey();
}

/* 下雨天的小事和說的話。when:'rain' 的小事只在下雨天排進來（main.js 的 planDay），相簿裡做過才算 */
EVENTS.push(
  {id:'rain-dog', d:['dog'], when:'rain', t:'皮蛋趴在窗邊看雨，鼻子在玻璃上印了一個圓。', end:'陪牠看了一會兒。皮蛋說雨的味道很好聞。'},
  {id:'rain-moodeng', d:['moodeng'], when:'rain', t:'彈跳豬想出去踩水！！在門口跳了十幾下！！', end:'在浴室放了一盆水給牠踩，牠說這樣也可以！！'},
  {id:'rain-sloth', d:['sloth'], when:'rain', t:'薯餅聽著雨聲發呆，眼睛快閉起來了。', end:'幫牠蓋了一條小毯子，牠聽著雨睡著了。'},
  {id:'rain-nyanko', d:['nyanko'], when:'rain', need:'snack', t:'貓咪老師說下雨天不想動，要有人把點心拿到牠面前。', end:'點心送到了。貓咪老師說下雨天就是要這樣。'},
);
const SKY_LINES = {dog:'外面在下雨耶。', moodeng:'下雨了！！可以踩水嗎！！', sloth:'雨聲……好好睡……', egg:'下雨天最適合不動了。', nyanko:'下雨就不用出門，很好。', dino:'雨停了我要去踩水坑。', snoopy:'那是一個下著雨的晚上。', piggy:'天氣預報我早就說過了。'};
function skyEvents(t){
  if (skyWeather(t) !== 'rain') return [];
  const pool = EVENTS.filter(e => e.when === 'rain' && e.d.every(d => DOLL_N[d]));
  return pool.length ? [pool[skyHash('ev' + t) % pool.length]] : [];
}
const skyLine = d => (skyWeather() === 'rain' && Math.random() < .35 ? SKY_LINES[d] : '');
// 下雨天小島不用澆水：種好的地自己冒芽
function skyRainWater(){
  if (VISIT || skyWeather() !== 'rain' || !S.yard || !Array.isArray(S.yard.p)) return;
  const t = todayStr(); let n = 0;
  S.yard.p.forEach(p => { if (p.s === 'seed'){ p.s = 'sprout'; p.t = t; n++; } });
  if (n){ if (S.yard.day) (S.yard.news = S.yard.news || []).push('下雨了，種好的地都喝到水，冒芽了。'); save(); if (typeof yardPaint === 'function') yardPaint(); }
}

/* 娃娃的信交給 AI 寫（第一階段）。在 mail.js 前面載入。
 *
 * 平常的信用 mail.js 的範本（MAIL_TPL）。這裡多一條路：登入雲端帳號的人，輪到娃娃寫信時先問 Cloudflare Worker
 * （worker/ 資料夾，裡面請 Claude 用那隻娃娃的口氣寫），拿到就用 AI 寫的，拿不到就照舊用範本。
 * 沒登入、沒網路、Worker 壞掉、今天的名額用完、等太久，全部都退回範本，玩的人不會看到錯誤。
 *
 * - 只有 intro、cards、anniv、miss 四種信會問 AI。朋友送娃娃、過夜日記、小窩更新照原本的寫法。
 * - 送出去的只有：哪隻娃娃、哪種信、數字（幾件事、幾年、幾天沒來）、家具名稱、家裡有哪幾隻、
 *   遊戲裡寫好的小事句子、牠上一封 AI 信。不送帳號名字，也不送任何人自己打的字。
 * - AI 寫的字存在信的 key 後面（;ai=字），顯示前先把 & < > 換掉（mail.js 的 mailText）。
 * - 怎麼開、怎麼關、花多少：docs/AI-LETTERS.md
 */
const MAIL_AI_URL = '';   // Worker 的網址，例如 'https://shubing-nest-letters.你的名字.workers.dev'。空的 = 關掉，全部用範本
const MAIL_AI_TYPES = ['intro', 'cards', 'anniv', 'miss'];
const MAIL_AI_LOGIN_WAIT = 15000;   // 剛打開時雲端帳號還在載入，最多等這麼久
const MAIL_AI_WAIT = 20000;         // 等 Worker 回信最多這麼久
let mailAiBusy = false;             // 正在等 AI 寫（mail.js 的 mailCheck 看到就先不挑下一封）

// 這封信要不要問 AI：有設網址、這台用的是雲端帳號的存檔、有網路
const mailAiOn = type => !!MAIL_AI_URL && MAIL_AI_TYPES.includes(type) && !!acctUid() && navigator.onLine !== false;

// 存進 key 的寫法：只換掉 key 裡有特別意思的符號和換行，中文字照原樣放（比 encodeURIComponent 省很多空間）。讀的時候用 mailDec
const mailAiEnc = s => s.replace(/[%;=#|\n]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
// Worker 回來的字再檢查一次：太長、太多行、空的都不要
function mailAiClean(s){
  if (typeof s !== 'string') return '';
  const lines = s.replace(/[<>&]/g, '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  const text = lines.join('\n');
  return lines.length && lines.length <= 6 && text.length <= 200 ? text : '';
}
// 等雲端帳號登入好（account.js 登入、同步完會發 nestnet）
function mailAiLogin(){
  const ok = () => !!(window.nestNet && nestNet.me && nestNet.me.uid === acctUid() && nestNet.idToken);
  return new Promise(res => {
    if (ok()) return res(true);
    const done = () => { removeEventListener('nestnet', done); clearTimeout(t); res(ok()); };
    const t = setTimeout(done, MAIL_AI_LOGIN_WAIT);
    addEventListener('nestnet', done);
  });
}
// 給 Worker 的資料。q 是信的參數（'n=10'、'y=1'、'r=living;f=sofa'）
function mailAiCtx(d, type, q){
  const p = {};
  (q || '').split(';').filter(Boolean).forEach(x => { const [a, b] = x.split('='); p[a] = b; });
  const cards = S.album.cards || {}, met = S.album.met || {};
  const done = EVENTS.filter(e => e.d.includes(d) && cards[e.id]).sort((a, b) => cards[a.id] < cards[b.id] ? 1 : -1).slice(0, 2).map(e => e.end);
  const last = ((S.mail && S.mail.arch[d]) || []).map(s => mailParse(s.slice(11)).p.ai).filter(Boolean).pop();
  return {
    doll: d, type, n: +p.n || 0, y: +p.y || 0,
    days: type === 'miss' && LAST_T ? Math.min(60, Math.floor((Date.now() - LAST_T) / 864e5)) : 0,
    room: MAIL_ROOM[p.r] || '', furn: MAIL_FURN[p.f] || '',
    date: todayStr(), hour: new Date().getHours(),
    pals: DOLLS.filter(x => x !== d && DOLL_N[x] && met[x]),
    done, prev: last ? mailDec(last).replace(/\n/g, ' ').slice(0, 80) : '',
  };
}
// 問 AI 要一封信。一定會有結果：拿到回信的字，拿不到回空字串（mail.js 就用範本）
function mailAiAsk(d, type, q){
  mailAiBusy = true;
  return (async () => {
    if (!await mailAiLogin()) return '';
    const token = await nestNet.idToken();
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), MAIL_AI_WAIT);
    try {
      const r = await fetch(MAIL_AI_URL, {
        method: 'POST', headers: {'content-type': 'application/json', authorization: 'Bearer ' + token},
        body: JSON.stringify(mailAiCtx(d, type, q)), signal: ctl.signal,
      });
      if (!r.ok) return '';
      return mailAiClean((await r.json()).text);
    } finally { clearTimeout(tm); }
  })().catch(() => '').finally(() => { mailAiBusy = false; });
}

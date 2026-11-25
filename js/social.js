/* 第五版共用：朋友之間的玩法（訪客簿、願望清單、幫忙澆水、過夜、明信片、送娃娃自己寫的話）都會用到的小工具。
   放在最前面載入（data.js 後面），後面的檔案才用得到。

   自由打字的規矩（企劃「自由打字的規矩」）：
   - 別人打的字、別人取的名字，一律用 textContent 放進畫面，不能接進 innerHTML。
     做法：txSlot(字) 回傳一個空的 <span data-tx>，可以放心接進 innerHTML；字另外記著，畫面一有變動就用 textContent 填進去。
   - 字數上限在這裡先切一次（sText），firestore.rules 也擋一次。 */
const TX = new Map();
let txN = 0;
function txSlot(s, cls){
  const k = 't' + (++txN);
  TX.set(k, String(s ?? ''));
  if (TX.size > 600) TX.delete(TX.keys().next().value);
  return `<span class="tx${cls ? ' ' + cls : ''}" data-tx="${k}"></span>`;
}
function txFill(root){
  (root || document).querySelectorAll('[data-tx]').forEach(el => {
    const s = TX.get(el.dataset.tx);
    if (s !== undefined && el.textContent !== s) el.textContent = s;
  });
}
new MutationObserver(() => txFill()).observe(document.documentElement, {childList: true, subtree: true});

// 打的字：拿掉換行和控制字元、頭尾空白，切到 n 個字以內
function sText(s, n){
  const a = Array.from(String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim());
  while (a.length > n || a.join('').length > n) a.pop();
  return a.join('');
}
// 台灣時間的第幾天（跟 firestore.rules 檢查的算法一樣），和它對應的「幾月幾日」
const nestDayN = () => Math.floor((Date.now() + 288e5) / 864e5);
const dayMd = n => { const d = new Date(n * 864e5); return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`; };
// 登入了才有；沒登入、雲端沒開都是 null
const sNet = () => (window.nestNet && window.nestNet.me ? window.nestNet : null);
// 規則還沒發布、斷線：只在 console 留一行，畫面不出聲
const sQuiet = (tag, e) => console.info(`[${tag}]`, e && (e.code || e.message || e));
const sErr = e => (e && e.code === 'permission-denied' ? '雲端還沒開好這個功能，晚點再試' : '連不上雲端，晚點再試');
// 去朋友家時，下面那條多出來的按鈕：後面的檔案各自加（visit.js 的 visitOpen 會叫）
const visitExtras = [];

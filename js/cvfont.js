/* 薯餅的小窩：畫布上的字（合照、娃娃機，之後的明信片存照片都用這一套）
   2026-11-28 從 photo.js 抽出來。網頁的字是 css/gensen.css 那套源泉圓體，切成很多段，畫布不會自己去下載。
   做法：要畫的字用到哪幾段，就把那幾段另外註冊成只有畫布在用的字型名稱，自己 load 好才畫。
   不直接寫 "GenSenRounded"：網頁也在用那個名字，Chrome 會沿用先前字還沒載好時排出來的結果，
   實測合照白邊上「臥室」「又拍」用了系統字，同一行後面的字卻是源泉圓體。
   一行裡要用的段只要有一段 3 秒內沒載好，那一整行就用系統字，不會一行混兩種字。沒載好的段拿掉，下一次再重載。
   字分兩組，跟 css 的 --f-head、--f-body 一樣：head 是源泉圓體（標題、按鈕、數字、合照白邊）；body 是粉圓（css/huninn.css，娃娃說的話、信、說明）。
   body 的一行：粉圓每個字都有（huninnHas）而且段都載好 → 粉圓；不然整行改用 head 的源泉圓體，一樣先載好；源泉也沒載好 → 整行系統字。
   哪幾行要退到源泉，cvFonts 自己判斷、自己載，呼叫的地方不用多寫。
   用法：await cvFonts(['要畫的那幾行'], 'head')，畫的時候 ctx.font = `900 20px ${cvFam('那一行', 'head')}`。 */
const CV_GRP = {
  head: {fam: 'NestCanvasHead', css: /gensen\.css/},
  body: {fam: 'NestCanvasBody', css: /huninn\.css/}
};
const CV_SYS = '"PingFang TC","Noto Sans TC",sans-serif';
const CV_FACES = new Map();   // 組＋段的網址 → FontFace（載好的留著，下一次直接用）
const CV_SEGS = {};
const cvOk = new Set();       // 組＋那一行字：這行要的段都載好了
const cvG = g => CV_GRP[g] ? g : 'head';
// 從樣式表讀每一段的網址和 unicode-range，照 css 的順序
function cvSegs(grp){
  const G = CV_GRP[grp];
  if (CV_SEGS[grp] && CV_SEGS[grp].length) return CV_SEGS[grp];
  const out = [];
  for (const sh of document.styleSheets){
    if (!G.css.test(sh.href || '')) continue;
    let rules; try { rules = sh.cssRules; } catch (e) { continue; }
    for (const r of rules){
      if (!(r instanceof CSSFontFaceRule)) continue;
      const m = /url\(\s*["']?([^"')]+)/.exec(r.style.getPropertyValue('src')); if (!m) continue;
      const ur = r.style.getPropertyValue('unicode-range').trim();
      out.push({url: new URL(m[1], sh.href).href, ur, rg: ur ? ur.split(',').map(x => { const [a, b] = x.trim().replace(/^u\+/i, '').split('-'); return [parseInt(a, 16), parseInt(b || a, 16)]; }) : null});
    }
  }
  return (CV_SEGS[grp] = out);
}
// 這行字要哪幾段：不寫範圍的那段（00）一定要；其他字照瀏覽器的規則，css 越後面越優先，從後面找第一段範圍有這個字的
function cvNeed(grp, text){
  const L = cvSegs(grp), need = new Set(L.filter(x => !x.rg));
  for (const ch of text){
    const u = ch.codePointAt(0);
    for (let i = L.length - 1; i >= 0; i--){ const x = L[i]; if (x.rg && x.rg.some(([a, b]) => u >= a && u <= b)){ need.add(x); break; } }
  }
  return [...need];
}
function cvFace(grp, x){
  const k = grp + ' ' + x.url;
  let f = CV_FACES.get(k);
  if (!f){
    f = new FontFace(CV_GRP[grp].fam, `url("${x.url}") format("woff2")`, x.ur ? {weight: '100 1000', unicodeRange: x.ur} : {weight: '100 1000'});
    CV_FACES.set(k, f); document.fonts.add(f);
  }
  return f;
}
// 載一組字：等這幾行要的段載好（最多 3 秒），載好的行記在 cvOk
async function cvLoad(lines, grp){
  if (!lines.length) return;
  const L = cvSegs(grp);
  if (!L.length){ console.warn('畫布的字：讀不到字型的樣式表，用系統字'); return; }
  const per = lines.map(t => cvNeed(grp, t).map(x => cvFace(grp, x)));
  const all = [...new Set(per.flat())];
  const load = Promise.all(all.map(f => f.status === 'loaded' ? f : f.load().catch(e => console.warn('畫布的字沒載到', e))));
  await Promise.race([load, new Promise(r => setTimeout(r, 3000))]);
  // 沒載好的段拿掉，畫布不會碰到還在載或載失敗的段；下一次再重新載
  for (const f of all) if (f.status !== 'loaded'){ document.fonts.delete(f); for (const [k, v] of CV_FACES) if (v === f) CV_FACES.delete(k); }
  lines.forEach((t, i) => { const k = grp + '\n' + t; if (per[i].every(f => f.status === 'loaded')) cvOk.add(k); else cvOk.delete(k); });
}
// lines：要畫的每一行字。等這幾行載好，之後 cvFam(那行字, grp) 才會給畫布用的字型名稱
async function cvFonts(lines, grp){
  grp = cvG(grp);
  if (grp !== 'body') return cvLoad(lines, grp);
  // 粉圓缺字的行一開始就去載源泉；粉圓 3 秒沒載好的行，再退到源泉
  const can = t => typeof huninnHas === 'function' && huninnHas(t);
  const alt = cvLoad(lines.filter(t => !can(t)), 'head');
  await cvLoad(lines.filter(can), 'body');
  await Promise.all([alt, cvLoad(lines.filter(t => can(t) && !cvOk.has('body\n' + t)), 'head')]);
}
const cvFam = (t, grp) => {
  grp = cvG(grp);
  if (grp === 'body' && !cvOk.has('body\n' + t)) grp = 'head';   // 整行退到源泉
  return (cvOk.has(grp + '\n' + t) ? `"${CV_GRP[grp].fam}",` : '') + CV_SYS;
};

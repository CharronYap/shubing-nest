/* 薯餅的小窩：內文（粉圓）缺字時，整段換源泉圓體（2026-11-28）
   遊戲自己寫的字都在 huninn-00 裡（check.py 檢查過），會缺的是玩家打的字、朋友的名字。
   規則：一段字裡只要有一個字粉圓沒有（js/huninn-cmap.js 的 huninnHas），那一整段加 .f-alt，用 --f-alt（源泉圓體）。
   不讓瀏覽器一個字一個字去補別的字型，不然一行裡會有一個字長得不一樣。
   「一段」是那個字最近的、不是 inline 的元素（p、li、div、按鈕、泡泡…）。內容改了再檢查一次，字都有了就拿掉 .f-alt。輸入框看自己的 value。
   不先看那段原本是不是粉圓：Chrome 只要一算那個元素的樣式（getComputedStyle），就會去下載那個字所在的粉圓段，最後用不到也白抓。
   所以先把 .f-alt 加在字的上一層，再往上找那一段。標題那組本來就是源泉圓體（--f-alt 跟 --f-head 一樣），加了看起來不變。
   說話（2026-11-28）：娃娃的泡泡（.say）、小劇場重看裡娃娃說的那行（.sk-s）用文楷，只有一個檔 lxgw-00。
   整段字有 lxgw-00 沒有的（js/lxgw-cmap.js 的 lxgwHas），加 .f-say-alt 整段退回粉圓；粉圓也沒有，再加 .f-alt 退成源泉。
   是不是說話看 class（closest），一樣不去算樣式。字都有了兩個都拿掉。 */
(function () {
  if (typeof huninnHas !== 'function') return;
  const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/;
  const SAY = '.say,.sk-s';
  const lxHas = typeof lxgwHas === 'function' ? lxgwHas : () => false;   // 沒載到就當作都沒有，整段用粉圓
  // 說話的那一段：整段看一次
  function fixSay(s) {
    const tx = s.textContent, noLx = !lxHas(tx);
    s.classList.toggle('f-say-alt', noLx);
    s.classList.toggle('f-alt', noLx && !huninnHas(tx));
  }
  function sayOf(n) {
    const e = n.nodeType === 1 ? n : n.parentElement;
    return e && e.closest(SAY);
  }
  // 往上找第一個不是 inline 的元素
  function blk(n) {
    let e = n.nodeType === 1 ? n : n.parentElement;
    while (e && e !== document.body && /^(inline|contents)$/.test(getComputedStyle(e).display)) e = e.parentElement;
    return e && e !== document.body ? e : null;
  }
  function mark(t) {
    const p = t.parentElement;
    if (!p || SKIP.test(p.nodeName) || p.closest('.f-alt')) return;
    p.classList.add('f-alt');                 // 先加，再算樣式
    const e = blk(p);
    if (e && e !== p) { e.classList.add('f-alt'); p.classList.remove('f-alt'); }
  }
  function fixInput(el) {
    el.classList.toggle('f-alt', !huninnHas(el.value));
  }
  function scan(root) {
    if (root.nodeType === 3) { const s = sayOf(root); if (s) fixSay(s); else if (!huninnHas(root.data)) mark(root); return; }
    if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
    if (/^(INPUT|TEXTAREA)$/.test(root.nodeName)) { fixInput(root); return; }
    const says = new Set(), up = sayOf(root);
    if (up) says.add(up);
    root.querySelectorAll(SAY).forEach(s => says.add(s));
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t; (t = w.nextNode());) if (!huninnHas(t.data) && !sayOf(t)) mark(t);
    says.forEach(fixSay);
    root.querySelectorAll('input,textarea').forEach(fixInput);
  }
  // 這個節點所在、已經換成源泉的那一段：字都有了就換回粉圓，裡面的小段再各自檢查
  function recheck(n) {
    const s = sayOf(n);
    if (s) { fixSay(s); return; }
    const e = n.nodeType === 1 ? n : n.parentElement;
    const a = e && e.closest('.f-alt');
    if (!a || /^(INPUT|TEXTAREA)$/.test(a.nodeName)) return;
    if (huninnHas(a.textContent)) { a.classList.remove('f-alt'); scan(a); }
  }
  // 放上去馬上要量大小的地方（說話泡泡）先叫這個（文楷、粉圓兩層都在這裡換好）：MutationObserver 要等這段程式跑完才會跑，量的時候還沒換字型
  window.fontFix = n => { if (n && n.isConnected) scan(n); };
  function start() {
    scan(document.body);
    new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'characterData') { recheck(m.target); if (!sayOf(m.target) && !huninnHas(m.target.data)) mark(m.target); continue; }
        if (m.removedNodes.length) recheck(m.target);
        m.addedNodes.forEach(scan);
      }
    }).observe(document.body, {childList: true, subtree: true, characterData: true});
    const onInput = e => { const el = e.target; if (el && /^(INPUT|TEXTAREA)$/.test(el.nodeName)) fixInput(el); };
    // 打字、貼上：字放進框之前先看。Chrome 插字時就會排版，等到 input 事件才換，粉圓那段已經在下載了
    document.addEventListener('beforeinput', e => {
      const el = e.target;
      if (!el || !/^(INPUT|TEXTAREA)$/.test(el.nodeName)) return;
      const d = e.data || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
      if (d && !huninnHas(d)) el.classList.add('f-alt');
    }, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('focusin', onInput, true);   // 程式先填好的值（改名字的框）沒有 input 事件
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

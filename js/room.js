/* 薯餅的小窩：娃娃房間（拖曳、坐家具、收納架、夜晚） */
const $ = s=>document.querySelector(s);
const room=$('#room'), stage=$('#stage'), area=$('#area'), screen=$('#screen'), tray=$('#tray');
/* 房間寬高比：依畫面空間算，layout() 會更新。位置和大小都用 % 記，所以比例變了也不會跑掉 */
let RATIO = 340/400;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEART = (c='#ff6fb0',s='#fff')=>`<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z" fill="${c}" stroke="${s}" stroke-width="1.6"/></svg>`;
const CKS = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.4 2.3 4.6-5"/></svg>';
const HOUSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M12 18s-3-1.8-3-3.6c0-1 .8-1.7 1.6-1.7.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8.8 0 1.6.7 1.6 1.7 0 1.8-3 3.6-3 3.6z" fill="currentColor" stroke="none"/></svg>';
const ICON = {
  living:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="6" width="16" height="9" rx="4"/><rect x="2" y="10" width="5" height="8" rx="2.5"/><rect x="17" y="10" width="5" height="8" rx="2.5"/><rect x="5" y="13" width="14" height="5" rx="2"/><rect x="5" y="18" width="2" height="3" rx="1"/><rect x="17" y="18" width="2" height="3" rx="1"/></svg>',
  bed:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="12" width="20" height="6" rx="2"/><rect x="2" y="6" width="3.2" height="15" rx="1.6"/><rect x="6" y="8.5" width="6" height="4" rx="2"/><rect x="19.5" y="11" width="2.5" height="10" rx="1.2"/></svg>',
  bath:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 12h20v2a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6z"/><path d="M5 12V6.5a2.5 2.5 0 0 1 5 0" fill="none" stroke="currentColor" stroke-width="2"/><rect x="6" y="19" width="2" height="3" rx="1"/><rect x="16" y="19" width="2" height="3" rx="1"/><circle cx="14" cy="8" r="1.6"/><circle cx="18" cy="6" r="1.2"/></svg>',
};
ICON.yard='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 11.5L12 7l9.5 4.5L12 16z"/><path d="M2.5 11.5V13l9.5 4.5 9.5-4.5v-1.5L12 16z" opacity=".55"/><path d="M12 7V3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 3.4c1.6-.8 3.3-.4 4.4.6-1.5.8-3.1.7-4.4-.6z"/><path d="M5 19.4c1-1 2.6-1 3.4 0 .8-.8 2.2-.7 2.8.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const RIDS=['living','bed','bath'];
// 上面的房間鈕、通往隔壁的門口用這個：去朋友家時，對方還沒有新的小島就不列小島（js/yard.js 會把 yard 加進 RIDS）
const roomList=()=>RIDS.filter(r=>r!=='yard'||!VISIT||!!VISIT.yard);
let roomId='living', items=[];
// 去朋友家的時候（visit.js）：VISIT = {name, home, look}，房間畫朋友的，不能拖、不存檔
let VISIT=null;
const cur=()=>(VISIT?VISIT.home:home)[roomId];
/* ---------- 牆和地板 ----------
   存檔裡的 y 是「牆和地板各自裡面的位置」：0～52 在牆上（0 頂端、52 牆腳），52～100 在地板上（52 牆腳、100 最前面）。
   收納架收起來時牆的高度不變，多出來的高度全給地板，所以要換算成畫面上的 %：roomY() 存檔→畫面，roomV() 畫面→存檔。
   收納架打開時牆正好佔 52%，兩個數字一樣，舊存檔不用換算 */
const WALL_V=52;
let WALL=.52;   // 現在牆佔房間高度的比例，layout() 會更新
function roomY(v){return v<=WALL_V?v/WALL_V*WALL*100:WALL*100+(v-WALL_V)/(100-WALL_V)*(1-WALL)*100;}
function roomV(y){const w=WALL*100;return y<=w?y/w*WALL_V:WALL_V+(y-w)/(100-w)*(100-WALL_V);}

/* ---------- 大小、前後 ---------- */
function depth(y){return .8+.2*Math.max(0,Math.min(1,(y-52)/42));}
function sizeOf(it){
  if(it.kind==='doll'){const s=depth(it.y)*(it.sit?.92:1);const w=22*s;return [w,w*RATIO];}
  const f=FURN[it.id];if(!f)return [0,0];   // 這一版不認得的家具：當作沒有大小，不丟例外
  const s=f.wall?1:depth(it.y);const w=f.w*s;return [w,w*(f.vb[1]/f.vb[0])*RATIO];
}
// 座位可以在家具旁邊（sx 小於 0 或大於 1，例如拖鞋架、點心櫃），家具靠邊擺時不讓座位跑出房間
function seatPos(f,k){const [w,h]=sizeOf(f);const [sx,sy]=FURN[f.id].seats[k];return [Math.max(7,Math.min(93,f.x+(sx-.5)*w)),roomV(roomY(f.y)-(1-sy)*h)];}
// 娃娃坐的那件：要是這間裡有座位的家具，座位號碼也要在範圍內。存檔裡指到別隻娃娃、沒有座位的家具、不存在的座位時，
// 以前會在這裡丟出例外，整間房間畫不出來（2026-11-27 過夜回家後臥室整片深藍）。不合的就站回地上
function seatOf(d){
  const f=d.sit!=null?items.find(o=>o.uid===d.sit&&o.kind==='furn'&&o!==d):null,sv=f&&FURN[f.id]&&FURN[f.id].seats;
  return sv&&Array.isArray(sv[d.seat|0])?f:null;
}
function syncSeated(){items.forEach(d=>{if(d.kind==='doll'&&d.sit){const f=seatOf(d);if(!f){d.sit=null;d.seat=0;if(!d.x&&!d.y){d.x=50;d.y=90;}return;}d.seat=d.seat|0;const [x,y]=seatPos(f,d.seat);d.x=x;d.y=y+.5;}});}
function zOf(it){
  if(it.kind==='furn'){const f=FURN[it.id];if(f.floor)return 6;if(f.wall)return 8;return 20+Math.round(it.y*3);}
  if(it.sit){const f=items.find(o=>o.uid===it.sit&&o.kind==='furn');if(f)return zOf(f)+1+(it.seat|0);}
  return 20+Math.round(it.y*3)+1;
}

let quiet=false;
/* 存檔裡有這一版不認得的家具或娃娃（比較新的版本擺的，或定義沒載到）：先從房間裡拿開，不畫，
   免得一樣東西讓整個畫面畫不出來、後面的娃娃機和每天的幣都跟著沒跑（2026-11-27 的事故）。
   那一筆不會不見：存檔的時候照樣寫回去（房間的 toJSON），之後這一版認得了就會回來。js/main.js 開始時叫一次。 */
function roomQuarantine(){
  try{furnDedupe();}catch(e){console.info('[room]',e);}
  try{uidRepair();}catch(e){console.info('[room]',e);}
  const rooms=[...Object.keys(home).map(r=>home[r]),home.yard].filter((r,i,a)=>r&&Array.isArray(r.items)&&a.indexOf(r)===i);
  let n=0;
  rooms.forEach(rm=>{
    const ok=i=>!!i&&(i.kind==='furn'?!!FURN[i.id]:i.kind==='doll'&&!!SPR[i.id]);
    const lost=rm.items.filter(i=>i&&!ok(i));
    if(rm.items.every(ok))return;
    const keep=rm.items.filter(ok);rm.items.length=0;rm.items.push(...keep);   // 陣列本身不換，別的地方拿著它的還是同一個
    if(lost.length)Object.defineProperty(rm,'toJSON',{configurable:true,enumerable:false,value(){const o={};Object.keys(this).forEach(k=>{o[k]=this[k];});o.items=[...this.items,...lost];return o;}});
    n+=lost.length;
  });
  if(n)console.info('[room] 有 '+n+' 樣這一版不認得的東西，先不畫（存檔裡留著）');
  return n;
}
/* 編號（uid）檢查：同一間裡兩樣東西同一個編號、或下一個要發的編號比房間裡已經有的還小，
   之後新放進來的娃娃就可能跟家具撞號，坐的位置會指錯東西。開始時叫一次（roomQuarantine）。
   撞號的換一個新的；娃娃坐的位置指的是家具，所以撞號時先換娃娃的 */
function uidRepair(){
  const rooms=[...Object.keys(home).map(r=>home[r]),home.yard].filter((r,i,a)=>r&&Array.isArray(r.items)&&a.indexOf(r)===i);
  let max=0,n=0;
  rooms.forEach(rm=>rm.items.forEach(i=>{if(i&&typeof i.uid==='number'&&i.uid>max)max=i.uid;}));
  if(!(uid>max))uid=max+1;
  rooms.forEach(rm=>{
    const seen=new Set(),list=rm.items.filter(Boolean);
    [...list.filter(i=>i.kind==='furn'),...list.filter(i=>i.kind!=='furn')].forEach(i=>{if(seen.has(i.uid)){i.uid=uid++;n++;}seen.add(i.uid);});
  });
  if(n)console.info('[room] 有 '+n+' 樣東西編號重複，換了新的編號');
  return n;
}
function elFor(it){
  if(it&&it.guest)return room.querySelector(`.st-guest[data-gu="${it.uid}"]`);   // 來過夜的客人（js/stay.js）是另外畫的元素，不在這裡建立；還沒畫出來就是 null
  let el=room.querySelector(`.it[data-u="${it.uid}"]`);
  if(!el){
    el=document.createElement('div');el.className='it';el.dataset.u=it.uid;
    if(it.kind==='doll'){el.classList.add('doll');el.innerHTML=`<span class="body">${dollPic(it.id,it.look&&typeof stayLook==='function'?stayLook(it.look):VISIT?(VISIT.look[it.id]||{}):undefined)}</span>`;}
    else el.innerHTML=furnSVG(it.id);
    el.addEventListener('pointerdown',e=>{if(VISIT)visitTap(it);else startDrag(e,it.uid);});
    room.appendChild(el);
    if(!quiet){el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),500);}
  }
  return el;
}
function render(){
  syncSeated();
  const alive=new Set(items.map(i=>String(i.uid)));
  room.querySelectorAll('.it').forEach(e=>{if(!alive.has(e.dataset.u))e.remove();});
  items.forEach(it=>{
    if(it.kind==='furn'?!FURN[it.id]:!SPR[it.id])return;   // 不認得的跳過不畫（平常 roomQuarantine 已經先拿開了，這裡再保險一次）
    try{
    const el=elFor(it);const [w]=sizeOf(it);
    el.style.left=it.x+'%';el.style.top=roomY(it.y)+'%';el.style.width=w+'%';el.style.zIndex=zOf(it);
    if(it.kind==='doll'){
      el.classList.toggle('sit',!!it.sit);el.classList.toggle('breathe',!it.sit);
      el.querySelector('.body').style.animationDelay=(-(it.uid*0.7)%3.2)+'s';
    }
    }catch(e){console.error('[room] 這一件畫不出來，先跳過',it,e);}   // 一件出錯不要讓後面的都沒畫，房間看起來像空的
  });
  renderGlow();
  if(!VISIT){renderTray();renderSet();afterRender();}else{if(typeof paintSleep==='function')paintSleep();if(typeof stayPaint==='function')stayPaint();}   // 去朋友家、看明信片時：自己家的客人和紙條不要留在畫面上
}
function renderGlow(){
  room.querySelectorAll('.glow').forEach(g=>g.remove());
  items.filter(i=>i.kind==='furn'&&FURN[i.id]&&FURN[i.id].glow).forEach(l=>{
    const [w,h]=sizeOf(l);const [gx,gy]=FURN[l.id].glow;
    const g=document.createElement('div');g.className='glow';g.style.left=(l.x+(gx-.5)*w)+'%';g.style.top=(roomY(l.y)-(1-gy)*h)+'%';room.appendChild(g);
  });
}

/* ---------- 拖曳 ---------- */
let drag=null;
// 畫面上的 %（y 還沒換算成存檔的位置）
function pt(e){const r=room.getBoundingClientRect();return [(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100];}
function overTray(e){if(tray.hidden)return false;const r=tray.getBoundingClientRect();return e.clientY>r.top-6&&e.clientX>r.left&&e.clientX<r.right;}
function startDrag(e,u){
  const it=items.find(i=>i.uid===u);if(!it)return;
  e.preventDefault();
  const el=elFor(it);el.setPointerCapture(e.pointerId);
  const [px,py]=pt(e);
  drag={it,el,sx:e.clientX,sy:e.clientY,dx:it.x-px,dy:roomY(it.y)-py,moved:false,seatHot:null,ro:false};
  el.addEventListener('pointermove',onMove);el.addEventListener('pointerup',onUp);el.addEventListener('pointercancel',onUp);
}
/* 娃娃被東西蓋住也拿得起來（2026-11-27）：手指按在某隻娃娃的框裡，最上面卻是家具（前面擺了高家具）、
   門邊的背包、過夜或旅行的紙條，就先拿娃娃。最上面本來就是娃娃（自己的、來過夜的客人）照舊；
   房間裡的按鈕（撿東西、信箱、相機、小店）照舊；去朋友家、選躲藏的家具時不搶。
   roam.js、spin.js 按下去時也用 dollUnder 找娃娃（away.js 已經有一個 dollAt，不能同名），所以這一道要等它們都掛好之後才掛（DOMContentLoaded） */
function dollUnder(e){
  if('__doll' in e)return e.__doll;
  let pick=null;const t=e.target;
  if(!VISIT&&!(typeof hidePicking!=='undefined'&&hidePicking)&&t&&t.closest&&room.contains(t)&&!t.closest('.doll')&&t.closest('.it,.fx,.st-note')){
    let bz=-1;
    room.querySelectorAll('.it.doll').forEach(el=>{
      const img=el.querySelector('.body img');if(!img)return;
      const r=img.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
      const z=+getComputedStyle(el).zIndex||0;if(z>bz){bz=z;pick=el;}
    });
  }
  e.__doll=pick;return pick;
}
addEventListener('DOMContentLoaded',()=>room.addEventListener('pointerdown',e=>{
  const el=dollUnder(e);if(!el)return;
  const it=items.find(i=>String(i.uid)===el.dataset.u);if(!it)return;
  e.stopPropagation();startDrag(e,it.uid);
},true));
function limits(it){
  if(it.kind==='furn'&&FURN[it.id].wall)return [10,90,12,44];
  const [w]=sizeOf(it);return [Math.max(4,w/2-2),Math.min(96,100-w/2+2),56,95];
}
function onMove(e){
  if(!drag||drag.ro)return;const {it,el}=drag;
  if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<6)return;
  if(!drag.moved){drag.moved=true;el.classList.add('drag');tray.classList.add('ghost');if(it.kind==='doll'){room.classList.add('dragdoll');showSeats(it);}if(it.sit)it.sit=null;}
  const [px,py]=pt(e);const [x0,x1,y0,y1]=limits(it);
  // fx、fy：手指實際拖到的位置（娃娃腳的位置），還沒被夾回地板
  const fx=px+drag.dx,fy=roomV(py+drag.dy);
  it.x=Math.max(x0,Math.min(x1,fx));it.y=Math.max(y0,Math.min(y1,fy));
  if(it.kind==='doll'){
    // 找最近的座位要用手指的位置，不能用夾過的：高的家具（書櫃頂）靠牆擺時，座位在地板範圍上面，夾過就永遠搆不到
    let best=null,bd=10;
    room.querySelectorAll('.seat').forEach(s=>{const d=Math.hypot(+s.dataset.x-fx,(+s.dataset.y-fy)*.85);if(d<bd){bd=d;best=s;}s.classList.remove('hot');});
    if(best){best.classList.add('hot');it.x=+best.dataset.x;it.y=+best.dataset.y+.5;}   // 有座位亮起來：直接貼上去預覽，放開就坐上去
    drag.seatHot=best;
  }
  tray.classList.toggle('over',overTray(e));
  render();el.style.zIndex=500;
}
function onUp(e){
  if(!drag)return;const {it,el}=drag;
  el.removeEventListener('pointermove',onMove);el.removeEventListener('pointerup',onUp);el.removeEventListener('pointercancel',onUp);
  el.classList.remove('drag');room.classList.remove('dragdoll');tray.classList.remove('over','ghost');
  if(!drag.moved){drag=null;if(it.kind==='doll')react(it);else if(!(typeof onFurnTap==='function'&&onFurnTap(it)))nudge(el);return;}
  if(overTray(e)){removeItem(it.uid);drag=null;clearSeats();return;}
  if(it.kind==='doll'&&drag.seatHot){it.sit=+drag.seatHot.dataset.f;it.seat=+drag.seatHot.dataset.k;}
  drag=null;clearSeats();render();
}
function nudge(el){if(REDUCE)return;el.animate([{transform:'translate(-50%,-100%)'},{transform:'translate(-50%,-100%) scale(1.04,.96)'},{transform:'translate(-50%,-100%)'}],{duration:320,easing:'ease-out'});}
function removeItem(u,list=items){
  list.forEach(d=>{if(d.sit===u){d.sit=null;d.y=Math.min(95,d.y+8);}});
  const i=list.findIndex(o=>o.uid===u);if(i>=0)list.splice(i,1);
  if(list===items)render();
}
function showSeats(d){
  items.filter(f=>f.kind==='furn'&&FURN[f.id].seats).forEach(f=>{
    FURN[f.id].seats.forEach((_,k)=>{
      // 自己晃去坐的、來過夜的客人坐著的位置也不亮（js/roam.js 的 roamSeatTaken）：不然放上去兩隻會疊在同一格，後面那隻整個被蓋住
      if(items.some(o=>o!==d&&o.sit===f.uid&&o.seat===k)||(typeof roamSeatTaken==='function'&&roamSeatTaken(f,k,d.uid)))return;
      const [x,y]=seatPos(f,k);const s=document.createElement('div');s.className='seat';
      s.style.left=x+'%';s.style.top=(roomY(y)-3)+'%';s.dataset.x=x;s.dataset.y=y;s.dataset.f=f.uid;s.dataset.k=k;room.appendChild(s);
    });
  });
}
function clearSeats(){room.querySelectorAll('.seat').forEach(s=>s.remove());}

/* ---------- 點娃娃 ---------- */
function react(it){
  const el=elFor(it);const b=el.querySelector('.body');
  b.classList.remove('r-heart');void b.offsetWidth;b.classList.add('r-heart');
  setTimeout(()=>b.classList.remove('r-heart'),900);
  const [,h]=sizeOf(it);const hx=document.createElement('div');hx.className='hfx';hx.style.left=it.x+'%';hx.style.top=(roomY(it.y)-h*.8)+'%';
  hx.innerHTML=HEART();room.appendChild(hx);setTimeout(()=>hx.remove(),1300);
  onDollTap(it);
}

/* ---------- 收納架 ---------- */
let tab='doll';
const LOCK='<span class="lk"><svg viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="6.5" rx="1.6" fill="currentColor"/><path d="M3 5V3.6a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>';
const CK=`<span class="ck">${CKS}</span>`;
function whereFurn(id){for(const r of RIDS){if(home[r].items.some(i=>i.kind==='furn'&&i.id===id))return r;}return null;}
function whereDoll(id){if(typeof S!=='undefined'&&S.album&&S.album.out&&S.album.out.d===id)return 'out';if(typeof S!=='undefined'&&S.yard&&S.yard.stay&&S.yard.stay[id])return 'yard';for(const r of RIDS){if(home[r].items.some(i=>i.kind==='doll'&&i.id===id))return r;}return null;}
/* 收納架（2026-11-27 重新整理，使用者說分類亂）：四個分頁 娃娃｜家具｜牆和地板｜紀念品。
   - 每一頁「已經有的」在前面；「還沒有的」收在最下面一排「還沒有的 N 樣」，預設收起來，點了才展開，展開後每一格寫怎麼拿。
   - 娃娃：在這一間的 → 在別間的（標房間）→ 出門旅行或過夜的（標背包或月亮）→ 還沒有的。
   - 家具：每一間都能擺，所以列全部的（掛牆上的不放小島），分三組：可以坐的躺的、擺著的、牆上和地上的。
     每組裡：新的 → 還沒擺的 → 擺在這一間的 → 擺在別間的（標房間，點了搬過來）；小標題寫幾件，點了收起來。
   - 紀念品：旅行的土產和節日的東西，每一間都能擺；擺在別間的標房間，點了搬過來。
   收起來還是展開不存檔，重新整理就收回去。 */
const trayMore={doll:false,furn:false,deco:false,keep:false};
const trayShut={};   // 家具那一頁哪幾組收起來了
// 這一間放不放得下：掛牆上的不放小島（小島沒有牆）。已經擺在小島上的照樣列出來，才收得回去
const furnFits=id=>!(roomId==='yard'&&FURN[id].wall&&whereFurn(id)!=='yard');
/* 一件家具同時只在一間。兩台裝置的房間合在一起時（js/account.js 的 mergeSave 會留著這台剛買的房間）可能同一件出現在兩間：
   留前面那一間的，後面的拿掉，坐在上面的娃娃站回地上。開始的時候跟「不認得的東西」一起檢查 */
function furnDedupe(){
  const seen={};let n=0;
  RIDS.forEach(r=>{const rm=home[r];if(!rm||!Array.isArray(rm.items))return;
    rm.items.filter(i=>i&&i.kind==='furn').forEach(i=>{if(!seen[i.id]){seen[i.id]=1;return;}
      rm.items.forEach(d=>{if(d.sit===i.uid){d.sit=null;d.y=Math.min(95,(+d.y||85)+8);}});
      rm.items.splice(rm.items.indexOf(i),1);n++;});});
  if(n)console.info('[room] 有 '+n+' 件家具同時擺在兩間，留一間的');
  return n;
}
const TRAY_SEASON={lny:'過年',spring:'春天',summer:'夏天',moon:'中秋',hallo:'萬聖節',winter:'冬天',anniv:'週年'};
// 還沒有的東西怎麼拿：格子裡的短字、點了的提示
function trayHow(kind,id){
  if(kind==='doll')return ['娃娃機','娃娃機夾得到'];
  if(kind==='wall'){const g=typeof GIFT_WALL!=='undefined'&&GIFT_WALL[id];return g?['湊齊系列',g]:['娃娃機・小店','娃娃機夾得到，小店也買得到'];}
  if(kind==='floor'){const g=typeof GIFT_FLOOR!=='undefined'&&GIFT_FLOOR[id];return g?['湊齊系列',g]:['小店','火腿的小店買得到'];}
  const f=FURN[id]||{};
  if(f.souv){const sv=typeof TV_SOUV!=='undefined'&&TV_SOUV[id.replace(/^tvs_/,'')],pl=sv&&typeof TV_PLACES!=='undefined'&&TV_PLACES[sv.from];const n=pl?(pl.short||pl.name.replace('山上的','')):'旅行';return [n,`娃娃去${pl?(pl.abroad?pl.country:pl.name):'旅行'}會帶回來`];}
  if(f.season){const n=TRAY_SEASON[f.season]||'節日';return [n,`${n}的時候會出現在這裡`];}
  if(f.gift){const sr=typeof FURN_SERIES!=='undefined'?Object.values(FURN_SERIES).find(x=>x.gift&&x.gift.kind==='furn'&&x.gift.id===id):null;return ['湊齊系列',sr?`湊齊${sr.name}送你`:'湊齊一個系列送你'];}
  return ['娃娃機・小店','娃娃機夾得到，小店也買得到'];
}
/* 家具系列的進度（原本是右上角一顆「雲朵＋五個點」，使用者看不懂，2026-11-27 改成字）：
   家具那一頁最上面只放一行：最接近湊齊的那一個系列，「雲朵系列 3/5，湊齊送雲朵地板」，旁邊一顆「看全部」。
   全部的系列在另外一頁（seriesOpen，小窩指南也進得去）：每個系列有幾件、缺哪幾件（缺的是剪影，寫怎麼拿）。 */
function seriesAll(){
  const L=[{k:'cloud',name:'雲朵系列',ids:CLOUD_SET,gift:'雲朵地板'}];
  if(typeof FURN_SERIES!=='undefined')Object.entries(FURN_SERIES).forEach(([k,s])=>L.push({k,name:s.name,ids:s.ids,gift:s.gift?s.gift.name:''}));
  return L.filter(s=>Array.isArray(s.ids)&&s.ids.length&&s.ids.every(id=>FURN[id]));
}
const seriesHave=s=>s.ids.filter(id=>FURN_OWN[id]).length;
const seriesTile=id=>FURN_OWN[id]?`<span class="tile">${furnSVG(id)}</span>`:`<span class="tile lock" aria-label="${furnName(id)}，還沒有">${furnSVG(id)}<small class="how">${trayHow('furn',id)[0]}</small></span>`;
function seriesOpen(){
  openSheet(`<div class="hd">${ICON.living}<span>家具系列</span></div>
    <div class="yd-box">${seriesAll().map(s=>{const n=seriesHave(s),done=n===s.ids.length;
      return `<div class="al-sec">${s.name}<small>${n} / ${s.ids.length}${s.gift?(done?`・湊齊了，送過${s.gift}`:`・湊齊送${s.gift}`):''}</small></div><div class="yd-grid">${s.ids.map(seriesTile).join('')}</div>`;}).join('')}
      <p class="bk-note">灰色的是還沒有的，下面的小字是怎麼拿。娃娃機夾得到的，火腿的小店每天也會賣幾樣。</p></div>`);
  evOpen=false;alOpen=false;
}
const trayGrp=(t,ic)=>`<span class="grp">${ic||''}${t}</span>`;
// 最下面那一排：還沒有的 N 樣（點了展開）
function trayLocked(list,tile){
  if(!list.length)return '';
  const open=trayMore[tab];
  return `<button class="tray-more ${open?'on':''}" data-traymore="1" aria-expanded="${open}">還沒有的 ${list.length} 樣<i>${open?'收起來':'看一下'}</i></button>`+(open?list.map(tile).join(''):'');
}
function renderTray(){
  document.querySelectorAll('.tab[data-tab]').forEach(t=>t.classList.toggle('on',t.dataset.tab===tab));
  const box=$('#items');let h='';
  const nw=typeof newFurnList==='function'?newFurnList():[];
  if(tab==='doll'){
    const own=DOLLS.filter(id=>DOLL_N[id]),rank=id=>{const w=whereDoll(id);return w===roomId?0:w==='trip'||w==='out'?2:1;};
    own.map((id,i)=>[id,i]).sort((a,b)=>rank(a[0])-rank(b[0])||a[1]-b[1]).forEach(([id])=>{const w=whereDoll(id),here=w===roomId,away=w&&!here;
      h+=`<button class="tile ${here?'placed':''} ${away?'away':''}" data-doll="${id}" aria-label="${DOLL_NAME[id]}${here?'，在這一間':w==='trip'?'，去旅行了':w==='out'?'，去朋友家過夜了':away?'，在'+((typeof ROOM_LABEL!=='undefined'&&ROOM_LABEL[w])||'別間'):''}"><img src="${SPR[id]}" alt="">${here?CK:''}${away?`<span class="rm">${ICON[w]||''}</span>`:''}</button>`;});
    h+=trayLocked(DOLLS.filter(id=>!DOLL_N[id]),id=>`<button class="tile lock" data-doll="${id}" aria-label="還沒來的娃娃，${trayHow('doll',id)[1]}"><img src="${SPR[id]}" alt=""><small class="how">${trayHow('doll',id)[0]}</small></button>`);
  } else if(tab==='furn'){
    // 家具每一間都能擺（2026-11-27）：列全部的家具，不只這一間的。一件同時只在一間，擺在別間的標那一間的小圖、點了搬過來。
    // 掛牆上的不放小島。三組，每組裡：新的 → 還沒擺的 → 擺在這一間的 → 擺在別間的；同一種裡「這一間常用的」（原本限定這一間的）排前面
    const ids=Object.keys(FURN).filter(id=>!FURN[id].season&&!FURN[id].souv&&furnFits(id));
    const lab=w=>(typeof ROOM_LABEL!=='undefined'&&ROOM_LABEL[w])||'別間';
    const tile=id=>{const w=whereFurn(id),here=w===roomId,away=!!w&&!here,isNew=!w&&nw.includes(id);
      return `<button class="tile ${here?'placed':''} ${away?'away':''}" data-furn="${id}" aria-label="${furnName(id)}${here?'，擺在這一間':away?`，擺在${lab(w)}，點了搬過來`:isNew?'，新的':''}">${furnSVG(id)}${here?CK:''}${away?`<span class="rm">${ICON[w]||''}</span>`:''}${isNew?'<span class="nw">新</span>':''}</button>`;};
    const rank=id=>{const w=whereFurn(id);return w===roomId?2:w?3:nw.includes(id)?0:1;};
    const order=l=>l.map((id,i)=>[id,i,rank(id),FURN[id].room===roomId?0:1]).sort((a,b)=>a[2]-b[2]||a[3]-b[3]||a[1]-b[1]).map(x=>x[0]);
    const own=ids.filter(id=>FURN_OWN[id]);
    // 系列進度只放一行：還沒湊齊、最接近湊齊的那一個（差最少件的；一樣就取已經有比較多件的）。旁邊一顆「看全部」到系列那一頁
    const near=seriesAll().filter(x=>x.gift&&seriesHave(x)<x.ids.length).sort((a,b)=>(a.ids.length-seriesHave(a))-(b.ids.length-seriesHave(b))||seriesHave(b)-seriesHave(a))[0];
    if(near)h+=`<div class="tray-set"><b>${near.name} ${seriesHave(near)}/${near.ids.length}</b><span>湊齊送${near.gift}</span><button class="tray-setall" data-trayset="all">看全部</button></div>`;
    // 每一組的小標題寫幾件，點了收起來或打開（不存檔，重新整理就全部打開）
    [['seat','可以坐的躺的',id=>!!FURN[id].seats],['put','擺著的',id=>!FURN[id].seats&&!FURN[id].wall&&!FURN[id].floor],['flat',roomId==='yard'?'鋪在地上的':'牆上和地上的',id=>!FURN[id].seats&&(FURN[id].wall||FURN[id].floor)]].forEach(([k,name,is])=>{
      const l=order(own.filter(is));if(!l.length)return;const shut=!!trayShut[k];
      h+=`<button class="grp grp-b ${shut?'shut':''}" data-traygrp="${k}" aria-expanded="${!shut}">${name}<small>${l.length} 件</small><i></i></button>`+(shut?'':l.map(tile).join(''));});
    if(!own.length)h+='<p class="al-em tray-em">還沒有家具。娃娃機夾得到，火腿的小店也有賣。</p>';
    h+=trayLocked(ids.filter(id=>!FURN_OWN[id]),id=>`<button class="tile lock" data-furn="${id}" aria-label="${furnName(id)}，還沒有，${trayHow('furn',id)[1]}">${furnSVG(id)}<small class="how">${trayHow('furn',id)[0]}</small></button>`);
  } else if(tab==='keep'){
    // 紀念品：旅行的土產、節日的東西。有了才列在上面；每一間都能擺
    const all=Object.keys(FURN).filter(id=>(FURN[id].souv||FURN[id].season)&&furnFits(id)),own=all.filter(id=>FURN_OWN[id]);
    const tile=id=>{const w=whereFurn(id),here=w===roomId,away=w&&!here;
      return `<button class="tile ${here?'placed':''} ${away?'away':''}" data-furn="${id}" aria-label="${FURN[id].name}${here?'，擺在這一間':away?'，擺在別間，點了搬過來':''}">${furnSVG(id)}${here?CK:''}${away?`<span class="rm">${ICON[w]||''}</span>`:''}${!w&&nw.includes(id)?'<span class="nw">新</span>':''}</button>`;};
    const sv=own.filter(id=>FURN[id].souv),se=own.filter(id=>FURN[id].season);
    if(sv.length)h+=trayGrp('旅行帶回來的')+sv.map(tile).join('');
    if(se.length)h+=trayGrp('節日的')+se.map(tile).join('');
    if(!own.length)h+='<p class="al-em tray-em">還沒有紀念品。娃娃去旅行會帶土產回來，過節的時候這裡會多出節日的東西。每一間都能擺。</p>';
    h+=trayLocked(all.filter(id=>!FURN_OWN[id]),id=>`<button class="tile lock" data-furn="${id}" aria-label="${FURN[id].name}，還沒有，${trayHow('furn',id)[1]}">${furnSVG(id)}<small class="how">${trayHow('furn',id)[0]}</small></button>`);
  } else {
    const wt=id=>`<button class="tile ${cur().wall===id?'cur':''}" data-wall="${id}" aria-label="壁紙${cur().wall===id?'，現在用的':''}"><span class="sw w-${id}"></span></button>`;
    const ft=id=>`<button class="tile ${cur().floor===id?'cur':''}" data-floor="${id}" aria-label="地板${cur().floor===id?'，現在用的':''}"><span class="sw f-${id}"></span></button>`;
    h+=trayGrp('壁紙')+WALLS.filter(id=>WALL_OWN[id]).map(wt).join('')+trayGrp('地板')+FLOORS.filter(id=>FLOOR_OWN[id]).map(ft).join('');
    const lw=WALLS.filter(id=>!WALL_OWN[id]).map(id=>['wall',id]),lf=FLOORS.filter(id=>!FLOOR_OWN[id]).map(id=>['floor',id]);
    h+=trayLocked([...lw,...lf],([k,id])=>`<button class="tile lock" data-${k}="${id}" aria-label="${k==='wall'?'壁紙':'地板'}，還沒有，${trayHow(k,id)[1]}"><span class="sw ${k==='wall'?'w':'f'}-${id}"></span><small class="how">${trayHow(k,id)[0]}</small></button>`);
  }
  box.innerHTML=h;
}
/* ---------- 剛拿到的家具：標「新」、帶你去擺 ----------
   「新」只記在這台裝置（localStorage），不進存檔：拿到時記一筆，擺過一次就拿掉 */
const NEWF_KEY='shubingNest.newFurn';
function newFurnList(){
  let l=[];try{l=JSON.parse(localStorage.getItem(NEWF_KEY)||'[]');}catch(e){}
  if(!Array.isArray(l))l=[];
  const keep=l.filter(id=>FURN[id]&&FURN_OWN[id]&&!whereFurn(id));   // 擺出來了、或不認得的，就不算新
  if(keep.length!==l.length){try{localStorage.setItem(NEWF_KEY,JSON.stringify(keep));}catch(e){}}
  return keep;
}
function newFurnAdd(id){const l=newFurnList();if(!l.includes(id)){l.push(id);try{localStorage.setItem(NEWF_KEY,JSON.stringify(l.slice(-40)));}catch(e){}}}
const furnName=id=>FURN[id]?(FURN[id].name||(typeof FURN_NAME!=='undefined'&&FURN_NAME[id])||'家具'):'家具';
// 小店、獎品卡家具名字下面的小字。以前寫是哪一間用的；現在每一間都能擺（2026-11-27）
function furnRoomTag(id){
  const f=FURN[id];if(!f)return '';
  return `<span class="rm-tag">${f.wall?'屋裡每一間都能掛':'每一間都能擺'}</span>`;
}
// 去擺：留在現在這一間（掛牆上的在小島擺不了，帶去客廳），打開收納架的家具分頁、捲到那一件並閃一下
function furnGo(id){
  const f=FURN[id];if(!f||VISIT)return;
  const now=goingTo??roomId,r=now==='yard'&&f.wall?'living':now;
  $('#sheet').hidden=true;
  if(typeof setPage==='function')setPage('room');
  const show=()=>{
    setTray(false);tab=FURN[id]&&(FURN[id].souv||FURN[id].season)?'keep':'furn';Object.keys(trayShut).forEach(k=>{trayShut[k]=false;});renderTray();
    const t=$('#items').querySelector(`[data-furn="${id}"]`);if(!t)return;
    const box=$('#items');box.scrollTop=Math.max(0,t.offsetTop-box.offsetTop-box.clientHeight/2+t.offsetHeight/2);
    t.classList.remove('flashme');void t.offsetWidth;t.classList.add('flashme');setTimeout(()=>t.classList.remove('flashme'),2200);
  };
  const cur0=goingTo??roomId, inYard=typeof yardOn!=='undefined'&&yardOn;
  if(r===cur0&&!inYard){show();return;}
  goRoom(r);
  // 等房間真的換好再打開收納架：換房間有滑動的動畫，換好時會整個重畫，太早捲過去會被重畫蓋掉
  const wait=n=>{if((roomId===r&&goingTo===null&&!(typeof yardOn!=='undefined'&&yardOn))||n>50)setTimeout(show,60);else setTimeout(()=>wait(n+1),80);};
  wait(0);
}
function freeSpot(it){
  const cand=[[50,92],[34,94],[66,94],[20,90],[80,90],[50,80],[30,82],[70,82]];
  for(const c of cand){if(!items.some(o=>o!==it&&!o.sit&&Math.hypot(o.x-c[0],o.y-c[1])<9))return c;}
  return cand[0];
}
$('#items').addEventListener('click',e=>{
  if(e.target.closest('[data-traymore]')){trayMore[tab]=!trayMore[tab];renderTray();return;}
  if(e.target.closest('[data-trayset]')){trayKeep=true;try{seriesOpen();}finally{trayKeep=false;}return;}   // 「看全部」不收
  const tg=e.target.closest('[data-traygrp]');if(tg){trayShut[tg.dataset.traygrp]=!trayShut[tg.dataset.traygrp];renderTray();return;}
  const t=e.target.closest('.tile');if(!t)return;
  // 選了東西就收起來（擺進房間、收回、搬過來、換壁紙地板、點外出或旅行中的）；點還沒有的那格只跳提示，不收
  if(t.dataset.doll){const id=t.dataset.doll;if(!DOLL_N[id]){toast('還沒來，'+trayHow('doll',id)[1]);return;}
    const w=whereDoll(id);
    if(w===roomId){removeItem(items.find(i=>i.kind==='doll'&&i.id===id).uid);trayDone();return;}
    if(w==='out'){trayDone();if(typeof stayTap==='function')stayTap();return;}
    if(w==='trip'){trayDone();if(typeof tvNoteTap==='function')tvNoteTap(id);return;}   // 去旅行了（js/travel.js）
    if(w){const o=home[w].items.find(i=>i.kind==='doll'&&i.id===id);removeItem(o.uid,home[w].items);}
    const it={uid:uid++,kind:'doll',id,x:50,y:92,sit:null,seat:0};[it.x,it.y]=freeSpot(it);items.push(it);render();trayDone(it.uid);}
  else if(t.dataset.furn){const id=t.dataset.furn;if(!FURN_OWN[id]){toast(trayHow('furn',id)[1]);return;}
    const ex=items.find(i=>i.kind==='furn'&&i.id===id);if(ex){removeItem(ex.uid);trayDone();return;}
    const f=FURN[id];if(roomId==='yard'&&f.wall){toast('掛在牆上的不能帶去小島，小島沒有牆壁');return;}
    const w=whereFurn(id);if(w){removeItem(home[w].items.find(i=>i.kind==='furn'&&i.id===id).uid,home[w].items);toast(`從${(typeof ROOM_LABEL!=='undefined'&&ROOM_LABEL[w])||'別間'}搬過來了`);}
    const it={uid:uid++,kind:'furn',id,x:50,y:f.wall?28:82,sit:null,seat:0};
    if(!f.wall&&!f.floor)[it.x,it.y]=freeSpot(it);items.push(it);render();trayDone(it.uid);}
  else if(t.dataset.wall){if(!WALL_OWN[t.dataset.wall]){toast(trayHow('wall',t.dataset.wall)[1]);return;}cur().wall=t.dataset.wall;paintRoom();renderTray();trayDone();}
  else if(t.dataset.floor){if(!FLOOR_OWN[t.dataset.floor]){toast(trayHow('floor',t.dataset.floor)[1]);return;}cur().floor=t.dataset.floor;paintRoom();renderTray();trayDone();}
});
// 收起來；有剛擺進房間的那一件就讓它閃一下，讓人知道它在哪
function trayDone(u){
  if(trayState==='f')trayTo('c');
  if(u===undefined)return;
  setTimeout(()=>{const el=room.querySelector(`.it[data-u="${u}"]`);if(!el)return;el.classList.remove('pop','placed-flash');void el.offsetWidth;el.classList.add('placed-flash');setTimeout(()=>el.classList.remove('placed-flash'),1800);},120);
}
document.querySelectorAll('.tab[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;renderTray();if(trayState==='c')trayTo('f');}));
/* 收納架是可以上下拖的抽屜，兩段（2026-11-27 改，原本三段，使用者選了「點一下全開」）：
   - 收著（c，預設，重開遊戲也是收著）：只剩把手和分頁列。
   - 全開（f）：往上蓋到上面那幾排按鈕下面，裡面自己上下捲。
   點把手、往上拖、點分頁、#trayOpen、furnGo 打開；點把手、往下拖、點房間空白處、選了東西（trayDone）收起。
   以前記在這台裝置的高度不再用：記過 h 或 f 的一律當成收著（js/main.js）。
   房間的大小照「收著」排，打開收起都不重排房間：全開是浮在房間上面的，抽屜收著時佔的位置用 #traySpace 墊著。 */
const TRAY_KEY='shubingNest.trayMin';
let trayState='c',trayKeep=false;
const traySpace=document.createElement('div');traySpace.id='traySpace';traySpace.hidden=true;tray.after(traySpace);
// 全開要量的：收著時抽屜佔多高（墊在原位），和上面那幾排按鈕的下緣（全開蓋到那裡）。只量、不重排房間
function trayFit(){
  const full=tray.classList.contains('full');
  if(full){tray.classList.remove('full');tray.classList.add('min');}
  const cs=getComputedStyle(tray);
  traySpace.style.height=(tray.offsetHeight+parseFloat(cs.marginTop)+parseFloat(cs.marginBottom))+'px';
  if(full){tray.classList.add('full');tray.classList.remove('min');}
  const page=tray.offsetParent||tray.parentNode,pr=page.getBoundingClientRect(),hud=document.getElementById('hud'),top=document.querySelector('.top');
  const edge=Math.max(hud?hud.getBoundingClientRect().bottom:0,top?top.getBoundingClientRect().bottom:0);
  tray.style.setProperty('--tray-top',Math.max(60,Math.round(edge-pr.top+8))+'px');
}
let trayLaid=false;
function trayTo(st){
  st=st==='f'?'f':'c';
  if(st==='f'&&trayState!=='f'){tray.classList.add('min');trayFit();}
  trayState=st;
  tray.classList.toggle('min',st==='c');tray.classList.toggle('full',st==='f');
  traySpace.hidden=st!=='f';
  tray.dataset.st=st;
  const gp=$('#grip');if(gp)gp.setAttribute('aria-label',st==='c'?'收納架收著，點一下打開':'收納架全開，點一下收起');
  // 收著和全開時房間的位置一樣，不用重排；只有第一次（從載入時的樣子變成收著）排一次
  if(!trayLaid&&typeof layout==='function'&&typeof RATIO!=='undefined'){trayLaid=true;try{layout();}catch(e){}}
}
// 舊的叫法還有人用：setTray(true) 收起、setTray(false) 打開
function setTray(min){trayTo(min?'c':'f');}
// 把手：往上拖打開、往下拖收起，沒什麼動就當作點一下、開關切換
let gripY=null;
$('#grip').addEventListener('pointerdown',e=>{gripY=e.clientY;try{$('#grip').setPointerCapture(e.pointerId);}catch(x){}});
$('#grip').addEventListener('pointerup',e=>{
  if(gripY===null)return;const dy=e.clientY-gripY;gripY=null;
  if(Math.abs(dy)<12)trayTo(trayState==='f'?'c':'f');else trayTo(dy<0?'f':'c');
});
$('#grip').addEventListener('pointercancel',()=>{gripY=null;});
$('#grip').addEventListener('click',e=>{if(!e.detail)trayTo(trayState==='f'?'c':'f');});   // 鍵盤按的
$('#trayOpen').addEventListener('click',()=>trayTo('f'));
// 點房間空白的地方收起來（家具、娃娃、門、背包、地上的東西這些可以點的不算）
room.addEventListener('click',e=>{
  if(trayState!=='f'||VISIT)return;
  if(e.target.closest('.it,.gst,.rv,.drop,.fx,button,a,.tvx,.seat,[data-go]'))return;
  trayTo('c');
});
const trayRefit=()=>{if(trayState==='f')trayFit();};
addEventListener('resize',trayRefit);
addEventListener('load',()=>setTimeout(trayRefit,60));   // 上面那幾排按鈕是後面的檔案才排好的，全部載完再量一次

/* ---------- 雲朵系列 ---------- */
const SET=CLOUD_SET;
const X='<button class="x" aria-label="關閉"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>';
function renderSet(){$('#setdots').innerHTML=SET.map(id=>`<i class="${FURN_OWN[id]?'on':''}"></i>`).join('');}
function openSheet(html){const s=$('#sheet');if(typeof trayState!=='undefined'&&trayState==='f'&&!trayKeep)try{trayTo('c');}catch(e){}s.innerHTML=X+html;s.hidden=false;s.querySelector('.x').onclick=()=>s.hidden=true;return s;}
$('#setb').addEventListener('click',()=>{
  openSheet(`<div class="hd"><span class="cl"></span>${SET.filter(i=>FURN_OWN[i]).length} / ${SET.length}</div>
  <div class="row">${SET.map(id=>`<div class="tile ${FURN_OWN[id]?'':'lock'}">${furnSVG(id)}${FURN_OWN[id]?'':LOCK}</div>`).join('')}</div>
  <div class="rw"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 9h18v12H3z" fill="#ffd75e" stroke="#d99a00" stroke-width="1.6"/><path d="M2 6h20v4H2z" fill="#ffe58f" stroke="#d99a00" stroke-width="1.6"/><path d="M12 6v15" stroke="#ff6fb0" stroke-width="3"/></svg><span class="sw f-cloud"></span></div>`);
});

/* ---------- 房子、窗戶、夜晚 ---------- */
function isNight(){if(VISIT&&typeof VISIT.night==='boolean')return VISIT.night;const h=new Date().getHours();return h>=19||h<5;}   // 看明信片時照拍的那一刻（js/card.js）
function winSVG(night){
  const sky=typeof skyWin==='function'?skyWin():null;   // 天色和天氣（js/sky.js）
  return `<svg viewBox="0 0 80 62"><rect x="3" y="3" width="74" height="56" rx="14" fill="#fff" stroke="#e9dff2" stroke-width="2"/>
  <rect x="9" y="9" width="62" height="44" rx="9" fill="${sky?sky.bg:night?'#2f3478':'#aee0ff'}"/>
  ${sky?sky.inner:night?'<circle cx="54" cy="22" r="8" fill="#fff3b0"/><circle cx="58" cy="19" r="7" fill="#2f3478"/><g fill="#fff"><circle cx="20" cy="18" r="1.3"/><circle cx="32" cy="30" r="1"/><circle cx="24" cy="40" r="1.2"/><circle cx="46" cy="42" r="1"/></g>'
  :'<circle cx="58" cy="20" r="6" fill="#ffd75e"/><path d="M16 40c-5 0-6-7-1-8 1-6 9-7 12-3 5-2 11 2 10 7 4 1 3 6-1 6z" fill="#fff"/>'}
  ${typeof winSeason==='function'?winSeason(night):''}
  <path d="M40 9v44M9 31h62" stroke="#fff" stroke-width="4"/>
  <path d="M6 6c10 6 14 18 12 40-6 1-10-1-12-4z" fill="#ffc2dc" opacity=".9"/><path d="M74 6c-10 6-14 18-12 40 6 1 10-1 12-4z" fill="#ffc2dc" opacity=".9"/></svg>`;
}
function paintRoom(){
  const night=isNight();
  $('#wall').className='wall w-'+cur().wall;$('#floor').className='floor f-'+cur().floor;
  room.dataset.rid=roomId;   // 閣樓的斜屋頂、圓天窗看這個（css）
  if(typeof fixPaint==='function')fixPaint();   // 每一間固定的樣子和通往隔壁的門口（js/rooms.js）
  $('#win').innerHTML=winSVG(night);
  screen.classList.toggle('night',night);
  if(typeof skyPaint==='function')skyPaint();
  paintLight();
  layout();
}
/* 開燈關燈：每個房間各記各的，沒記過就是開著 */
const lightOn=()=>cur().light!==false;
function paintLight(){
  const on=lightOn(),b=$('#lsw');
  room.classList.toggle('off',!on);
  b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'關燈':'開燈');
}
$('#lsw').addEventListener('click',()=>{if(VISIT)return;cur().light=!lightOn();paintLight();save();});
// 房間直接鋪滿房間頁的空間；太扁或太長時才留邊
// 房間的寬高比：最瘦 1:2，最寬可以比正方形再寬一點（1.18:1）。矮的手機上收納架開著時房間會比較扁，讓它扁一點把寬度用滿，不要兩邊留空
function fitStage(W,H){const ratio=Math.max(.5,Math.min(1.18,W/H));const w=Math.min(W,H*ratio);return [w,w/ratio,ratio];}
function layout(){
  const r=area.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const [w,h,ratio]=fitStage(r.width,r.height);
  // 房間一律照收納架收著時排（全開是浮在上面的）。牆的高度跟以前收納架開一半時一樣：那時房間大約是寬:高 0.74，
  // 牆佔 52%；現在房間比較長，牆照那個高度算，多出來的給地板。以前三段時要先打開量一次，現在照寬度算就好
  const wall=Math.min(.52,.52*Math.min(h,w/.74)/h);
  stage.style.width=w+'px';stage.style.height=h+'px';
  room.style.setProperty('--wh',(wall*100)+'%');
  if(Math.abs(ratio-RATIO)>.001||Math.abs(wall-WALL)>.001){
    RATIO=ratio;WALL=wall;
    if(items.length)render();
    if(typeof yardPaint==='function')yardPaint();   // 小島地上的東西是照牆高算位置的，比例變了要重畫
  }
}
new ResizeObserver(layout).observe(area);
// 手機（尤其是加到主畫面的）剛打開的頭一兩秒，畫面高度會再變一次；轉方向、字型載完也會。這幾個時候都重排一次，
// 房間才不會用錯的高度排（2026-11-27 使用者說每次打開房間會變形）。排的結果一樣就什麼都不動，不會閃
{
  const again=()=>{try{layout();}catch(e){}};
  if(window.visualViewport)visualViewport.addEventListener('resize',again);
  addEventListener('orientationchange',()=>setTimeout(again,250));
  addEventListener('pageshow',again);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(again);
  [400,1200,2500].forEach(ms=>setTimeout(again,ms));
}
setInterval(()=>{if(isNight()!==screen.classList.contains('night')||(typeof skyKey==='function'&&screen.dataset.sky!==skyKey()))paintRoom();if(typeof skyRainWater==='function')skyRainWater();},60000);

/* 換房間 */
function renderNav(){
  const yd=typeof yardOn!=='undefined'&&yardOn;
  const ids=roomList();
  // 現在這一間的那顆變寬、圖示旁邊寫名字（.nm 只有 .on 才顯示）；其他間只有圖示
  // 最左邊的小房子：小屋地圖（js/rooms.js）
  $('#nav').innerHTML=`${typeof mapOpen==='function'?`<button class="rmap" aria-label="小屋地圖">${typeof MAP_ICON!=='undefined'?MAP_ICON:HOUSE}</button>`:''}<div class="rnav">${ids.map(r=>`<button data-r="${r}" class="${(yd?r==='yard':r===roomId)?'on':''}" aria-label="${(typeof ROOM_LABEL!=='undefined'?ROOM_LABEL:{living:'客廳',bed:'臥室',bath:'浴室',yard:'門外小島'})[r]}">${ICON[r]}<span class="nm">${ROOM_SHORT[r]||''}</span></button>`).join('')}</div>`;
  const rn=$('#nav .rnav'),on=$('#nav .on');if(rn&&on&&rn.scrollWidth>rn.clientWidth)rn.scrollLeft=on.offsetLeft-rn.offsetLeft-rn.clientWidth/2+on.offsetWidth/2;   // 房間多的時候，讓現在這間留在看得到的地方
}
function slide(dir,swap){
  // 換房間出錯（例如存檔裡某一筆畫不出來）也要把畫面淡回來，不能停在透明；錯誤記到 console
  const run=()=>{try{swap();}catch(e){console.error('[room] 換房間時出錯',e);}};
  if(REDUCE){run();return;}
  // 連點時先把還在跑的動畫收掉，不然會疊在一起
  stage.getAnimations().forEach(a=>a.cancel());
  const out=stage.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-dir*16}%)`,opacity:0}],{duration:170,easing:'ease-in',fill:'forwards'});
  out.onfinish=()=>{
    run();
    // 淡出停在透明，要取消掉，淡入播完才會留在看得到的狀態
    out.cancel();
    stage.animate([{transform:`translateX(${dir*16}%)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:260,easing:'ease-out'});
  };
}
function load(){
  if(VISIT&&typeof yardOn!=='undefined'&&yardOn)yardClose();
  items=cur().items;quiet=true;
  room.querySelectorAll('.it,.drop,.say').forEach(e=>e.remove());
  $('#sheet').hidden=true;
  try{paintRoom();render();}finally{renderNav();quiet=false;}
}
// goingTo：正在切過去、還沒換好的房間。連點時用它判斷，不然點回原房間會被略過
let goingTo=null;
function goRoom(r){
  const from=goingTo??roomId;if(r===from)return;const d=RIDS.indexOf(r)>RIDS.indexOf(from)?1:-1;goingTo=r;slide(d,()=>{roomId=r;goingTo=null;load();});renderNavTo(r);roomSign(r);}
function renderNavTo(r){const rn=$('#nav .rnav');document.querySelectorAll('.rnav button').forEach(b=>{const on=b.dataset.r===r;b.classList.toggle('on',on);if(on&&rn&&rn.scrollWidth>rn.clientWidth)rn.scrollLeft=b.offsetLeft-rn.offsetLeft-rn.clientWidth/2+b.offsetWidth/2;});}
// 切換鈕上寫的短名字，和換房間時上方中間跳出來的小牌子（一秒後淡掉）
const ROOM_SHORT={living:'客廳',bed:'臥室',bath:'浴室',kitchen:'廚房',attic:'閣樓',yard:'小島'};
let signT=0;
function roomSign(r){
  let el=$('#rsign');
  if(!el){el=document.createElement('div');el.id='rsign';el.className='rsign';el.setAttribute('aria-hidden','true');screen.appendChild(el);}
  el.innerHTML=`${ICON[r]||''}<span>${(typeof ROOM_LABEL!=='undefined'&&ROOM_LABEL[r])||ROOM_SHORT[r]||''}</span>`;
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  clearTimeout(signT);signT=setTimeout(()=>el.classList.remove('on'),1100);
}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button[data-r]');if(b)goRoom(b.dataset.r);});
let toastT;function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),1400);}

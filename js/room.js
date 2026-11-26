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
function syncSeated(){items.forEach(d=>{if(d.kind==='doll'&&d.sit){const f=items.find(o=>o.uid===d.sit);if(!f){d.sit=null;return;}const [x,y]=seatPos(f,d.seat);d.x=x;d.y=y+.5;}});}
function zOf(it){
  if(it.kind==='furn'){const f=FURN[it.id];if(f.floor)return 6;if(f.wall)return 8;return 20+Math.round(it.y*3);}
  if(it.sit){const f=items.find(o=>o.uid===it.sit);return zOf(f)+1+it.seat;}
  return 20+Math.round(it.y*3)+1;
}

let quiet=false;
/* 存檔裡有這一版不認得的家具或娃娃（比較新的版本擺的，或定義沒載到）：先從房間裡拿開，不畫，
   免得一樣東西讓整個畫面畫不出來、後面的娃娃機和每天的幣都跟著沒跑（2026-11-27 的事故）。
   那一筆不會不見：存檔的時候照樣寫回去（房間的 toJSON），之後這一版認得了就會回來。js/main.js 開始時叫一次。 */
function roomQuarantine(){
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
function elFor(it){
  let el=room.querySelector(`.it[data-u="${it.uid}"]`);
  if(!el){
    el=document.createElement('div');el.className='it';el.dataset.u=it.uid;
    if(it.kind==='doll'){el.classList.add('doll');el.innerHTML=`<span class="body">${dollPic(it.id,VISIT?(VISIT.look[it.id]||{}):undefined)}</span>`;}
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
    const el=elFor(it);const [w]=sizeOf(it);
    el.style.left=it.x+'%';el.style.top=roomY(it.y)+'%';el.style.width=w+'%';el.style.zIndex=zOf(it);
    if(it.kind==='doll'){
      el.classList.toggle('sit',!!it.sit);el.classList.toggle('breathe',!it.sit);
      el.querySelector('.body').style.animationDelay=(-(it.uid*0.7)%3.2)+'s';
    }
  });
  renderGlow();
  if(!VISIT){renderTray();renderSet();afterRender();}else if(typeof paintSleep==='function')paintSleep();
}
function renderGlow(){
  room.querySelectorAll('.glow').forEach(g=>g.remove());
  items.filter(i=>i.kind==='furn'&&FURN[i.id].glow).forEach(l=>{
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
      if(items.some(o=>o!==d&&o.sit===f.uid&&o.seat===k))return;
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
   - 家具：只列這一間的（小島是戶外家具），分三組：可以坐的躺的、擺著的、牆上和地上的。每組裡剛拿到的（新）最前面、已經擺出來的排後面。
   - 紀念品：旅行的土產和節日的東西，每一間都能擺；擺在別間的標房間，點了搬過來。
   收起來還是展開不存檔，重新整理就收回去。 */
const trayMore={doll:false,furn:false,deco:false,keep:false};
const TRAY_SEASON={lny:'過年',spring:'春天',summer:'夏天',moon:'中秋',hallo:'萬聖節',winter:'冬天',anniv:'週年'};
// 還沒有的東西怎麼拿：格子裡的短字、點了的提示
function trayHow(kind,id){
  if(kind==='doll')return ['娃娃機','娃娃機夾得到'];
  if(kind==='wall'){const g=typeof GIFT_WALL!=='undefined'&&GIFT_WALL[id];return g?['湊齊系列',g]:['娃娃機・小店','娃娃機夾得到，小店也買得到'];}
  if(kind==='floor'){const g=typeof GIFT_FLOOR!=='undefined'&&GIFT_FLOOR[id];return g?['湊齊系列',g]:['小店','火腿的小店買得到'];}
  const f=FURN[id]||{};
  if(f.souv){const sv=typeof TV_SOUV!=='undefined'&&TV_SOUV[id.replace(/^tvs_/,'')],pl=sv&&typeof TV_PLACES!=='undefined'&&TV_PLACES[sv.from];const n=pl?pl.name.replace('山上的',''):'旅行';return [n,`娃娃去${pl?pl.name:'旅行'}會帶回來`];}
  if(f.season){const n=TRAY_SEASON[f.season]||'節日';return [n,`${n}的時候會出現在這裡`];}
  if(f.gift){const sr=typeof FURN_SERIES!=='undefined'?Object.values(FURN_SERIES).find(x=>x.gift&&x.gift.kind==='furn'&&x.gift.id===id):null;return ['湊齊系列',sr?`湊齊${sr.name}送你`:'湊齊一個系列送你'];}
  return ['娃娃機・小店','娃娃機夾得到，小店也買得到'];
}
/* 家具系列的進度（原本是右上角一顆「雲朵＋五個點」，使用者看不懂，2026-11-27 改成字）：
   家具那一頁最上面，還沒湊齊的系列各一行「雲朵系列 3/5，湊齊送雲朵地板」，點了展開看缺哪幾件（缺的是剪影，寫怎麼拿）。
   全部的系列另外有一頁（seriesOpen，小窩指南和那一行旁邊都進得去）。 */
function seriesAll(){
  const L=[{k:'cloud',name:'雲朵系列',ids:CLOUD_SET,gift:'雲朵地板'}];
  if(typeof FURN_SERIES!=='undefined')Object.entries(FURN_SERIES).forEach(([k,s])=>L.push({k,name:s.name,ids:s.ids,gift:s.gift?s.gift.name:''}));
  return L.filter(s=>Array.isArray(s.ids)&&s.ids.length&&s.ids.every(id=>FURN[id]));
}
const seriesHave=s=>s.ids.filter(id=>FURN_OWN[id]).length;
const seriesTile=id=>FURN_OWN[id]?`<span class="tile">${furnSVG(id)}</span>`:`<span class="tile lock" aria-label="${furnName(id)}，還沒有">${furnSVG(id)}<small class="how">${trayHow('furn',id)[0]}</small></span>`;
const traySetOpen={};
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
    const ids=(ROOM_FURN[roomId]||[]).filter(id=>FURN[id]&&!FURN[id].season&&!FURN[id].souv);
    const placed=id=>items.some(i=>i.kind==='furn'&&i.id===id);
    const tile=id=>`<button class="tile ${placed(id)?'placed':''}" data-furn="${id}" aria-label="${furnName(id)}${nw.includes(id)&&!placed(id)?'，新的':''}">${furnSVG(id)}${placed(id)?CK:''}${!placed(id)&&nw.includes(id)?'<span class="nw">新</span>':''}</button>`;
    const order=l=>l.map((id,i)=>[id,i]).sort((a,b)=>{const ra=placed(a[0])?2:nw.includes(a[0])?0:1,rb=placed(b[0])?2:nw.includes(b[0])?0:1;return ra-rb||a[1]-b[1];}).map(x=>x[0]);
    const own=ids.filter(id=>FURN_OWN[id]);
    // 跟這一間有關、還沒湊齊的系列：一行字，點了展開看缺哪幾件
    seriesAll().filter(s=>s.ids.some(id=>ids.includes(id))&&seriesHave(s)<s.ids.length).forEach(s=>{
      const open=!!traySetOpen[s.k];
      h+=`<button class="tray-set ${open?'on':''}" data-trayset="${s.k}" aria-expanded="${open}"><b>${s.name} ${seriesHave(s)}/${s.ids.length}</b>${s.gift?`<span>湊齊送${s.gift}</span>`:''}<i>${open?'收起來':'缺哪幾件'}</i></button>`;
      if(open)h+=s.ids.filter(id=>!FURN_OWN[id]).map(seriesTile).join('')+`<button class="tray-setall" data-trayset="all">看全部的系列</button>`;
    });
    [['可以坐的躺的',id=>!!FURN[id].seats],['擺著的',id=>!FURN[id].seats&&!FURN[id].wall&&!FURN[id].floor],['牆上和地上的',id=>!FURN[id].seats&&(FURN[id].wall||FURN[id].floor)]].forEach(([name,is])=>{
      const l=order(own.filter(is));if(l.length)h+=trayGrp(name)+l.map(tile).join('');});
    if(!own.length)h+='<p class="al-em tray-em">這一間的家具還沒有。娃娃機夾得到，火腿的小店也有賣。</p>';
    h+=trayLocked(ids.filter(id=>!FURN_OWN[id]),id=>`<button class="tile lock" data-furn="${id}" aria-label="${furnName(id)}，還沒有，${trayHow('furn',id)[1]}">${furnSVG(id)}<small class="how">${trayHow('furn',id)[0]}</small></button>`);
  } else if(tab==='keep'){
    // 紀念品：旅行的土產、節日的東西。有了才列在上面；每一間都能擺
    const all=Object.keys(FURN).filter(id=>FURN[id].souv||FURN[id].season),own=all.filter(id=>FURN_OWN[id]);
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
  if(typeof trayFit==='function'&&trayState!=='c')trayFit();
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
// 這件家具是哪一間用的：房間切換鈕同一個圖示加房間名。季節家具每一間都能擺
function furnRoomTag(id){
  const f=FURN[id];if(!f)return '';
  if(f.season)return '<span class="rm-tag">每一間都能擺</span>';
  const n=(typeof ROOM_LABEL!=='undefined'?ROOM_LABEL:{living:'客廳',bed:'臥室',bath:'浴室'})[f.room]||'';
  return `<span class="rm-tag">${ICON[f.room]||''}${n}</span>`;
}
// 去擺：切到那一間、打開收納架的家具分頁、捲到那一件並閃一下
function furnGo(id){
  const f=FURN[id];if(!f||VISIT)return;
  const r=f.season?roomId:f.room;
  if(!home[r]){toast(`這件是${(typeof ROOM_LABEL!=='undefined'&&ROOM_LABEL[r])||'別間'}用的，要先在小店買那一間`);return;}
  $('#sheet').hidden=true;
  if(typeof setPage==='function')setPage('room');
  const show=()=>{
    setTray(false);tab=FURN[id]&&(FURN[id].souv||FURN[id].season)?'keep':'furn';renderTray();if(typeof layout==='function')layout();
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
  const ts=e.target.closest('[data-trayset]');if(ts){if(ts.dataset.trayset==='all')seriesOpen();else{traySetOpen[ts.dataset.trayset]=!traySetOpen[ts.dataset.trayset];renderTray();}return;}
  const n0=items.length;setTimeout(()=>{if(trayState==='f'&&items.length>n0)trayTo('h',true);},0);   // 全開時擺了東西進房間：抽屜降到一半，讓出房間
  const t=e.target.closest('.tile');if(!t)return;
  if(t.dataset.doll){const id=t.dataset.doll;if(!DOLL_N[id]){toast('還沒來，'+trayHow('doll',id)[1]);return;}
    const w=whereDoll(id);
    if(w===roomId){removeItem(items.find(i=>i.kind==='doll'&&i.id===id).uid);return;}
    if(w==='out'){if(typeof stayTap==='function')stayTap();return;}
    if(w==='trip'){if(typeof tvNoteTap==='function')tvNoteTap(id);return;}   // 去旅行了（js/travel.js）
    if(w){const o=home[w].items.find(i=>i.kind==='doll'&&i.id===id);removeItem(o.uid,home[w].items);}
    const it={uid:uid++,kind:'doll',id,x:50,y:92,sit:null,seat:0};[it.x,it.y]=freeSpot(it);items.push(it);render();}
  else if(t.dataset.furn){const id=t.dataset.furn;if(!FURN_OWN[id]){toast(trayHow('furn',id)[1]);return;}
    const ex=items.find(i=>i.kind==='furn'&&i.id===id);if(ex){removeItem(ex.uid);return;}
    const w=whereFurn(id);if(w){removeItem(home[w].items.find(i=>i.kind==='furn'&&i.id===id).uid,home[w].items);}
    const f=FURN[id];const it={uid:uid++,kind:'furn',id,x:50,y:f.wall?28:82,sit:null,seat:0};
    if(!f.wall&&!f.floor)[it.x,it.y]=freeSpot(it);items.push(it);render();}
  else if(t.dataset.wall){if(!WALL_OWN[t.dataset.wall]){toast(trayHow('wall',t.dataset.wall)[1]);return;}cur().wall=t.dataset.wall;paintRoom();renderTray();}
  else if(t.dataset.floor){if(!FLOOR_OWN[t.dataset.floor]){toast(trayHow('floor',t.dataset.floor)[1]);return;}cur().floor=t.dataset.floor;paintRoom();renderTray();}
});
document.querySelectorAll('.tab[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;renderTray();if(trayState==='c')trayTo('h');}));
/* 收納架是一個可以上下拖的抽屜，三段高度（2026-11-27，使用者的 iPhone 上第二排被切掉、很難用）：
   - 收起（c）：只剩把手和分頁列。
   - 一半（h，預設）：完整露出兩排。
   - 全開（f）：往上蓋到上面那幾排按鈕下面，裡面自己上下捲，一次看得到很多格。
   拖把手在三段之間換（放開時照拖的方向和距離決定），點把手輪流切；點分頁時如果是收著的就打開到一半。
   記住上次的高度，只記在這台裝置（個人設定，不上雲端）。
   全開時是浮在房間上面的（不擠房間）：抽屜原本佔的位置用 #traySpace 墊著，房間的大小跟「一半」時一樣，不會跟著跳。
   全開時點一格把東西擺進房間，抽屜會自己降到一半讓出房間。 */
const TRAY_KEY='shubingNest.trayMin';
let trayState='h';
const traySpace=document.createElement('div');traySpace.id='traySpace';traySpace.hidden=true;tray.after(traySpace);
// 「一半」的高度：剛好兩排格子（照現在格子的大小算），加上上面一行小標題的位置
function trayFit(){
  const box=$('#items'),t=box.querySelector('.tile'),g=box.querySelector('.grp');
  const th=t?t.offsetHeight:Math.round((box.clientWidth-20-24)/4)||80;
  box.style.setProperty('--tray-two',(th*2+8+(g?g.offsetHeight+8:0)+22)+'px');
}
function trayTo(st,keep){
  if(!['c','h','f'].includes(st))st='h';
  const was=trayState;
  if(st==='f'&&was!=='f'){
    // 先量「一半」時抽屜佔多高，墊在原位；再量上面那幾排按鈕的下緣，全開就蓋到那裡
    tray.classList.remove('min','full');trayFit();
    const cs=getComputedStyle(tray);
    traySpace.style.height=(tray.offsetHeight+parseFloat(cs.marginTop)+parseFloat(cs.marginBottom))+'px';
    const page=tray.offsetParent||tray.parentNode,pr=page.getBoundingClientRect(),hud=document.getElementById('hud'),top=document.querySelector('.top');
    const edge=Math.max(hud?hud.getBoundingClientRect().bottom:0,top?top.getBoundingClientRect().bottom:0);
    tray.style.setProperty('--tray-top',Math.max(60,Math.round(edge-pr.top+8))+'px');
  }
  trayState=st;
  tray.classList.toggle('min',st==='c');tray.classList.toggle('full',st==='f');
  traySpace.hidden=st!=='f';
  tray.dataset.st=st;
  const gp=$('#grip');if(gp)gp.setAttribute('aria-label',st==='c'?'收納架收著，點一下打開':st==='h'?'收納架開一半，點一下全開':'收納架全開，點一下收起');
  if(st!=='c')trayFit();
  if(!keep)try{localStorage.setItem(TRAY_KEY,st);}catch(e){}
  if(typeof layout==='function'&&typeof RATIO!=='undefined')try{layout();}catch(e){}
}
// 舊的叫法還有人用：setTray(true) 收起、setTray(false) 打開（已經開著就不動）
function setTray(min){if(min)trayTo('c');else if(trayState==='c')trayTo('h');}
// 把手：往上拖開大一段、往下拖收一段（拖得遠就跳兩段），沒什麼動就當作點一下、輪流切
let gripY=null;
$('#grip').addEventListener('pointerdown',e=>{gripY=e.clientY;try{$('#grip').setPointerCapture(e.pointerId);}catch(x){}});
$('#grip').addEventListener('pointerup',e=>{
  if(gripY===null)return;const dy=e.clientY-gripY;gripY=null;
  const order=['c','h','f'],i=order.indexOf(trayState);
  if(Math.abs(dy)<12)trayTo(order[(i+1)%3]);
  else trayTo(order[Math.max(0,Math.min(2,i+(dy<0?1:-1)*(Math.abs(dy)>200?2:1)))]);
});
$('#grip').addEventListener('pointercancel',()=>{gripY=null;});
$('#grip').addEventListener('click',e=>{if(!e.detail){const order=['c','h','f'];trayTo(order[(order.indexOf(trayState)+1)%3]);}});   // 鍵盤按的
$('#trayOpen').addEventListener('click',()=>trayTo('h'));
const trayRefit=()=>{if(trayState==='f'){trayState='h';trayTo('f',true);}else if(trayState==='h')trayFit();};
addEventListener('resize',trayRefit);
addEventListener('load',()=>setTimeout(trayRefit,60));   // 上面那幾排按鈕是後面的檔案才排好的，全部載完再量一次

/* ---------- 雲朵系列 ---------- */
const SET=CLOUD_SET;
const X='<button class="x" aria-label="關閉"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>';
function renderSet(){$('#setdots').innerHTML=SET.map(id=>`<i class="${FURN_OWN[id]?'on':''}"></i>`).join('');}
function openSheet(html){const s=$('#sheet');s.innerHTML=X+html;s.hidden=false;s.querySelector('.x').onclick=()=>s.hidden=true;return s;}
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
function fitStage(W,H){const ratio=Math.max(.5,Math.min(1,W/H));const w=Math.min(W,H*ratio);return [w,w/ratio,ratio];}
function layout(){
  const r=area.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const [w,h,ratio]=fitStage(r.width,r.height);
  // 牆的高度用收納架打開時的牆高：收著的時候先打開量一下房間有多高，再收回去（同一刻做完，畫面不會閃）
  let oh=h;
  if(tray.classList.contains('min')){tray.classList.remove('min');const o=area.getBoundingClientRect();tray.classList.add('min');if(o.height)oh=fitStage(o.width,o.height)[1];}
  const wall=Math.min(.52,.52*oh/h);
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
  if(REDUCE){swap();return;}
  // 連點時先把還在跑的動畫收掉，不然會疊在一起
  stage.getAnimations().forEach(a=>a.cancel());
  const out=stage.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-dir*16}%)`,opacity:0}],{duration:170,easing:'ease-in',fill:'forwards'});
  out.onfinish=()=>{
    swap();
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
  paintRoom();render();renderNav();quiet=false;
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

/* 薯餅的小窩：家具等級和來源（CL-03，2026-11-28）
   等級只管扭蛋裡的家具：普通 n、特別 s、稀有 r。扭蛋生成時就固定等級和內容（js/claw.js）。
   來源是另外一回事：專屬（娃娃的專屬家具，照舊可夾可買，扭蛋裡算特別）、集齊、節日、旅行不進三個等級的池子。
   新增家具時：要放進扭蛋，就在 GRADE_IDS 裡選一級；沒寫的、可夾的家具一律算普通。 */
const GRADE_IDS = {
  r: ['bed','cakecab','minitent','boatbed','rocketbed','traincab','raincoatrack'],   // 每個系列一件代表
  s: ['rug','eggchair','frame','puddingtable','wafflerug','picnicmat','deckchair','parasol','moonchair','telescope',
      'capsulecab','rockhorse','ferrislamp','popcorn','ticketbooth','umbrellalamp','rainbowrug',
      // 專屬家具（js/furn2.js 的 dollset）
      'hammock','beanbag','sliprack','trampoline','snackcab','cavetent','writedesk','podium'],
};
const GRADE = {
  n: { name: '普通', star: 1, w: 70, sub: 3 },   // sub：這一級新家具都拿完了，扭蛋換成幾枚幣
  s: { name: '特別', star: 2, w: 25, sub: 5 },
  r: { name: '稀有', star: 3, w: 5,  sub: 0 },   // 稀有拿完就不再生成稀有扭蛋，不換幣、不把別級升上來
};
const GRADE_OF = {};
Object.entries(GRADE_IDS).forEach(([g, ids]) => ids.forEach(id => { GRADE_OF[id] = g; }));
// 夾得到的家具：不是季節的、不是湊齊才送或旅行帶回來的（gift）
const furnClawable = id => !!FURN[id] && !FURN[id].season && !FURN[id].gift;
// 這件家具的等級；不在扭蛋池裡的回 null
const furnGrade = id => furnClawable(id) ? (GRADE_OF[id] || 'n') : null;
// 來源標籤：'專屬'、'集齊'、'節日'、'旅行'；一般系列和單品回 ''
function furnSrc(id){
  const f = FURN[id]; if (!f) return '';
  if (f.season) return '節日';
  if (/^tvs_/.test(id)) return '旅行';
  if (f.gift) return '集齊';
  const ds = typeof FURN_SERIES !== 'undefined' && FURN_SERIES.dollset;
  return ds && ds.ids.includes(id) ? '專屬' : '';
}
// 某一級還沒擁有、可以放進扭蛋的家具
const gradeLeft = g => Object.keys(FURN).filter(id => furnGrade(id) === g && !FURN_OWN[id]);

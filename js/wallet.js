// 跟薯餅蛋蛋島共用的錢包（2026-11-26，使用者說「我要這個遊戲的金幣跟薯餅蛋蛋島的金幣通用」）
// 使用者選的：同一個錢包、1 比 1、兩邊的價錢都不改；帳號不搬，小窩用同樣的名字和密碼自動登入蛋蛋島的帳號。
//
// 錢包放在蛋蛋島的 Firebase 專案 plush-crush：wallets/{蛋蛋島的 uid} = {
//   coins：兩個遊戲共用的幣
//   egg：{e, p}  蛋蛋島已經算進錢包的造型幣：e 賺到的總數（三星＋寶箱）、p 兌換掉的總數。兩個都只會變多（蛋蛋島 js/cloud.js walletEgg）
//   nest：{小窩的 uid: 1}  哪幾個小窩帳號已經把原本的幣放進來過（同一個帳號換裝置不會再放一次）
//   t：最後一次改的時間
// }
// 小窩這邊：S.coins 照舊是畫面上的數字，所有花幣、賺幣的地方都不用改。
//   S.earn.wb = 上次跟錢包對上時錢包有多少（base）；S.earn.wu = 那時候連的蛋蛋島 uid
//   對一次（syncNest）：錢包 += S.coins − wb（這段時間在小窩賺的減花的），再把 S.coins 換成錢包的數字。
//   第一次連：小窩原本的幣整筆放進錢包（nest 裡記過這個小窩帳號就不再放）。
//   用 transaction 寫，兩個遊戲同時在改也不會蓋掉對方的。
// 規則（蛋蛋島 repo 的 firestore.rules 的 wallets 那一段）還沒在 plush-crush 主控台發布時，讀寫都會被擋，小窩的幣照舊自己算。
// 說明和主控台步驟：docs/WALLET.md
import { normName } from './cloud.js';

const V = '13.2.0';
const CDN = `https://www.gstatic.com/firebasejs/${V}/`;
// 蛋蛋島 js/cloud.js 的 NAME_DOMAIN。名字換成 email 的算法兩邊一樣，只有網域不同
const EGG_DOMAIN = 'players.plush-crush.firebaseapp.com';
const COINS_MAX = 10000000;

export function normWallet(d) {
  const n = (x, max) => (Number.isInteger(x) ? Math.max(0, Math.min(max, x)) : 0);
  const w = d && typeof d === 'object' ? d : {};
  const egg = w.egg && typeof w.egg === 'object' ? w.egg : {};
  const nest = {};
  if (w.nest && typeof w.nest === 'object') Object.keys(w.nest).slice(0, 20).forEach(k => { nest[k] = 1; });
  return { coins: n(w.coins, COINS_MAX), egg: { e: n(egg.e, COINS_MAX), p: n(egg.p, COINS_MAX) }, nest, t: Number.isInteger(w.t) ? w.t : 0 };
}
// 小窩這邊的一次對帳（純計算，測試用得到）。base = null：這份存檔還沒跟這個錢包對過
export function nestStep(w, nestUid, coinsNow, base) {
  const first = base == null;
  const delta = first ? (w.nest[nestUid] ? 0 : coinsNow) : coinsNow - base;
  const nest = first ? { ...w.nest, [nestUid]: 1 } : w.nest;
  if (Object.keys(nest).length > 20) delete nest[Object.keys(nest)[0]];
  return { ...w, coins: Math.max(0, Math.min(COINS_MAX, w.coins + delta)), nest, delta };
}

// 第二個 Firebase app（名字 'egg'），登入狀態跟小窩的帳號分開記
export function createWallet(config) {
  let A = null, F = null, auth = null, db = null, user = null, isReady = false;
  const ready = (async () => {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-firestore-lite.js'),
    ]);
    A = authMod; F = fsMod;
    const app = appMod.initializeApp(config, 'egg');
    auth = A.initializeAuth(app, { persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence] });
    db = F.getFirestore(app);
    await new Promise(res => {
      let first = true;
      A.onAuthStateChanged(auth, u => { user = u ? { uid: u.uid } : null; if (first) { first = false; res(); } });
    });
    isReady = true;
  })();
  ready.catch(e => console.info('[wallet] 蛋蛋島的雲端載不起來，小窩的幣照舊自己算', e));
  const ref = () => F.doc(db, 'wallets', user.uid);

  return {
    ready,
    get isReady() { return isReady; },
    get user() { return user; },
    // 用蛋蛋島的名字和密碼登入（先登出上一個人，免得連到別人的錢包）
    async link(name, password) {
      await ready;
      const n = normName(name);
      if (n.error) throw Object.assign(new Error(n.error), { code: 'cloud/bad-name' });
      const email = n.email.split('@')[0] + '@' + EGG_DOMAIN;
      await A.signOut(auth).catch(() => {});
      const r = await A.signInWithEmailAndPassword(auth, email, String(password || ''));
      user = { uid: r.user.uid };
      return user;
    },
    async signOut() { if (!isReady) return; user = null; await A.signOut(auth).catch(() => {}); },
    async read() {
      await ready;
      if (!user) throw new Error('not linked');
      const s = await F.getDoc(ref());
      return normWallet(s.exists() ? s.data() : null);
    },
    // 對一次帳，回傳 {coins, delta}：錢包現在有多少、這次小窩放進去（負的 = 拿出來）多少
    async syncNest(nestUid, coinsNow, base, eggUid) {
      await ready;
      if (!user || (eggUid && user.uid !== eggUid)) throw Object.assign(new Error('wallet account changed'), { code: 'wallet/account-changed' });
      const r = ref();
      return F.runTransaction(db, async tx => {
        const s = await tx.get(r);
        const out = nestStep(normWallet(s.exists() ? s.data() : null), nestUid, coinsNow, base);
        const { delta, ...doc } = out;
        tx.set(r, { ...doc, t: Date.now() });
        return { coins: doc.coins, delta };
      });
    },
  };
}

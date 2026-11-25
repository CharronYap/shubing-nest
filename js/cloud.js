// 雲端帳號：Firebase 的帳號名稱＋密碼登入 + Firestore（lite 版，只讀寫幾份文件，沒有即時同步）
// 從薯餅蛋蛋島（毛絨消消樂）的 js/cloud.js 改來的。Firebase 專案是小窩自己的 shubing-nest，帳號和好友不跟蛋蛋島共用：
//   帳號在 Authentication，好友碼和好友名單在 players/{uid}，小窩的存檔在 nestSaves/{uid}。
//
//   const cloud = createCloud(config, { emulator })
//   cloud.ready / cloud.isReady / cloud.user / cloud.onUser(cb)
//   cloud.signInWithName(name, password) / cloud.signUpWithName(name, password) / cloud.signOut()
//   cloud.load()             讀自己的小窩存檔 → 物件或 null
//   cloud.save(data, uid)    寫自己的小窩存檔（整份覆蓋）；目前登入的不是 uid 就不寫
//   cloud.player(uid)        讀一個人的公開資料（players）
//   cloud.ensurePlayer()     還沒有公開資料（第一次登入）就建一份最基本的；已經有就不動
//   cloud.addFriend(uid)     把 uid 加進自己的好友名單（只動 friends 這一欄）
//   cloud.findCode(code) / cloud.addedMe()
//
// SDK 從 Google 的 CDN 載（約 110 KB gzip），只有打開遊戲後才在背景載，不會拖慢開始。

const V = '13.2.0';
const CDN = `https://www.gstatic.com/firebasejs/${V}/`;

// ---------- 帳號名稱 ↔ Firebase 的「email」 ----------
// Firebase 的帳號密碼登入一定要 email，玩家只取名字：名字換成一個不會真的收信的地址（這個網域沒有信箱，Firebase 也不會寄信）。
//   英數字的名字直接放：alice → alice@players.shubing-nest.firebaseapp.com（在 Firebase 後台一眼看得出是誰）
//   其他文字（中文…）轉成 base32：小明 → u.4wyi7z4ymo@players…（「.」不會出現在名字裡，所以分得開）
// 這個網域一改，所有用名字開的帳號都登不進去，所以不要改。
const NAME_DOMAIN = 'players.shubing-nest.firebaseapp.com';
const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
// 名字：2–12 個字，字母（任何語言）、數字、_、-，第一個字要是字母或數字；英文不分大小寫
export function normName(raw) {
  const s = String(raw || '').normalize('NFKC').trim().toLowerCase();
  const n = Array.from(s).length;
  if (n < 2) return { error: '名字至少要 2 個字' };
  if (n > 12) return { error: '名字最多 12 個字' };
  if (!/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(s)) return { error: '名字只能用文字、數字、_ 和 -' };
  let local;
  if (/^[a-z0-9_-]+$/.test(s)) local = s;
  else {
    let bits = 0, val = 0;
    local = 'u.';
    for (const b of new TextEncoder().encode(s)) {
      val = (val << 8) | b; bits += 8;
      while (bits >= 5) { local += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits) local += B32[(val << (5 - bits)) & 31];
  }
  if (local.length > 64) return { error: '名字太長了' };
  return { name: s, email: `${local}@${NAME_DOMAIN}` };
}
export function nameFromEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (domain !== NAME_DOMAIN) return null;
  if (!local.startsWith('u.')) return local;
  const bytes = [];
  let bits = 0, val = 0;
  for (const ch of local.slice(2)) {
    val = (val << 5) | B32.indexOf(ch); bits += 5;
    if (bits >= 8) { bytes.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes)); } catch (e) { return null; }
}

// 好友碼：uid 算出來的 6 個字，去掉容易看錯的 I、O、0、1（firestore.rules 也照這個格式檢查）
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;
export function friendCode(uid) {
  let h = 0x811c9dc5;
  for (const ch of String(uid)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let s = '';
  for (let i = 0; i < 6; i++) { s += CODE_ABC[h & 31]; h >>>= 5; }
  return s;
}

export function createCloud(config, { emulator = false } = {}) {
  let A = null, F = null, auth = null, db = null, user = null, isReady = false;
  const subs = new Set();
  // 名字：用帳號名稱開的 → 那個名字；認不出來（不是遊戲裡開的帳號）→ email 的前半
  const toUser = u => {
    if (!u) return null;
    return { uid: u.uid, name: nameFromEmail(u.email) || (u.email ? u.email.split('@')[0] : '玩家') };
  };

  const ready = (async () => {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-firestore-lite.js'),
    ]);
    A = authMod; F = fsMod;
    const app = appMod.initializeApp(config);
    // 登入狀態記在 IndexedDB（不行就 localStorage）
    auth = A.initializeAuth(app, {
      persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence],
    });
    db = F.getFirestore(app);
    if (emulator) {
      A.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      F.connectFirestoreEmulator(db, '127.0.0.1', 8085);
    }
    // 第一次回報 = 重新整理後恢復的登入狀態
    await new Promise(res => {
      let first = true;
      A.onAuthStateChanged(auth, u => {
        user = toUser(u);
        for (const cb of subs) { try { cb(user); } catch (e) { console.error('[cloud]', e); } }
        if (first) { first = false; res(); }
      });
    });
    isReady = true;
  })();
  ready.catch(e => console.warn('[cloud] 雲端存檔載入失敗（照樣可以玩，存在這台裝置）', e));

  // 小窩的存檔：nestSaves/{uid}（規則裡的 saves 是從蛋蛋島複製來的，小窩不用）
  const ref = () => {
    if (!user) throw new Error('not signed in');
    return F.doc(db, 'nestSaves', user.uid);
  };

  return {
    ready,
    checkName: normName,        // 名字合不合格（送出前先在畫面上提醒）
    get isReady() { return isReady; },
    get user() { return user; },
    onUser(cb) { subs.add(cb); if (isReady) cb(user); return () => subs.delete(cb); },
    signInWithName(name, password) {
      if (!isReady) return Promise.reject(Object.assign(new Error('cloud not ready'), { code: 'cloud/not-ready' }));
      const n = normName(name);
      if (n.error) return Promise.reject(Object.assign(new Error(n.error), { code: 'cloud/bad-name', hint: n.error }));
      return A.signInWithEmailAndPassword(auth, n.email, String(password || '')).then(r => toUser(r.user));
    },
    signUpWithName(name, password) {
      if (!isReady) return Promise.reject(Object.assign(new Error('cloud not ready'), { code: 'cloud/not-ready' }));
      const n = normName(name);
      if (n.error) return Promise.reject(Object.assign(new Error(n.error), { code: 'cloud/bad-name', hint: n.error }));
      return A.createUserWithEmailAndPassword(auth, n.email, String(password || '')).then(r => toUser(r.user));
    },
    signOut() { return isReady ? A.signOut(auth) : Promise.resolve(); },
    async load() {
      await ready;
      const s = await F.getDoc(ref());
      return s.exists() ? s.data() : null;
    },
    // uid：呼叫的人以為現在是誰。登入狀態剛換人、上一個人的存檔還排著要寫的時候，不會寫到下一個人的雲端存檔裡
    async save(data, uid) {
      await ready;
      if (uid && (!user || user.uid !== uid)) throw Object.assign(new Error('account changed'), { code: 'cloud/account-changed' });
      await F.setDoc(ref(), data);
    },
    // ---------- 好友（players/{uid}，只在小窩裡） ----------
    friendCode,
    async player(uid) {
      await ready;
      const s = await F.getDoc(F.doc(db, 'players', uid));
      return s.exists() ? { ...s.data(), uid } : null;
    },
    // 公開資料一定要有 code、name、stars、best（規則從蛋蛋島複製來的，這樣檢查）。已經有一份就不碰
    async ensurePlayer() {
      await ready;
      if (!user) throw new Error('not signed in');
      const r = F.doc(db, 'players', user.uid);
      const s = await F.getDoc(r);
      if (s.exists()) return { ...s.data(), uid: user.uid };
      const data = { code: friendCode(user.uid), name: user.name.slice(0, 24), stars: 0, best: {}, t: Date.now() };
      await F.setDoc(r, data);
      return { ...data, uid: user.uid };
    },
    // 只加進 friends，其他欄位不動
    async addFriend(uid) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.setDoc(F.doc(db, 'players', user.uid), { friends: F.arrayUnion(uid) }, { merge: true });
    },
    async findCode(code) {
      await ready;
      const r = await F.getDocs(F.query(F.collection(db, 'players'), F.where('code', '==', code), F.limit(5)));
      return r.docs.map(d => ({ ...d.data(), uid: d.id }));
    },
    async addedMe() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'players'), F.where('friends', 'array-contains', user.uid), F.limit(50)));
      return r.docs.map(d => ({ ...d.data(), uid: d.id }));
    },
  };
}

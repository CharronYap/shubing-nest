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
//   去朋友家（nestRooms/{uid}，規則發布前讀寫都會被擋，呼叫的地方要接住錯誤、不出聲）：
//   cloud.saveRoom(data)     寫自己的公開房間 {name, home, look, t}
//   cloud.room(uid)          讀朋友的公開房間 → 物件或 null
//   cloud.sendHeart(uid, day)  在朋友家留一顆愛心（一人一天一顆，規則擋）
//   cloud.sentHeart(uid, day)  今天在這個朋友家留過了沒
//   cloud.heartsToday(day)   自己家今天收到幾顆
//   送娃娃（nestGifts/{id}，第四版；規則發布前一樣會被擋）：
//   cloud.sendGift({to, toName, doll, line, fromName})  寄一隻娃娃 → 新文件的 id
//   cloud.giftsTo() / cloud.giftsFrom()  寄給自己的、自己寄出去還沒被領的 → [{id, from, fromName, to, toName, doll, line, t}]
//   cloud.gift(id)           讀一份（領或收回前先確認還在）→ 物件或 null
//   cloud.delGift(id)        刪掉（領走或收回）
//   第五版（規則發布前都會被擋，呼叫的地方要接住錯誤）：
//   cloud.bookAdd(uid, day, {fromName, sticker, msg}) / cloud.bookMine(uid, day) / cloud.book(uid) / cloud.bookDel(uid, id)   訪客簿
//   cloud.waterAdd(uid, day, {fromName, plot}) / cloud.waterMine(uid, day) / cloud.waters() / cloud.waterDel(id)             幫朋友澆水
//   cloud.foundAdd(uid, day, {fromName, ok, n}) / cloud.foundMine(uid, day) / cloud.founds() / cloud.foundDel(id)            躲貓貓找的結果（js/hide.js）
//   cloud.stayGo({to, doll, look, day, x, y, fromName}) / cloud.stayMine() / cloud.stayGuests() / cloud.staySet(uid, patch) / cloud.stayEnd(uid)   過夜
//   cloud.cardSend({to, snap, msg, fromName}) / cloud.cardsTo() / cloud.cardDel(id)                                          明信片
//   cloud.letterSend({to, msg, re, d, fromName}) / cloud.lettersTo() / cloud.letterDel(id)                                    回信（js/letter.js）
//   cloud.chatSend(uid, {m, s}) / chatRecent(uid) / chatOlder(uid, cur) / chatSince(uid, ts) / chatMeta(uid) / chatMetas() / chatSeen(uid) / chatDel(uid, id)   朋友聊天（js/chat.js）
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
  let keepCur = null;   // 舊明信片讀到哪裡（keepCards）
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

  // 聊天：兩個人的帳號排序後用 _ 接起來當編號；排前面的人看到哪裡記在 sa，後面的記在 sb
  const chatKey = uid => {
    if (!user) throw new Error('not signed in');
    if (typeof uid !== 'string' || !/^[A-Za-z0-9-]{1,64}$/.test(uid) || uid === user.uid) throw new Error('bad uid');
    const p = [user.uid, uid].sort();
    return [p.join('_'), p[0] === user.uid ? 'sa' : 'sb'];
  };
  const ms = t => (t && typeof t.toMillis === 'function' ? t.toMillis() : 0);
  const chatMsg = d => { const o = d.data(); return { id: d.id, from: o.from, m: o.m, s: o.s, t: ms(o.t), ts: o.t || null }; };
  const chatMetaOf = (cid, o) => {
    const u = Array.isArray(o.u) ? o.u : cid.split('_'), first = u[0] === (user && user.uid);
    return { cid, other: first ? u[1] : u[0], t: ms(o.t), f: o.f || '', seen: ms(first ? o.sa : o.sb), seenTs: (first ? o.sa : o.sb) || null, x: ms(o.x) };
  };

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
    // 登入憑證：給 AI 寫信的 Worker 確認「這是小窩登入的玩家」（js/mailai.js）。大約一小時會換一次，Firebase 自己會更新
    async idToken() {
      await ready;
      if (!auth.currentUser) throw new Error('not signed in');
      return auth.currentUser.getIdToken();
    },
    async load() {
      await ready;
      const s = await F.getDoc(ref());
      return s.exists() ? s.data() : null;
    },
    // uid：呼叫的人以為現在是誰。登入狀態剛換人、上一個人的存檔還排著要寫的時候，不會寫到下一個人的雲端存檔裡
    async save(data, uid) {
      await ready;
      if (uid && (!user || user.uid !== uid)) throw Object.assign(new Error('account changed'), { code: 'cloud/account-changed' });
      // 以前這裡有一段保險：被規則擋住就拿掉 earn 和新房間（kitchen、attic）再寫一次。規則早就都收了（2026-11-26 發布），
      // 留著反而危險：如果是別的原因暫時被擋（例如登入剛好過期），第二次寫成功，雲端那份的房間和賺幣紀錄就被誤刪，
      // 下次同步房間就不見了。2026-11-27 拿掉，被擋就照實丟出去，等一下會自己重試（js/account.js 的 failState）
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
    // 從自己的好友名單拿掉（對方的名單不會動）。拿掉之後對方就不能在你的訪客簿寫字、寄明信片給你
    async removeFriend(uid) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.setDoc(F.doc(db, 'players', user.uid), { friends: F.arrayRemove(uid) }, { merge: true });
    },
    async findCode(code) {
      await ready;
      const r = await F.getDocs(F.query(F.collection(db, 'players'), F.where('code', '==', code), F.limit(5)));
      return r.docs.map(d => ({ ...d.data(), uid: d.id }));
    },
    // ---------- 去朋友家、留愛心（nestRooms） ----------
    async saveRoom(data) {
      await ready;
      if (!user) throw new Error('not signed in');
      try { await F.setDoc(F.doc(db, 'nestRooms', user.uid), data); }
      catch (e) {
        // 小島重做（2026-11-27）：小島這間的擺設放 home.yard，規則發布前不收。先只拿掉這一間再寫一次，其他都留著
        if (e && e.code === 'permission-denied' && data.home && data.home.yard) {
          const h = { ...data.home }; delete h.yard;
          return this.saveRoom({ ...data, home: h });
        }
        // 保險（規則已發布，正常不會走到這裡）：第五版的 want（願望清單）、yard（小島給朋友看的樣子）舊版規則不收。還沒發布時先拿掉再寫，房間照樣放得上去
        // 躲貓貓的 hide（規則 2026-11-26 已發布）也一樣留著保險：被擋就先拿掉，房間照樣放得上去
        const extra = ['want', 'yard', 'hide'].filter(k => k in data);
        const rooms = data.home ? ['kitchen', 'attic'].filter(k => k in data.home) : [];
        if (!(e && e.code === 'permission-denied' && (extra.length || rooms.length))) throw e;
        const d = { ...data }; extra.forEach(k => delete d[k]);
        if (rooms.length){ d.home = { ...data.home }; rooms.forEach(k => delete d.home[k]); }
        await F.setDoc(F.doc(db, 'nestRooms', user.uid), d);
      }
    },
    async room(uid) {
      await ready;
      const s = await F.getDoc(F.doc(db, 'nestRooms', uid));
      return s.exists() ? s.data() : null;
    },
    async sendHeart(uid, day) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.setDoc(F.doc(db, 'nestRooms', uid, 'hearts', `${day}_${user.uid}`), { from: user.uid, day });
    },
    async sentHeart(uid, day) {
      await ready;
      if (!user) return false;
      const s = await F.getDoc(F.doc(db, 'nestRooms', uid, 'hearts', `${day}_${user.uid}`));
      return s.exists();
    },
    async heartsToday(day) {
      await ready;
      if (!user) return 0;
      const r = await F.getDocs(F.query(F.collection(db, 'nestRooms', user.uid, 'hearts'), F.where('day', '==', day), F.limit(60)));
      return r.size;
    },
    // ---------- 送娃娃（nestGifts） ----------
    // 不用 transaction：寄的時候先寫這份，成功了呼叫的地方才把自己的數量減一；領的時候先加進自己的存檔，再刪這份
    // msg：自己打的一句話（第五版，40 字以內），沒有就不放這一欄
    async sendGift({ to, toName, doll, line, fromName, msg }) {
      await ready;
      if (!user) throw new Error('not signed in');
      const r = await F.addDoc(F.collection(db, 'nestGifts'), {
        from: user.uid, fromName: String(fromName || user.name).slice(0, 24), to, toName: String(toName || '').slice(0, 24), doll, line, t: Date.now(),
        ...(msg ? { msg: String(msg).slice(0, 40) } : {}),
      });
      return r.id;
    },
    async giftsTo() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestGifts'), F.where('to', '==', user.uid), F.limit(30)));
      return r.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async giftsFrom() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestGifts'), F.where('from', '==', user.uid), F.limit(30)));
      return r.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async gift(id) {
      await ready;
      const s = await F.getDoc(F.doc(db, 'nestGifts', id));
      return s.exists() ? { ...s.data(), id } : null;
    },
    async delGift(id) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.deleteDoc(F.doc(db, 'nestGifts', id));
    },
    // ---------- 第五版：訪客簿（nestRooms/{主人}/book/{日子_寫的人}） ----------
    async bookAdd(uid, day, { fromName, sticker, msg }) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.setDoc(F.doc(db, 'nestRooms', uid, 'book', `${day}_${user.uid}`), {
        from: user.uid, fromName: String(fromName || user.name).slice(0, 24), day, sticker: String(sticker || '').slice(0, 40),
        ...(msg ? { msg: String(msg).slice(0, 40) } : {}),
      });
    },
    async bookMine(uid, day) {
      await ready;
      if (!user) return null;
      const s = await F.getDoc(F.doc(db, 'nestRooms', uid, 'book', `${day}_${user.uid}`));
      return s.exists() ? { ...s.data(), id: s.id } : null;
    },
    // 最新的在前面
    async book(uid) {
      await ready;
      const r = await F.getDocs(F.query(F.collection(db, 'nestRooms', uid, 'book'), F.orderBy('day', 'desc'), F.limit(80)));
      return r.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async bookDel(uid, id) {
      await ready;
      await F.deleteDoc(F.doc(db, 'nestRooms', uid, 'book', id));
    },
    // ---------- 幫朋友的小島澆水（nestRooms/{主人}/water/{日子_澆的人}） ----------
    async waterAdd(uid, day, { fromName, plot }) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.setDoc(F.doc(db, 'nestRooms', uid, 'water', `${day}_${user.uid}`), {
        from: user.uid, fromName: String(fromName || user.name).slice(0, 24), day, plot,
      });
    },
    async waterMine(uid, day) {
      await ready;
      if (!user) return false;
      const s = await F.getDoc(F.doc(db, 'nestRooms', uid, 'water', `${day}_${user.uid}`));
      return s.exists();
    },
    async waters() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestRooms', user.uid, 'water'), F.limit(30)));
      return r.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async waterDel(id) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.deleteDoc(F.doc(db, 'nestRooms', user.uid, 'water', id));
    },
    // ---------- 躲貓貓：朋友找的結果（nestRooms/{主人}/found/{日子_找的人}），寫法跟澆水一樣 ----------
    async foundAdd(uid, day, { fromName, ok, n }) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.setDoc(F.doc(db, 'nestRooms', uid, 'found', `${day}_${user.uid}`), {
        from: user.uid, fromName: String(fromName || user.name).slice(0, 24), day, ok: !!ok, n: Math.max(1, Math.min(3, n | 0)),
      });
    },
    async foundMine(uid, day) {
      await ready;
      if (!user) return null;
      const s = await F.getDoc(F.doc(db, 'nestRooms', uid, 'found', `${day}_${user.uid}`));
      return s.exists() ? s.data() : null;
    },
    async founds() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestRooms', user.uid, 'found'), F.limit(30)));
      return r.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async foundDel(id) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.deleteDoc(F.doc(db, 'nestRooms', user.uid, 'found', id));
    },
    // ---------- 娃娃去朋友家過夜（nestStays/{出門的人}，一人一筆） ----------
    async stayGo({ to, doll, look, day, x, y, fromName }) {
      await ready;
      if (!user) throw new Error('not signed in');
      // 上一次的那筆如果還留著（例如換過裝置），先刪掉：蓋在舊的上面會被規則當成「修改」擋下來
      try { await F.deleteDoc(F.doc(db, 'nestStays', user.uid)); } catch (e) {}
      await F.setDoc(F.doc(db, 'nestStays', user.uid), {
        from: user.uid, fromName: String(fromName || user.name).slice(0, 24), to, doll, look: look || {}, day, note: '', x, y,
      });
    },
    async stayMine() {
      await ready;
      if (!user) return null;
      const s = await F.getDoc(F.doc(db, 'nestStays', user.uid));
      return s.exists() ? s.data() : null;
    },
    async stayGuests() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestStays'), F.where('to', '==', user.uid), F.limit(10)));
      return r.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    // 主人只能改小紙條和位置（規則擋）
    async staySet(uid, patch) {
      await ready;
      await F.updateDoc(F.doc(db, 'nestStays', uid), patch);
    },
    async stayEnd(uid) {
      await ready;
      await F.deleteDoc(F.doc(db, 'nestStays', uid));
    },
    // ---------- 明信片（nestCards/{自動編號}） ----------
    async cardSend({ to, snap, msg, fromName }) {
      await ready;
      if (!user) throw new Error('not signed in');
      const r = await F.addDoc(F.collection(db, 'nestCards'), {
        from: user.uid, fromName: String(fromName || user.name).slice(0, 24), to, snap, msg: String(msg || '').slice(0, 80), t: Date.now(),
      });
      return r.id;
    },
    async cardsTo() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestCards'), F.where('to', '==', user.uid), F.limit(20)));
      return r.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async cardDel(id) {
      await ready;
      await F.deleteDoc(F.doc(db, 'nestCards', id));
    },
    // ---------- 回信（nestLetters/{自動編號}）：只有字，re 是回哪一種信（gift/trip/pc/re），d 是那封信的娃娃 ----------
    async letterSend({ to, msg, re, d, fromName }) {
      await ready;
      if (!user) throw new Error('not signed in');
      const o = { from: user.uid, fromName: String(fromName || user.name).slice(0, 24), to, msg: String(msg || '').slice(0, 100), t: Date.now() };
      if (re) o.re = re;
      if (d) o.d = String(d).slice(0, 12);
      const r = await F.addDoc(F.collection(db, 'nestLetters'), o);
      return r.id;
    },
    async lettersTo() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestLetters'), F.where('to', '==', user.uid), F.limit(20)));
      return r.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async letterDel(id) {
      await ready;
      await F.deleteDoc(F.doc(db, 'nestLetters', id));
    },
    // ---------- 朋友聊天（js/chat.js）----------
    //   nestChats/{兩個人的帳號排序後用 _ 接起來} = {u: [兩個帳號], t: 最後一則的時間, f: 最後一則誰送的, sa/sb: 排前面／後面的人看到哪裡, x: 最後一次收回的時間}
    //   nestChats/{同上}/msgs/{自動編號} = {from, t: 伺服器時間, m: 字} 或 {from, t, s: 貼圖代號}
    //   時間都用伺服器時間（規則檢查 == request.time）。讀回來的 t 換成毫秒，ts 留著原本的 Timestamp（查「這之後的」要用）
    async chatSend(uid, { m, s }) {
      await ready;
      if (!user) throw new Error('not signed in');
      const [cid, side] = chatKey(uid), now = F.serverTimestamp();
      const o = { from: user.uid, t: now };
      if (m) o.m = String(m).slice(0, 80); else o.s = String(s || '').slice(0, 40);
      const mr = F.doc(F.collection(db, 'nestChats', cid, 'msgs'));
      const b = F.writeBatch(db);
      b.set(mr, o);
      b.set(F.doc(db, 'nestChats', cid), { u: cid.split('_'), t: now, f: user.uid, [side]: now }, { merge: true });
      await b.commit();
      return mr.id;
    },
    async chatRecent(uid, n = 50) {
      await ready;
      if (!user) return { list: [], cur: null };
      const r = await F.getDocs(F.query(F.collection(db, 'nestChats', chatKey(uid)[0], 'msgs'), F.orderBy('t', 'desc'), F.limit(n)));
      return { list: r.docs.map(chatMsg).reverse(), cur: r.docs.length === n ? r.docs[r.docs.length - 1] : null };
    },
    // 比 cur（上一次讀到最舊的那一則）更早的
    async chatOlder(uid, cur, n = 50) {
      await ready;
      if (!user || !cur) return { list: [], cur: null };
      const r = await F.getDocs(F.query(F.collection(db, 'nestChats', chatKey(uid)[0], 'msgs'), F.orderBy('t', 'desc'), F.startAfter(cur), F.limit(n)));
      return { list: r.docs.map(chatMsg).reverse(), cur: r.docs.length === n ? r.docs[r.docs.length - 1] : null };
    },
    // ts 之後才送的（舊的在前面）
    async chatSince(uid, ts, n = 50) {
      await ready;
      if (!user || !ts) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestChats', chatKey(uid)[0], 'msgs'), F.where('t', '>', ts), F.orderBy('t'), F.limit(n)));
      return r.docs.map(chatMsg);
    },
    async chatMeta(uid) {
      await ready;
      if (!user) return null;
      const [cid] = chatKey(uid);
      const s = await F.getDoc(F.doc(db, 'nestChats', cid));
      return s.exists() ? chatMetaOf(cid, s.data()) : null;
    },
    // 自己的每一段聊天（房間裡算沒看的數量用）
    async chatMetas() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'nestChats'), F.where('u', 'array-contains', user.uid), F.limit(60)));
      return r.docs.map(d => chatMetaOf(d.id, d.data()));
    },
    // 記下自己看到這裡了
    async chatSeen(uid) {
      await ready;
      if (!user) return;
      const [cid, side] = chatKey(uid);
      await F.setDoc(F.doc(db, 'nestChats', cid), { u: cid.split('_'), [side]: F.serverTimestamp() }, { merge: true });
    },
    // 收回自己送的一則（另外記一個收回的時間，對方開著聊天頁的話會重讀一次）
    async chatDel(uid, id) {
      await ready;
      if (!user) throw new Error('not signed in');
      const [cid] = chatKey(uid);
      const b = F.writeBatch(db);
      b.delete(F.doc(db, 'nestChats', cid, 'msgs', id));
      b.set(F.doc(db, 'nestChats', cid), { u: cid.split('_'), x: F.serverTimestamp() }, { merge: true });
      await b.commit();
    },
    // ---------- 全部都留（js/keep.js）：存檔底下的子集合，只有本人能讀寫 ----------
    //   nestSaves/{uid}/memo/{月份}、nestSaves/{uid}/mail/{月份} = {l:[…], t}；nestSaves/{uid}/cards/{明信片編號} = 一張明信片
    async keepGet(kind, mid) {
      await ready;
      if (!user) return null;
      const s = await F.getDoc(F.doc(db, 'nestSaves', user.uid, kind, mid));
      return s.exists() ? (s.data().l || []) : null;
    },
    // 讀出來、用 keyOf 合併、寫回去（transaction，兩台裝置同時寫也不會互相蓋掉）。
    // 放不下（超過 max 筆或 maxBytes）回 {full:true}，沒有寫；呼叫的人換下一份
    async keepMerge(kind, mid, rows, keyOf, max, maxBytes) {
      await ready;
      if (!user) throw new Error('not signed in');
      const r = F.doc(db, 'nestSaves', user.uid, kind, mid);
      return F.runTransaction(db, async tx => {
        const s = await tx.get(r), old = s.exists() ? (s.data().l || []) : [];
        const seen = new Set(old.map(keyOf)), add = rows.filter(x => !seen.has(keyOf(x)));
        if (!add.length) return { ok: true, n: old.length, added: 0 };
        const l = [...old, ...add];
        if (l.length > max || new TextEncoder().encode(JSON.stringify(l)).length > maxBytes) return { full: true };
        tx.set(r, { l, t: Date.now() });
        return { ok: true, n: l.length, added: add.length };
      });
    },
    // 刪掉一個月份的文件（「檢查雲端」用完測試的那一份要刪；規則允許本人刪）
    async keepDel(kind, mid) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.deleteDoc(F.doc(db, 'nestSaves', user.uid, kind, mid));
    },
    async keepCardPut(c) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.setDoc(F.doc(db, 'nestSaves', user.uid, 'cards', c.id), c);
    },
    async keepCardGet(id) {
      await ready;
      if (!user) return null;
      const s = await F.getDoc(F.doc(db, 'nestSaves', user.uid, 'cards', id));
      return s.exists() ? { ...s.data(), id: s.id } : null;
    },
    async keepCardDel(id) {
      await ready;
      if (!user) throw new Error('not signed in');
      await F.deleteDoc(F.doc(db, 'nestSaves', user.uid, 'cards', id));
    },
    // 舊的明信片，照日期新到舊，一次 n 張。fresh：從頭開始；不然接著上一次讀到的地方
    async keepCards(n, fresh) {
      await ready;
      if (!user) return { list: [], more: false };
      if (fresh) keepCur = null;
      const parts = [F.collection(db, 'nestSaves', user.uid, 'cards'), F.orderBy('t', 'desc')];
      if (keepCur) parts.push(F.startAfter(keepCur));
      parts.push(F.limit(n));
      const r = await F.getDocs(F.query(...parts));
      if (r.docs.length) keepCur = r.docs[r.docs.length - 1];
      return { list: r.docs.map(d => ({ ...d.data(), id: d.id })), more: r.docs.length === n };
    },
    async addedMe() {
      await ready;
      if (!user) return [];
      const r = await F.getDocs(F.query(F.collection(db, 'players'), F.where('friends', 'array-contains', user.uid), F.limit(50)));
      return r.docs.map(d => ({ ...d.data(), uid: d.id }));
    },
  };
}

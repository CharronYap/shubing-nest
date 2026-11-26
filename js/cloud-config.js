// 雲端帳號的設定（Firebase）。小窩自己的專案 shubing-nest，帳號和好友只在小窩裡用。
//
// 這些值本來就會出現在網頁裡、不是密碼（Firebase 官方的設計就是放在前端）；
// 資料安全靠 Firestore 的規則（專案根目錄的 firestore.rules：每個人只能讀寫自己的存檔）。
//
// 想暫時關掉雲端帳號：把下面整段換成 null，封面就不會出現帳號按鈕，存檔只放在這台裝置。
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBEQtJ13_-b_q5xJemwC9-4vL8y8hcLw3U',
  authDomain: 'shubing-nest.firebaseapp.com',
  projectId: 'shubing-nest',
  storageBucket: 'shubing-nest.firebasestorage.app',
  messagingSenderId: '926725223450',
  appId: '1:926725223450:web:08f2783fb732bd5eeb4da3',
};

// 薯餅蛋蛋島的專案 plush-crush（從蛋蛋島 repo 的 js/cloud-config.js 抄來的，一樣不是密碼）。
// 只用來放兩個遊戲共用的錢包 wallets/{uid}（js/wallet.js、docs/WALLET.md）。換成 null 就不連蛋蛋島，小窩的幣自己算。
export const EGG_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyABsrmZwxABSHZfaSka-8n7eTsW64uxqz8',
  authDomain: 'plush-crush.firebaseapp.com',
  projectId: 'plush-crush',
  storageBucket: 'plush-crush.firebasestorage.app',
  messagingSenderId: '740207706798',
  appId: '1:740207706798:web:b9dd64dd74250aff3ce33f',
};

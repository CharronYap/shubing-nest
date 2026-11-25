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

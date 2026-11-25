// 雲端帳號的設定（Firebase）。跟薯餅蛋蛋島用同一個專案 plush-crush，帳號和好友兩邊共用。
//
// 這些值本來就會出現在網頁裡、不是密碼（Firebase 官方的設計就是放在前端）；
// 資料安全靠 Firestore 的規則（專案根目錄的 firestore.rules：每個人只能讀寫自己的存檔）。
//
// 想暫時關掉雲端帳號：把下面整段換成 null，封面就不會出現帳號按鈕，存檔只放在這台裝置。
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyABsrmZwxABSHZfaSka-8n7eTsW64uxqz8',
  authDomain: 'plush-crush.firebaseapp.com',
  projectId: 'plush-crush',
  storageBucket: 'plush-crush.firebasestorage.app',
  messagingSenderId: '740207706798',
  appId: '1:740207706798:web:b9dd64dd74250aff3ce33f',
};

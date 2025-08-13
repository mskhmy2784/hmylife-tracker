import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBHqDwddHDwmLHQe9WGEl6Kz2Luz1lDnBo",
  authDomain: "hmylife-tracker.firebaseapp.com",
  projectId: "hmylife-tracker",
  storageBucket: "hmylife-tracker.appspot.com",
  messagingSenderId: "856708406938",
  appId: "1:856708406938:web:c1833966718d35784d4923"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// サービス初期化
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// 開発環境でエミュレーターを使用する場合
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
  // Firestore エミュレーター
  if (!db._delegate._databaseId) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  
  // Auth エミュレーター
  if (!auth._delegate) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  
  // Storage エミュレーター
  if (!storage._delegate) {
    connectStorageEmulator(storage, 'localhost', 9199);
  }
}

export default app;

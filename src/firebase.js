import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth'; // ← この行を追加

const firebaseConfig = {
  apiKey: "AIzaSyBHqDwddHDwmLHQe9WGEl6Kz2Luz1lDnBo",
  authDomain: "hmylife-tracker.firebaseapp.com",
  projectId: "hmylife-tracker",
  storageBucket: "hmylife-tracker.appspot.com",
  messagingSenderId: "856708406938",
  appId: "1:856708406938:web:c1833966718d35784d4923"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // ← この行を追加

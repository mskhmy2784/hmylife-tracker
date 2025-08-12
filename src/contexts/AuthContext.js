import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// 認証情報を管理するコンテキストを作成
const AuthContext = createContext();

// どこからでも認証情報を使えるようにするためのフック
export function useAuth() {
  return useContext(AuthContext);
}

// 認証機能を提供するプロバイダーコンポーネント
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // 現在ログインしているユーザー
  const [loading, setLoading] = useState(true); // 認証状態の読み込み中かどうか

  // メール・パスワードでログイン
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 新規ユーザー登録
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Googleアカウントでログイン
  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // ログアウト
  const logout = () => {
    return signOut(auth);
  };

  // ユーザーの認証状態が変わったときに呼ばれる
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // ログインしていればユーザー情報、していなければnull
      setLoading(false); // 読み込み完了
    });

    // コンポーネントが破棄されるときにリスナーを解除
    return unsubscribe;
  }, []);

  // 他のコンポーネントで使える機能をまとめる
  const value = {
    currentUser,    // 現在のユーザー情報
    login,          // ログイン関数
    signup,         // 新規登録関数
    loginWithGoogle,// Googleログイン関数
    logout          // ログアウト関数
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './ui/LoadingScreen';

function AuthRoute({ children }) {
  const { user, loading, initialized } = useAuth();

  // 初期化が完了していない場合はローディング表示
  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  // 既に認証されている場合はダッシュボードにリダイレクト
  if (user) {
    return <Navigate to="/" replace />;
  }

  // 未認証の場合は子コンポーネント（ログイン画面など）を表示
  return children;
}

export default AuthRoute;

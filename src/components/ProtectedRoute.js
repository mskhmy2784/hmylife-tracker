import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './ui/LoadingScreen';

function ProtectedRoute({ children }) {
  const { user, loading, initialized } = useAuth();

  // 初期化が完了していない場合はローディング表示
  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  // 認証されていない場合はログイン画面にリダイレクト
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 認証されている場合は子コンポーネントを表示
  return children;
}

export default ProtectedRoute;

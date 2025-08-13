// src/components/layout/Header.js
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('ログアウトしますか？')) {
      try {
        await logout();
      } catch (error) {
        console.error('ログアウトエラー:', error);
        alert('ログアウトに失敗しました');
      }
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-logo">🏃‍♂️ HMYLifeLog</h1>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">
              {user?.displayName || user?.email || 'ユーザー'}
            </span>
            {user?.photoURL && (
              <img 
                src={user.photoURL} 
                alt="プロフィール" 
                className="user-avatar"
              />
            )}
          </div>
          
          <div className="header-actions">
            <button 
              className="header-btn settings-btn" 
              title="設定"
            >
              ⚙️
            </button>
            <button 
              className="header-btn logout-btn" 
              onClick={handleLogout}
              title="ログアウト"
            >
              👋
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
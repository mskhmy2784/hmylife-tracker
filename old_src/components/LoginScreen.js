import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LoginScreen() {
  // 入力フォームの状態管理
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false); // ログインか新規登録かの切り替え
  const [loading, setLoading] = useState(false); // 処理中かどうか
  const [error, setError] = useState(''); // エラーメッセージ

  // 認証機能を取得
  const { login, signup, loginWithGoogle } = useAuth();

  // フォーム送信時の処理
  const handleSubmit = async (e) => {
    e.preventDefault(); // ページのリロードを防ぐ
    
    // パスワードの長さチェック
    if (password.length < 6) {
      return setError('パスワードは6文字以上で入力してください');
    }

    try {
      setError(''); // エラーメッセージをクリア
      setLoading(true); // 処理開始
      
      if (isSignup) {
        await signup(email, password); // 新規登録
      } else {
        await login(email, password); // ログイン
      }
      
      // 成功すれば自動的にメイン画面に遷移します
    } catch (error) {
      // エラーが発生した場合の処理
      console.error('認証エラー:', error);
      setError('認証に失敗しました: ' + error.message);
    }
    
    setLoading(false); // 処理終了
  };

  // Googleログインボタンが押されたときの処理
  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (error) {
      console.error('Googleログインエラー:', error);
      setError('Googleログインに失敗しました: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <h2>🏃‍♂️ ライフトラッカー</h2>
        <p>あなたの日常を記録しましょう</p>
        
        {/* エラーメッセージ表示 */}
        {error && <div className="error-message">{error}</div>}
        
        {/* ログイン/新規登録フォーム */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>メールアドレス:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>パスワード:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? '処理中...' : (isSignup ? '新規登録' : 'ログイン')}
          </button>
        </form>
        
        {/* Googleログインボタン */}
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading} 
          className="google-login-btn"
        >
          🔍 Googleでログイン
        </button>
        
        {/* ログイン/新規登録の切り替え */}
        <p className="auth-switch">
          {isSignup ? 'アカウントをお持ちの方は' : 'アカウントをお持ちでない方は'}
          <button 
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="link-button"
          >
            {isSignup ? 'ログイン' : '新規登録'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;

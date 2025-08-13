import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validators';
import ErrorMessage from '../../components/ui/ErrorMessage';

function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, loginWithGoogle, signup, error, clearError } = useAuth();

  // フォーム入力の変更処理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // エラーをクリア
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (error) {
      clearError();
    }
  };

  // フォームバリデーション
  const validateForm = () => {
    const errors = {};

    if (!validateEmail(formData.email)) {
      errors.email = 'メールアドレスの形式が正しくありません';
    }

    if (!validatePassword(formData.password)) {
      errors.password = 'パスワードは6文字以上で入力してください';
    }

    if (isSignup && !formData.displayName.trim()) {
      errors.displayName = '表示名を入力してください';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignup) {
        await signup(formData.email, formData.password, formData.displayName);
      } else {
        await login(formData.email, formData.password);
      }
      // 成功した場合は自動的にダッシュボードにリダイレクトされる
    } catch (error) {
      // エラーは useAuth で管理されるので、ここでは何もしない
      console.error('認証エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Googleログインエラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ログイン/新規登録の切り替え
  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormErrors({});
    clearError();
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* ヘッダー */}
        <div className="login-header">
          <h1 className="app-title">🏃‍♂️ HMYLifeLog</h1>
          <p className="app-subtitle">あなたの日常を記録し、分析しましょう</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={clearError}
          />
        )}

        {/* メイン認証フォーム */}
        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-title">
            {isSignup ? '新規アカウント作成' : 'ログイン'}
          </h2>

          {/* 表示名入力（新規登録時のみ） */}
          {isSignup && (
            <div className="form-group">
              <label htmlFor="displayName">表示名</label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="山田太郎"
                className={formErrors.displayName ? 'error' : ''}
                disabled={isSubmitting}
                autoComplete="name"
              />
              {formErrors.displayName && (
                <span className="field-error">{formErrors.displayName}</span>
              )}
            </div>
          )}

          {/* メールアドレス入力 */}
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="example@email.com"
              className={formErrors.email ? 'error' : ''}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
            {formErrors.email && (
              <span className="field-error">{formErrors.email}</span>
            )}
          </div>

          {/* パスワード入力 */}
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="6文字以上"
              className={formErrors.password ? 'error' : ''}
              disabled={isSubmitting}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />
            {formErrors.password && (
              <span className="field-error">{formErrors.password}</span>
            )}
          </div>

          {/* 送信ボタン */}
          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-icon">⏳</span>
                処理中...
              </>
            ) : (
              isSignup ? 'アカウント作成' : 'ログイン'
            )}
          </button>
        </form>

        {/* 区切り線 */}
        <div className="auth-divider">
          <span>または</span>
        </div>

        {/* Googleログインボタン */}
        <button 
          onClick={handleGoogleLogin}
          className="google-login-btn"
          disabled={isSubmitting}
        >
          <span className="google-icon">🔍</span>
          Googleでログイン
        </button>

        {/* モード切り替え */}
        <div className="auth-toggle">
          <p>
            {isSignup ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでない方は'}
            <button 
              type="button"
              onClick={toggleMode}
              className="toggle-link"
              disabled={isSubmitting}
            >
              {isSignup ? 'ログイン' : '新規登録'}
            </button>
          </p>
        </div>

        {/* フッター */}
        <div className="login-footer">
          <p>© 2024 HMYLifeLog. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;

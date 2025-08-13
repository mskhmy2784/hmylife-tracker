import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (!mounted) return;

      setUser(user);
      setLoading(false);
      setInitialized(true);
      
      // エラーをクリア（認証状態が変わったら）
      if (error) {
        setError(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [error]);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const user = await authService.signIn(email, password);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const user = await authService.signInWithGoogle();
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, displayName = '') => {
    try {
      setError(null);
      setLoading(true);
      const user = await authService.signUp(email, password, displayName);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.signOut();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    initialized,
    login,
    loginWithGoogle,
    signup,
    logout,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

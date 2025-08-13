// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { RecordsProvider } from './hooks/useRecords';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRoute from './components/AuthRoute';
import LoginScreen from './screens/auth/LoginScreen';
import Dashboard from './screens/dashboard/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* 認証関連のルート */}
              <Route 
                path="/login" 
                element={
                  <AuthRoute>
                    <LoginScreen />
                  </AuthRoute>
                } 
              />
              
              {/* 認証が必要なルート */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <RecordsProvider>
                      <Dashboard />
                    </RecordsProvider>
                  </ProtectedRoute>
                } 
              />
              
              {/* 404エラーの場合は、認証状態に応じてリダイレクト */}
              <Route 
                path="*" 
                element={<Navigate to="/" replace />} 
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
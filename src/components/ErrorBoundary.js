import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>🚨 アプリケーションエラー</h2>
            <p>申し訳ございません。予期しないエラーが発生しました。</p>
            <button 
              onClick={() => window.location.reload()}
              className="error-reload-btn"
            >
              ページを再読み込み
            </button>
            <details className="error-details">
              <summary>エラー詳細</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
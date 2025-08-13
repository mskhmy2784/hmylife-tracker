import React from 'react';

function ErrorMessage({ message, onRetry, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-message">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{message}</span>
        <div className="error-actions">
          {onRetry && (
            <button 
              onClick={onRetry}
              className="error-retry-btn"
            >
              再試行
            </button>
          )}
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="error-dismiss-btn"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorMessage;

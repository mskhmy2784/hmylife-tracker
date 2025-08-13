import React from 'react';

function LoadingScreen({ message = '読み込み中...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;

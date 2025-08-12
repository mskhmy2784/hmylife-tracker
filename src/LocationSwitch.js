import React, { useState, useEffect } from 'react';

function LocationSwitch({ useLocationInfo, setUseLocationInfo, currentLocation, setCurrentLocation }) {
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 位置情報取得
  useEffect(() => {
    if (useLocationInfo && navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
          setLocationError(null);
          setIsLoading(false);
        },
        (error) => {
          console.error('位置情報取得エラー:', error);
          let errorMessage = '位置情報を取得できませんでした';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '位置情報の許可が必要です';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置情報が利用できません';
              break;
            case error.TIMEOUT:
              errorMessage = '位置情報の取得がタイムアウトしました';
              break;
          }
          setLocationError(errorMessage);
          setCurrentLocation(null);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5分間キャッシュ
        }
      );
    } else if (!useLocationInfo) {
      setCurrentLocation(null);
      setLocationError(null);
      setIsLoading(false);
    }
  }, [useLocationInfo, setCurrentLocation]);

  // 位置情報ステータス表示
  const getLocationStatus = () => {
    if (!useLocationInfo) return '';
    if (isLoading) return '📍 位置情報取得中...';
    if (locationError) return `❌ ${locationError}`;
    if (currentLocation) return '✅ 位置情報取得完了';
    return '';
  };

  return (
    <div className="form-group">
      <div className="location-switch-row">
        <label>位置情報を記録:</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={useLocationInfo}
            onChange={(e) => setUseLocationInfo(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
        <span className="location-status">{getLocationStatus()}</span>
      </div>
      {currentLocation && useLocationInfo && (
        <div className="location-details">
          緯度: {currentLocation.latitude.toFixed(6)}, 
          経度: {currentLocation.longitude.toFixed(6)}
          {currentLocation.accuracy && ` (精度: ${Math.round(currentLocation.accuracy)}m)`}
        </div>
      )}
      {locationError && useLocationInfo && (
        <div className="location-error">
          {locationError}
          <button 
            className="retry-btn"
            onClick={() => {
              setLocationError(null);
              setUseLocationInfo(false);
              setTimeout(() => setUseLocationInfo(true), 100);
            }}
          >
            再試行
          </button>
        </div>
      )}
    </div>
  );
}

export default LocationSwitch;

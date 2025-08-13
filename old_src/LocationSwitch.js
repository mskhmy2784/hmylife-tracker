import React, { useState, useEffect } from 'react';

function EnhancedLocationSwitch({ 
  useLocationInfo, 
  setUseLocationInfo, 
  currentLocation, 
  setCurrentLocation 
}) {
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // 位置情報取得
  useEffect(() => {
    if (useLocationInfo && navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          
          setCurrentLocation(locationData);
          setLocationError(null);
          setIsLoading(false);
          
          // 住所情報を取得
          await getAddressFromCoordinates(locationData.latitude, locationData.longitude);
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
          setAddress(null);
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
      setAddress(null);
      setIsLoading(false);
      setIsLoadingAddress(false);
    }
  }, [useLocationInfo, setCurrentLocation]);

  // 座標から住所を取得（逆ジオコーディング）
  const getAddressFromCoordinates = async (latitude, longitude) => {
    setIsLoadingAddress(true);
    try {
      // OpenStreetMap Nominatim API を使用（無料）
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ja`,
        {
          headers: {
            'User-Agent': 'LifeTracker/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          // 住所情報を整理
          const addressInfo = {
            fullAddress: data.display_name,
            road: data.address?.road || '',
            city: data.address?.city || data.address?.town || data.address?.village || '',
            state: data.address?.state || '',
            country: data.address?.country || '',
            postcode: data.address?.postcode || ''
          };
          
          setAddress(addressInfo);
          
          // 位置情報にも住所を追加
          setCurrentLocation(prev => ({
            ...prev,
            address: addressInfo
          }));
        } else {
          setAddress({ error: '住所情報が見つかりませんでした' });
        }
      } else {
        throw new Error('住所取得APIエラー');
      }
    } catch (error) {
      console.error('住所取得エラー:', error);
      setAddress({ error: '住所の取得に失敗しました' });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 位置情報ステータス表示
  const getLocationStatus = () => {
    if (!useLocationInfo) return '';
    if (isLoading) return '📍 位置情報取得中...';
    if (locationError) return `❌ ${locationError}`;
    if (currentLocation) {
      if (isLoadingAddress) return '✅ 位置情報取得完了 🔄 住所取得中...';
      if (address && !address.error) return '✅ 位置情報・住所取得完了';
      return '✅ 位置情報取得完了';
    }
    return '';
  };

  // 住所の表示用テキスト生成
  const getDisplayAddress = () => {
    if (!address || address.error) return null;
    
    // 日本の住所形式に適した表示
    const parts = [];
    if (address.state) parts.push(address.state);
    if (address.city) parts.push(address.city);
    if (address.road) parts.push(address.road);
    
    return parts.length > 0 ? parts.join('') : address.fullAddress;
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
        <div className="location-info">
          {/* 座標情報 */}
          <div className="location-details">
            <strong>📍 座標:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            {currentLocation.accuracy && ` (精度: ${Math.round(currentLocation.accuracy)}m)`}
          </div>
          
          {/* 住所情報 */}
          {isLoadingAddress && (
            <div className="address-loading">
              🔄 住所情報を取得中...
            </div>
          )}
          
          {address && !isLoadingAddress && (
            <div className="address-details">
              {address.error ? (
                <div className="address-error">
                  ❌ {address.error}
                </div>
              ) : (
                <div className="address-success">
                  <strong>🏠 住所:</strong> {getDisplayAddress()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {locationError && useLocationInfo && (
        <div className="location-error">
          {locationError}
          <button 
            className="retry-btn"
            onClick={() => {
              setLocationError(null);
              setAddress(null);
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

export default EnhancedLocationSwitch;

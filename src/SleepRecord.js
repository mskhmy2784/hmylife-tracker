import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

function SleepRecord({ onBack, onSave, editingRecord }) {
  const [wakeTime, setWakeTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [sleepTime, setSleepTime] = useState('23:00');
  const [useLocationInfo, setUseLocationInfo] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState({});

  // 位置情報取得（住所情報付き）
  useEffect(() => {
    if (useLocationInfo && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          
          // 住所情報を取得
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}&zoom=18&addressdetails=1&accept-language=ja`,
              {
                headers: {
                  'User-Agent': 'LifeTracker/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data && data.display_name) {
                const addressInfo = {
                  fullAddress: data.display_name,
                  road: data.address?.road || '',
                  city: data.address?.city || data.address?.town || data.address?.village || '',
                  state: data.address?.state || '',
                  country: data.address?.country || '',
                  postcode: data.address?.postcode || ''
                };
                
                locationData.address = addressInfo;
              }
            }
          } catch (error) {
            console.error('住所取得エラー:', error);
          }
          
          setCurrentLocation(locationData);
          setLocationError(null);
        },
        (error) => {
          console.error('位置情報取得エラー:', error);
          setLocationError(error.message);
          setCurrentLocation(null);
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
    }
  }, [useLocationInfo]);

  // 編集時のデータ初期化
  useEffect(() => {
    if (editingRecord) {
      setWakeTime(editingRecord.wakeTime || '');
      setSleepTime(editingRecord.sleepTime || '23:00');
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
      
      // 編集時は既存の位置情報があれば設定
      if (editingRecord.location) {
        setCurrentLocation(editingRecord.location);
      }
    }
  }, [editingRecord]);

  // 睡眠時間を計算（時間と分）
  const calculateSleepDuration = () => {
    if (!wakeTime || !sleepTime) return { hours: 0, minutes: 0, text: '0時間0分' };
    
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
    
    let wakeMinutes = wakeHour * 60 + wakeMin;
    let sleepMinutes = sleepHour * 60 + sleepMin;
    
    // 翌日の起床時刻の場合（睡眠時刻より起床時刻が早い）
    if (wakeMinutes <= sleepMinutes) {
      wakeMinutes += 24 * 60; // 24時間を追加
    }
    
    const totalMinutes = wakeMinutes - sleepMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { 
      hours, 
      minutes, 
      text: `${hours}時間${minutes}分`,
      totalMinutes 
    };
  };

  const sleepDuration = calculateSleepDuration();

  // バリデーション
  const validateForm = () => {
    const newErrors = {};

    // 起床時刻チェック
    if (!wakeTime) {
      newErrors.wakeTime = '起床時刻を入力してください';
    }

    // 就寝時刻チェック
    if (!sleepTime) {
      newErrors.sleepTime = '就寝時刻を入力してください';
    }

    // 睡眠時間の妥当性チェック
    if (wakeTime && sleepTime) {
      if (sleepDuration.totalMinutes < 30) {
        newErrors.duration = '睡眠時間が短すぎます（30分以上にしてください）';
      } else if (sleepDuration.totalMinutes > 18 * 60) {
        newErrors.duration = '睡眠時間が長すぎます（18時間以下にしてください）';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSave = async () => {
    if (!validateForm()) {
      alert('入力内容に不備があります。エラーメッセージを確認してください。');
      return;
    }

    try {
      const sleepData = {
        category: '睡眠',
        wakeTime: wakeTime,
        sleepTime: sleepTime,
        sleepHours: sleepDuration.hours,
        sleepMinutes: sleepDuration.minutes,
        totalSleepMinutes: sleepDuration.totalMinutes,
        useLocationInfo: useLocationInfo,
        location: useLocationInfo && currentLocation ? currentLocation : null,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        updatedAt: new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), sleepData);
      } else {
        await addDoc(collection(db, 'records'), sleepData);
      }

      onSave();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (window.confirm('この記録を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'records', editingRecord.id));
        onBack();
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  // 位置情報ステータス表示
  const getLocationStatus = () => {
    if (!useLocationInfo) return '';
    if (locationError) return '❌ 位置情報取得失敗';
    if (currentLocation) return '✅ 位置情報取得完了';
    return '📍 位置情報取得中...';
  };

  return (
    <div className="record-screen">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <h2>{editingRecord ? '睡眠記録編集' : '睡眠記録'}</h2>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>

      <div className="record-form">
        {/* 起床時刻 */}
        <div className="form-group">
          <label>起床時刻:</label>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className={errors.wakeTime ? 'error' : ''}
          />
          <div className="sleep-note">今朝の起床時刻</div>
          {errors.wakeTime && <span className="error-message">{errors.wakeTime}</span>}
        </div>

        {/* 就寝時刻 */}
        <div className="form-group">
          <label>就寝時刻:</label>
          <input
            type="time"
            value={sleepTime}
            onChange={(e) => setSleepTime(e.target.value)}
            className={errors.sleepTime ? 'error' : ''}
          />
          <div className="sleep-note">前日の就寝時刻</div>
          {errors.sleepTime && <span className="error-message">{errors.sleepTime}</span>}
        </div>

        {/* 睡眠時間（自動計算） */}
        <div className="form-group">
          <label>睡眠時間:</label>
          <div className={`sleep-duration ${errors.duration ? 'error' : ''}`}>
            {sleepDuration.text}
          </div>
          {errors.duration && <span className="error-message">{errors.duration}</span>}
        </div>

        {/* 位置情報 */}
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
              <div className="location-details">
                <strong>📍 座標:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                {currentLocation.accuracy && ` (精度: ${Math.round(currentLocation.accuracy)}m)`}
              </div>
              {currentLocation.address && (
                <div className="address-details">
                  <div className="address-success">
                    <strong>🏠 住所:</strong> {
                      currentLocation.address.state && currentLocation.address.city && currentLocation.address.road
                        ? `${currentLocation.address.state}${currentLocation.address.city}${currentLocation.address.road}`
                        : currentLocation.address.fullAddress
                    }
                  </div>
                </div>
              )}
            </div>
          )}
          {locationError && useLocationInfo && (
            <div className="location-error">
              ❌ {locationError}
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

        <div className="form-group">
          <label>メモ:</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="補足情報"
            rows="3"
          />
        </div>
      </div>

      {/* 削除ボタン（編集時のみ表示） */}
      {editingRecord && (
        <div className="delete-section">
          <button className="delete-btn" onClick={handleDelete}>
            この記録を削除
          </button>
        </div>
      )}
    </div>
  );
}

export default SleepRecord;

import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

function InfoRecord({ onBack, onSave, editingRecord }) {
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [infoType, setInfoType] = useState('メモ');
  const [priority, setPriority] = useState('通常');
  const [infoContent, setInfoContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [useLocationInfo, setUseLocationInfo] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [memo, setMemo] = useState('');

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
      setRecordTime(editingRecord.recordTime || '');
      setInfoType(editingRecord.infoType || 'メモ');
      setPriority(editingRecord.priority || '通常');
      setInfoContent(editingRecord.infoContent || '');
      setDueDate(editingRecord.dueDate || '');
      setDueTime(editingRecord.dueTime || '');
      setIsCompleted(editingRecord.isCompleted || false);
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
      
      // 編集時は既存の位置情報があれば設定
      if (editingRecord.location) {
        setCurrentLocation(editingRecord.location);
      }
    }
  }, [editingRecord]);

  // 保存処理
  const handleSave = async () => {
    try {
      const infoData = {
        category: '情報',
        recordTime: recordTime,
        infoType: infoType,
        priority: priority,
        infoContent: infoContent,
        dueDate: infoType === 'TODO' ? dueDate : '',
        dueTime: infoType === 'TODO' ? dueTime : '',
        isCompleted: infoType === 'TODO' ? isCompleted : false,
        useLocationInfo: useLocationInfo,
        location: useLocationInfo && currentLocation ? currentLocation : null,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        updatedAt: new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), infoData);
      } else {
        await addDoc(collection(db, 'records'), infoData);
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
        <h2>{editingRecord ? '情報記録編集' : '情報記録'}</h2>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>

      <div className="record-form">
        {/* 記録時刻 */}
        <div className="form-group">
          <label>記録時刻:</label>
          <input
            type="time"
            value={recordTime}
            onChange={(e) => setRecordTime(e.target.value)}
          />
        </div>

        {/* 種別選択 */}
        <div className="form-group">
          <label>種別:</label>
          <div className="info-type-buttons">
            <button
              className={`type-btn ${infoType === 'メモ' ? 'active' : ''}`}
              onClick={() => setInfoType('メモ')}
            >
              メモ
            </button>
            <button
              className={`type-btn ${infoType === 'TODO' ? 'active' : ''}`}
              onClick={() => setInfoType('TODO')}
            >
              TODO
            </button>
          </div>
        </div>

        {/* 重要度 - ボタン形式に変更 */}
        <div className="form-group">
          <label>重要度:</label>
          <div className="priority-buttons">
            <button
              className={`priority-btn high ${priority === '重要' ? 'active' : ''}`}
              onClick={() => setPriority('重要')}
            >
              🔴 重要
            </button>
            <button
              className={`priority-btn normal ${priority === '通常' ? 'active' : ''}`}
              onClick={() => setPriority('通常')}
            >
              🟡 通常
            </button>
            <button
              className={`priority-btn low ${priority === '低' ? 'active' : ''}`}
              onClick={() => setPriority('低')}
            >
              🟢 低
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="form-group">
          <label>{infoType}内容:</label>
          <textarea
            value={infoContent}
            onChange={(e) => setInfoContent(e.target.value)}
            placeholder={infoType === 'TODO' ? 'やることを入力してください' : 'メモ内容を入力してください'}
            rows="4"
            required
          />
        </div>

        {/* TODO固有の項目 */}
        {infoType === 'TODO' && (
          <div className="form-group">
            <label>期限設定:</label>
            <div className="due-date-inputs">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="期限日 (任意)"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="期限時刻 (任意)"
              />
            </div>
            
            <div className="completion-group">
              <label>完了状況:</label>
              <div className="completion-switch">
                <span className={`status-label ${!isCompleted ? 'active' : ''}`}>未完了</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={(e) => setIsCompleted(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span className={`status-label ${isCompleted ? 'active' : ''}`}>完了 {isCompleted ? '✅' : ''}</span>
              </div>
            </div>
          </div>
        )}

        {/* 位置情報 - スイッチに変更 */}
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
            rows="2"
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

export default InfoRecord;

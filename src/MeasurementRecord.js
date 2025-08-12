import { useAuth } from './contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';

function MeasurementRecord({ onBack, onSave, editingRecord }) {
  const { currentUser } = useAuth();
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [weight, setWeight] = useState('');
  const [bodyFatRate, setBodyFatRate] = useState('');
  const [bloodPressureHigh, setBloodPressureHigh] = useState('');
  const [bloodPressureLow, setBloodPressureLow] = useState('');
  const [waistSize, setWaistSize] = useState('');
  const [useLocationInfo, setUseLocationInfo] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [memo, setMemo] = useState('');

  // 設定から取得する身長
  const [height, setHeight] = useState(170.0);

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
        },
        (error) => {
          console.error('位置情報取得エラー:', error);
          setCurrentLocation(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else if (!useLocationInfo) {
      setCurrentLocation(null);
    }
  }, [useLocationInfo]);

  // 個人設定から身長を取得
  useEffect(() => {
    const fetchPersonalSettings = async () => {
      try {
        const docRef = doc(db, 'personal_settings', 'user_personal_settings');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.height) {
            setHeight(data.height);
          }
        }
      } catch (error) {
        console.error('個人設定取得エラー:', error);
      }
    };

    fetchPersonalSettings();
  }, []);

  // 編集時のデータ初期化
  useEffect(() => {
    if (editingRecord) {
      setRecordTime(editingRecord.recordTime || '');
      setWeight(editingRecord.weight ? editingRecord.weight.toString() : '');
      setBodyFatRate(editingRecord.bodyFatRate ? editingRecord.bodyFatRate.toString() : '');
      setBloodPressureHigh(editingRecord.bloodPressureHigh ? editingRecord.bloodPressureHigh.toString() : '');
      setBloodPressureLow(editingRecord.bloodPressureLow ? editingRecord.bloodPressureLow.toString() : '');
      setWaistSize(editingRecord.waistSize ? editingRecord.waistSize.toString() : '');
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
      
      // 編集時は既存の位置情報があれば設定
      if (editingRecord.location) {
        setCurrentLocation(editingRecord.location);
      }
    }
  }, [editingRecord]);

  // BMI計算
  const calculateBMI = () => {
    if (!weight || weight <= 0 || height <= 0) return null;
    const weightNum = parseFloat(weight);
    const heightM = height / 100; // cmをmに変換
    const bmi = weightNum / (heightM * heightM);
    return Math.round(bmi * 10) / 10; // 小数点1桁
  };

  const bmi = calculateBMI();

  // BMI判定
  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return '低体重';
    if (bmi < 25) return '普通体重';
    if (bmi < 30) return '肥満(1度)';
    return '肥満(2度以上)';
  };

  // 保存処理
  const handleSave = async () => {
    try {
      const measurementData = {
        category: '計量',
        userId: currentUser.uid,
        recordTime: recordTime,
        weight: parseFloat(weight) || null,
        bodyFatRate: parseFloat(bodyFatRate) || null,
        bloodPressureHigh: parseInt(bloodPressureHigh) || null,
        bloodPressureLow: parseInt(bloodPressureLow) || null,
        waistSize: parseFloat(waistSize) || null,
        bmi: bmi,
        bmiCategory: getBMICategory(bmi),
        height: height, // 計算に使用した身長も保存
        useLocationInfo: useLocationInfo,
        location: useLocationInfo && currentLocation ? currentLocation : null,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        updatedAt: new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), measurementData);
      } else {
        await addDoc(collection(db, 'records'), measurementData);
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

  return (
    <div className="record-screen">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <h2>{editingRecord ? '計量記録編集' : '計量記録'}</h2>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>

      <div className="record-form">
        {/* 測定時刻 */}
        <div className="form-group">
          <label>測定時刻:</label>
          <input
            type="time"
            value={recordTime}
            onChange={(e) => setRecordTime(e.target.value)}
          />
        </div>

        {/* 体重 */}
        <div className="form-group">
          <label>体重:</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="kg"
          />
        </div>

        {/* BMI表示 */}
        {bmi && (
          <div className="form-group">
            <label>BMI:</label>
            <div className="bmi-display">
              <span className="bmi-value">{bmi}</span>
              <span className="bmi-category">({getBMICategory(bmi)})</span>
            </div>
            <div className="bmi-note">身長: {height}cm で計算</div>
            {height === 170.0 && (
              <div className="settings-hint">
                💡 個人設定で身長を設定すると、より正確なBMIが計算されます
              </div>
            )}
          </div>
        )}

        {/* 体脂肪率 */}
        <div className="form-group">
          <label>体脂肪率:</label>
          <input
            type="number"
            step="0.1"
            value={bodyFatRate}
            onChange={(e) => setBodyFatRate(e.target.value)}
            placeholder="% (任意)"
          />
        </div>

        {/* 血圧 */}
        <div className="form-group">
          <label>血圧:</label>
          <div className="blood-pressure-inputs">
            <input
              type="number"
              value={bloodPressureHigh}
              onChange={(e) => setBloodPressureHigh(e.target.value)}
              placeholder="最高"
            />
            <span className="separator">/</span>
            <input
              type="number"
              value={bloodPressureLow}
              onChange={(e) => setBloodPressureLow(e.target.value)}
              placeholder="最低"
            />
            <span className="unit">mmHg (任意)</span>
          </div>
        </div>

        {/* 腹囲 */}
        <div className="form-group">
          <label>腹囲:</label>
          <input
            type="number"
            step="0.1"
            value={waistSize}
            onChange={(e) => setWaistSize(e.target.value)}
            placeholder="cm (任意)"
          />
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
            <span className="location-status">
              {!useLocationInfo ? '' :
               currentLocation ? '✅ 位置情報取得完了' : '📍 位置情報取得中...'}
            </span>
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

export default MeasurementRecord;

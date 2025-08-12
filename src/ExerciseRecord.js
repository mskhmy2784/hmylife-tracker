import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

function ExerciseRecord({ onBack, onSave, editingRecord }) {
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [exerciseType, setExerciseType] = useState('ランニング');
  const [exerciseContent, setExerciseContent] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [exerciseLocation, setExerciseLocation] = useState('');
  const [exerciseLocationInput, setExerciseLocationInput] = useState('');
  const [isCustomExerciseLocation, setIsCustomExerciseLocation] = useState(false);
  const [useLocationInfo, setUseLocationInfo] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [memo, setMemo] = useState('');

  // マスタデータ
  const [masterExerciseTypes, setMasterExerciseTypes] = useState([]);
  const [masterLocations, setMasterLocations] = useState([]);
  const [loadingMasterData, setLoadingMasterData] = useState(true);

  // フォールバック用データ
  const fallbackExerciseTypes = [
    'ランニング',
    'ウォーキング',
    '筋トレ',
    '自転車',
    '水泳',
    'ヨガ',
    'ストレッチ',
    'その他'
  ];

  const fallbackLocations = [
    '自宅',
    'ジムA',
    '近所の公園',
    'プール',
    '会社のジム',
    'ヨガスタジオ'
  ];

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

  // マスタデータ読み込み
  useEffect(() => {
    // 運動種類のマスタデータ
    const exerciseTypesQuery = query(
      collection(db, 'master_exercise_types'),
      orderBy('order', 'asc')
    );

    const unsubscribeExerciseTypes = onSnapshot(exerciseTypesQuery, 
      (querySnapshot) => {
        const types = [];
        querySnapshot.forEach((doc) => {
          types.push({ id: doc.id, ...doc.data() });
        });
        setMasterExerciseTypes(types);
      },
      (error) => {
        console.error('運動種類マスタデータ取得エラー:', error);
      }
    );

    // 場所のマスタデータ
    const locationsQuery = query(
      collection(db, 'master_locations'),
      orderBy('order', 'asc')
    );

    const unsubscribeLocations = onSnapshot(locationsQuery, 
      (querySnapshot) => {
        const locations = [];
        querySnapshot.forEach((doc) => {
          locations.push({ id: doc.id, ...doc.data() });
        });
        setMasterLocations(locations);
        setLoadingMasterData(false);
      },
      (error) => {
        console.error('場所マスタデータ取得エラー:', error);
        setLoadingMasterData(false);
      }
    );

    return () => {
      unsubscribeExerciseTypes();
      unsubscribeLocations();
    };
  }, []);

  // 編集時のデータ初期化
  useEffect(() => {
    if (editingRecord) {
      setRecordTime(editingRecord.recordTime || '');
      setExerciseType(editingRecord.exerciseType || 'ランニング');
      setExerciseContent(editingRecord.exerciseContent || '');
      setCaloriesBurned(editingRecord.caloriesBurned ? editingRecord.caloriesBurned.toString() : '');
      setDuration(editingRecord.duration ? editingRecord.duration.toString() : '');
      setDistance(editingRecord.distance ? editingRecord.distance.toString() : '');
      setWeight(editingRecord.weight ? editingRecord.weight.toString() : '');
      setReps(editingRecord.reps ? editingRecord.reps.toString() : '');
      setExerciseLocation(editingRecord.exerciseLocation || '');
      setExerciseLocationInput('');
      setIsCustomExerciseLocation(false);
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
    }
  }, [editingRecord]);

  // 保存処理
  const handleSave = async () => {
    try {
      const exerciseData = {
        category: '運動',
        recordTime: recordTime,
        exerciseType: exerciseType,
        exerciseContent: exerciseContent,
        caloriesBurned: parseInt(caloriesBurned) || null,
        duration: parseInt(duration) || null,
        distance: parseFloat(distance) || null,
        weight: parseFloat(weight) || null,
        reps: parseInt(reps) || null,
        exerciseLocation: isCustomExerciseLocation ? exerciseLocationInput : exerciseLocation,
        useLocationInfo: useLocationInfo,
        location: useLocationInfo && currentLocation ? currentLocation : null,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        updatedAt: new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), exerciseData);
      } else {
        await addDoc(collection(db, 'records'), exerciseData);
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

  // 使用するデータを決定
  const getExerciseTypeOptions = () => {
    if (masterExerciseTypes.length > 0) {
      return masterExerciseTypes.map(type => type.name);
    }
    return fallbackExerciseTypes;
  };

  const getLocationOptions = () => {
    if (masterLocations.length > 0) {
      return masterLocations.map(location => location.name);
    }
    return fallbackLocations;
  };

  const exerciseTypeOptions = getExerciseTypeOptions();
  const locationOptions = getLocationOptions();

  return (
    <div className="record-screen">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <h2>{editingRecord ? '運動記録編集' : '運動記録'}</h2>
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

        {/* 運動種類 */}
        <div className="form-group">
          <label>運動種類:</label>
          {loadingMasterData ? (
            <div className="loading-text">マスタデータ読み込み中...</div>
          ) : (
            <select
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
            >
              {exerciseTypeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
          {masterExerciseTypes.length === 0 && !loadingMasterData && (
            <div className="master-data-hint">
              💡 設定画面で運動種類を追加できます
            </div>
          )}
        </div>

        {/* 運動内容 */}
        <div className="form-group">
          <label>運動内容:</label>
          <textarea
            value={exerciseContent}
            onChange={(e) => setExerciseContent(e.target.value)}
            placeholder="具体的な運動内容"
            rows="3"
          />
        </div>

        {/* 運動データ */}
        <div className="form-group">
          <label>運動データ:</label>
          
          <div className="exercise-data-grid">
            <div className="data-item">
              <label>消費カロリー:</label>
              <input
                type="number"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                placeholder="kcal"
              />
            </div>
            
            <div className="data-item">
              <label>運動時間:</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="分"
              />
            </div>
            
            <div className="data-item">
              <label>距離:</label>
              <input
                type="number"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="km"
              />
            </div>
            
            <div className="data-item">
              <label>重量:</label>
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="kg"
              />
            </div>
            
            <div className="data-item">
              <label>回数:</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="回"
              />
            </div>
          </div>
        </div>

        {/* 運動場所 */}
        <div className="form-group">
          <label>運動場所:</label>
          {loadingMasterData ? (
            <div className="loading-text">マスタデータ読み込み中...</div>
          ) : (
            <div className="location-selection">
              <select
                value={isCustomExerciseLocation ? 'custom' : exerciseLocation}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomExerciseLocation(true);
                    setExerciseLocation('');
                  } else {
                    setIsCustomExerciseLocation(false);
                    setExerciseLocation(e.target.value);
                  }
                }}
              >
                <option value="">
                  {masterLocations.length > 0 ? '登録された場所を選択' : 'よく行く場所を選択'}
                </option>
                {locationOptions.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
                <option value="custom">手入力で追加</option>
              </select>
              
              {isCustomExerciseLocation && (
                <input
                  type="text"
                  value={exerciseLocationInput}
                  onChange={(e) => setExerciseLocationInput(e.target.value)}
                  placeholder="場所名を入力"
                  className="custom-input"
                />
              )}
            </div>
          )}
          {masterLocations.length === 0 && !loadingMasterData && (
            <div className="master-data-hint">
              💡 設定画面で場所を追加できます
            </div>
          )}
        </div>

        {/* 位置情報・メモ */}
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

export default ExerciseRecord;

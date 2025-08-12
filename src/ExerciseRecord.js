import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';

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
  const [memo, setMemo] = useState('');

  // マスタデータの状態
  const [locations, setLocations] = useState([]);

  // ユーザー設定情報
  const [userWeight, setUserWeight] = useState(65); // デフォルト値
  const [userHeight, setUserHeight] = useState(170);
  const [userAge, setUserAge] = useState(30);
  const [userGender, setUserGender] = useState('male');
  const [userBMR, setUserBMR] = useState(1500); // 基礎代謝

  // 運動種類のマスタデータ（固定値）
  const exerciseTypes = [
    'ランニング',
    'ウォーキング',
    '筋トレ',
    '自転車',
    '水泳',
    'ヨガ',
    'ストレッチ',
    'その他'
  ];

  // 運動強度（METs値）
  const exerciseMETs = {
    'ランニング': 8.0,
    'ウォーキング': 3.5,
    '筋トレ': 6.0,
    '自転車': 7.5,
    '水泳': 8.0,
    'ヨガ': 2.5,
    'ストレッチ': 2.3,
    'その他': 4.0
  };

  // ユーザー設定の読み込み
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'settings', 'userInfo'));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.height) setUserHeight(data.height);
          if (data.gender) setUserGender(data.gender);
          if (data.birthDate) {
            // 年齢計算
            const today = new Date();
            const birth = new Date(data.birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
              age--;
            }
            setUserAge(age);
          }
        }

        // 最新の体重を取得（計量記録から）
        const today = new Date().toDateString();
        const measurementQuery = query(
          collection(db, 'records'),
          orderBy('createdAt', 'desc')
        );
        
        // 最新の計量記録を検索
        const unsubscribe = onSnapshot(measurementQuery, (snapshot) => {
          const measurementRecord = snapshot.docs.find(doc => 
            doc.data().category === '計量' && doc.data().weight
          );
          
          if (measurementRecord) {
            const data = measurementRecord.data();
            setUserWeight(data.weight);
            if (data.bmr) {
              setUserBMR(data.bmr);
            } else {
              // BMRが保存されていない場合は計算
              calculateBMR(data.weight);
            }
          } else {
            // 計量記録がない場合はデフォルト値で計算
            calculateBMR(userWeight);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('ユーザー設定読み込みエラー:', error);
        calculateBMR(userWeight);
      }
    };
    loadUserSettings();
  }, [userHeight, userAge, userGender]);

  // 基礎代謝計算（Harris-Benedict式）
  const calculateBMR = (weight) => {
    if (!weight || !userHeight || !userAge) return;
    
    let bmr;
    if (userGender === 'male') {
      bmr = Math.round(88.362 + (13.397 * weight) + (4.799 * userHeight) - (5.677 * userAge));
    } else {
      bmr = Math.round(447.593 + (9.247 * weight) + (3.098 * userHeight) - (4.330 * userAge));
    }
    setUserBMR(bmr);
  };

  // 消費カロリー推定計算
  const calculateEstimatedCalories = () => {
    if (!duration || !userWeight) return null;
    
    const durationHours = parseInt(duration) / 60; // 分を時間に変換
    const mets = exerciseMETs[exerciseType] || 4.0;
    
    // 消費カロリー = METs × 体重(kg) × 時間(h) × 1.05
    const estimatedCalories = Math.round(mets * userWeight * durationHours * 1.05);
    return estimatedCalories;
  };

  const estimatedCalories = calculateEstimatedCalories();

  // マスタデータの読み込み
  useEffect(() => {
    // 場所の読み込み
    const unsubscribeLocations = onSnapshot(
      query(collection(db, 'masterData', 'locations', 'items'), orderBy('name')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data().name);
        setLocations(items);
      },
      (error) => {
        console.error('場所マスタ読み込みエラー:', error);
        // エラー時はデフォルト値を使用
        setLocations([
          '自宅',
          'ジムA',
          '近所の公園',
          'プール',
          '会社のジム',
          'ヨガスタジオ'
        ]);
      }
    );

    return () => {
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
        estimatedCalories: estimatedCalories, // 推定カロリーも保存
        duration: parseInt(duration) || null,
        distance: parseFloat(distance) || null,
        weight: parseFloat(weight) || null,
        reps: parseInt(reps) || null,
        exerciseLocation: isCustomExerciseLocation ? exerciseLocationInput : exerciseLocation,
        useLocationInfo: useLocationInfo,
        memo: memo,
        // 計算に使用したパラメータも保存
        userWeight: userWeight,
        userBMR: userBMR,
        userAge: userAge,
        userGender: userGender,
        metsValue: exerciseMETs[exerciseType] || 4.0,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), exerciseData);
        alert('運動記録を更新しました！');
      } else {
        await addDoc(collection(db, 'records'), exerciseData);
        alert('運動記録を保存しました！');
      }
      
      onSave();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!editingRecord) return;
    
    const confirmDelete = window.confirm('この記録を削除しますか？');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'records', editingRecord.id));
      alert('運動記録を削除しました');
      onSave();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="exercise-record">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>←</button>
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
          <select
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value)}
          >
            {exerciseTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
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
              <label>運動時間:</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="分"
              />
            </div>
            
            <div className="data-item">
              <label>消費カロリー:</label>
              <div className="calories-input-section">
                <input
                  type="number"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  placeholder="kcal"
                />
                {estimatedCalories && (
                  <div className="calorie-estimation">
                    <div className="estimated-value">
                      推定: {estimatedCalories} kcal
                    </div>
                    <button 
                      type="button"
                      className="use-estimated-btn"
                      onClick={() => setCaloriesBurned(estimatedCalories.toString())}
                    >
                      推定値を使用
                    </button>
                  </div>
                )}
              </div>
              {estimatedCalories && (
                <div className="estimation-info">
                  {exerciseType} (METs: {exerciseMETs[exerciseType]}) × {userWeight}kg × {duration}分で計算
                </div>
              )}
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

          {/* 基礎代謝情報表示 */}
          <div className="bmr-info">
            <div className="info-title">参考情報</div>
            <div className="info-details">
              基礎代謝: {userBMR} kcal/日 | 体重: {userWeight}kg | {userAge}歳 {userGender === 'male' ? '男性' : '女性'}
            </div>
          </div>
        </div>

        {/* 運動場所 */}
        <div className="form-group">
          <label>運動場所:</label>
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
              <option value="">選択してください</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
              <option value="custom">その他（手入力）</option>
            </select>
            
            {isCustomExerciseLocation && (
              <input
                type="text"
                value={exerciseLocationInput}
                onChange={(e) => setExerciseLocationInput(e.target.value)}
                placeholder="運動場所を入力"
                style={{ marginTop: '5px' }}
              />
            )}
          </div>
        </div>

        {/* 位置情報・メモ */}
        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="useLocationInfo"
              checked={useLocationInfo}
              onChange={(e) => setUseLocationInfo(e.target.checked)}
            />
            <label htmlFor="useLocationInfo">位置情報を記録</label>
            <span className="location-status">📍現在地取得中...</span>
          </div>
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

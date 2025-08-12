import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

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
  const [errors, setErrors] = useState({});

  // 運動種類のマスタデータ（今後はFirestoreから取得）
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

  // よく行く運動場所のマスタデータ（今後はFirestoreから取得）
  const commonExerciseLocations = [
    '自宅',
    'ジムA',
    '近所の公園',
    'プール',
    '会社のジム',
    'ヨガスタジオ'
  ];

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

  // バリデーション
  const validateForm = () => {
    const newErrors = {};

    // 運動内容チェック（必須）
    if (!exerciseContent.trim()) {
      newErrors.exerciseContent = '運動内容を入力してください';
    }

    // 数値の妥当性チェック（負の値禁止）
    if (caloriesBurned && parseInt(caloriesBurned) < 0) {
      newErrors.caloriesBurned = '消費カロリーは0以上で入力してください';
    }

    if (duration && parseInt(duration) < 0) {
      newErrors.duration = '運動時間は0以上で入力してください';
    }

    if (distance && parseFloat(distance) < 0) {
      newErrors.distance = '距離は0以上で入力してください';
    }

    if (weight && parseFloat(weight) < 0) {
      newErrors.weight = '重量は0以上で入力してください';
    }

    if (reps && parseInt(reps) < 0) {
      newErrors.reps = '回数は0以上で入力してください';
    }

    // 数値の上限チェック
    if (caloriesBurned && parseInt(caloriesBurned) > 10000) {
      newErrors.caloriesBurned = '消費カロリーは10000kcal以下で入力してください';
    }

    if (duration && parseInt(duration) > 1440) {
      newErrors.duration = '運動時間は1440分(24時間)以下で入力してください';
    }

    if (distance && parseFloat(distance) > 1000) {
      newErrors.distance = '距離は1000km以下で入力してください';
    }

    if (weight && parseFloat(weight) > 1000) {
      newErrors.weight = '重量は1000kg以下で入力してください';
    }

    if (reps && parseInt(reps) > 10000) {
      newErrors.reps = '回数は10000回以下で入力してください';
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
        memo: memo,
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
          <label>運動内容: <span className="required">*</span></label>
          <textarea
            value={exerciseContent}
            onChange={(e) => {
              setExerciseContent(e.target.value);
              if (errors.exerciseContent) {
                setErrors({...errors, exerciseContent: ''});
              }
            }}
            placeholder="具体的な運動内容"
            rows="3"
            className={errors.exerciseContent ? 'error' : ''}
          />
          {errors.exerciseContent && <span className="error-message">{errors.exerciseContent}</span>}
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
                onChange={(e) => {
                  setCaloriesBurned(e.target.value);
                  if (errors.caloriesBurned) {
                    setErrors({...errors, caloriesBurned: ''});
                  }
                }}
                placeholder="kcal"
                min="0"
                max="10000"
                className={errors.caloriesBurned ? 'error' : ''}
              />
              {errors.caloriesBurned && <span className="error-message">{errors.caloriesBurned}</span>}
            </div>
            
            <div className="data-item">
              <label>運動時間:</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  if (errors.duration) {
                    setErrors({...errors, duration: ''});
                  }
                }}
                placeholder="分"
                min="0"
                max="1440"
                className={errors.duration ? 'error' : ''}
              />
              {errors.duration && <span className="error-message">{errors.duration}</span>}
            </div>
            
            <div className="data-item">
              <label>距離:</label>
              <input
                type="number"
                step="0.1"
                value={distance}
                onChange={(e) => {
                  setDistance(e.target.value);
                  if (errors.distance) {
                    setErrors({...errors, distance: ''});
                  }
                }}
                placeholder="km"
                min="0"
                max="1000"
                className={errors.distance ? 'error' : ''}
              />
              {errors.distance && <span className="error-message">{errors.distance}</span>}
            </div>
            
            <div className="data-item">
              <label>重量:</label>
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  if (errors.weight) {
                    setErrors({...errors, weight: ''});
                  }
                }}
                placeholder="kg"
                min="0"
                max="1000"
                className={errors.weight ? 'error' : ''}
              />
              {errors.weight && <span className="error-message">{errors.weight}</span>}
            </div>
            
            <div className="data-item">
              <label>回数:</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => {
                  setReps(e.target.value);
                  if (errors.reps) {
                    setErrors({...errors, reps: ''});
                  }
                }}
                placeholder="回"
                min="0"
                max="10000"
                className={errors.reps ? 'error' : ''}
              />
              {errors.reps && <span className="error-message">{errors.reps}</span>}
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
              <option value="">よく行く場所を選択</option>
              {commonExerciseLocations.map(location => (
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
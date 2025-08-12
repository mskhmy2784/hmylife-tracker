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
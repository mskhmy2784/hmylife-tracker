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
  const [memo, setMemo] = useState('');

  // 編集時のデータ初期化
  useEffect(() => {
    if (editingRecord) {
      setWakeTime(editingRecord.wakeTime || '');
      setSleepTime(editingRecord.sleepTime || '23:00');
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
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

  // 保存処理
  const handleSave = async () => {
    try {
      const sleepData = {
        category: '睡眠',
        wakeTime: wakeTime,
        sleepTime: sleepTime,
        sleepHours: sleepDuration.hours,
        sleepMinutes: sleepDuration.minutes,
        totalSleepMinutes: sleepDuration.totalMinutes,
        useLocationInfo: useLocationInfo,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), sleepData);
        alert('睡眠記録を更新しました！');
      } else {
        await addDoc(collection(db, 'records'), sleepData);
        alert('睡眠記録を保存しました！');
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
      alert('睡眠記録を削除しました');
      onSave();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="sleep-record">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>←</button>
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
          />
        </div>

        {/* 就寝時刻 */}
        <div className="form-group">
          <label>就寝時刻:</label>
          <input
            type="time"
            value={sleepTime}
            onChange={(e) => setSleepTime(e.target.value)}
          />
          <div className="sleep-note">前日の就寝時刻</div>
        </div>

        {/* 睡眠時間（自動計算） */}
        <div className="form-group">
          <label>睡眠時間:</label>
          <div className="sleep-duration">
            {sleepDuration.text}
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
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
  const [memo, setMemo] = useState('');

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
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), infoData);
        alert('情報記録を更新しました！');
      } else {
        await addDoc(collection(db, 'records'), infoData);
        alert('情報記録を保存しました！');
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
      alert('情報記録を削除しました');
      onSave();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="info-record">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>←</button>
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

        {/* 重要度 */}
        <div className="form-group">
          <label>重要度:</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="重要">重要</option>
            <option value="通常">通常</option>
            <option value="低">低</option>
          </select>
        </div>

        {/* 情報内容 */}
        <div className="form-group">
          <label>情報内容:</label>
          <textarea
            value={infoContent}
            onChange={(e) => setInfoContent(e.target.value)}
            placeholder="メモまたはTODOの内容"
            rows="4"
          />
        </div>

        {/* TODO専用項目 */}
        {infoType === 'TODO' && (
          <div className="todo-specific">
            <div className="form-group">
              <label>期限:</label>
              <div className="due-date-inputs">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="日付 (任意)"
                />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  placeholder="時刻 (任意)"
                />
              </div>
            </div>

            <div className="form-group">
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
          </div>
        )}

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

export default InfoRecord;
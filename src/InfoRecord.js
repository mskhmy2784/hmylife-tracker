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
  const [errors, setErrors] = useState({});

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

  // バリデーション
  const validateForm = () => {
    const newErrors = {};

    // 情報内容チェック（必須）
    if (!infoContent.trim()) {
      newErrors.infoContent = '情報内容を入力してください';
    }

    // TODO期限の論理チェック
    if (infoType === 'TODO' && dueDate) {
      const today = new Date();
      const selectedDate = new Date(dueDate);
      
      // 過去の日付チェック（当日は許可）
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = '期限は今日以降の日付を設定してください';
      }
      
      // 時刻が設定されている場合の詳細チェック
      if (dueTime) {
        const now = new Date();
        const dueDatetime = new Date(dueDate + 'T' + dueTime);
        
        // 今日の日付で過去の時刻をチェック
        if (selectedDate.getTime() === today.getTime() && dueDatetime < now) {
          newErrors.dueTime = '今日の期限は現在時刻以降を設定してください';
        }
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
          <label>情報内容: <span className="required">*</span></label>
          <textarea
            value={infoContent}
            onChange={(e) => {
              setInfoContent(e.target.value);
              if (errors.infoContent) {
                setErrors({...errors, infoContent: ''});
              }
            }}
            placeholder="メモまたはTODOの内容"
            rows="4"
            className={errors.infoContent ? 'error' : ''}
          />
          {errors.infoContent && <span className="error-message">{errors.infoContent}</span>}
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
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (errors.dueDate || errors.dueTime) {
                      setErrors({...errors, dueDate: '', dueTime: ''});
                    }
                  }}
                  placeholder="日付 (任意)"
                  className={errors.dueDate ? 'error' : ''}
                />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => {
                    setDueTime(e.target.value);
                    if (errors.dueTime) {
                      setErrors({...errors, dueTime: ''});
                    }
                  }}
                  placeholder="時刻 (任意)"
                  className={errors.dueTime ? 'error' : ''}
                />
              </div>
              {errors.dueDate && <span className="error-message">{errors.dueDate}</span>}
              {errors.dueTime && <span className="error-message">{errors.dueTime}</span>}
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
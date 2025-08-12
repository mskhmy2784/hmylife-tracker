import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
  
  // 写真関連の状態を追加
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
      setPhotos(editingRecord.photos || []); // 既存の写真を読み込み
    }
  }, [editingRecord]);

  // 写真撮影・選択処理
  const handlePhotoCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // ファイル名を生成（日時 + ランダム文字列）
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `info-photos/${timestamp}_${randomId}.jpg`;
      
      // Firebase Storage にアップロード
      const imageRef = ref(storage, fileName);
      await uploadBytes(imageRef, file);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(imageRef);
      
      // 写真リストに追加
      setPhotos(prev => [...prev, {
        url: downloadURL,
        fileName: fileName,
        uploadedAt: new Date()
      }]);
      
      alert('写真をアップロードしました！');
    } catch (error) {
      console.error('写真アップロードエラー:', error);
      alert('写真のアップロードに失敗しました');
    } finally {
      setUploadingPhoto(false);
      // input要素をリセット（同じファイルを再選択可能にする）
      event.target.value = '';
    }
  };

  // 写真削除処理
  const handlePhotoDelete = async (photoIndex) => {
    const photo = photos[photoIndex];
    if (!photo) return;

    const confirmDelete = window.confirm('この写真を削除しますか？');
    if (!confirmDelete) return;

    try {
      // Firebase Storage から削除
      const imageRef = ref(storage, photo.fileName);
      await deleteObject(imageRef);
      
      // 状態から削除
      setPhotos(prev => prev.filter((_, index) => index !== photoIndex));
      
      alert('写真を削除しました');
    } catch (error) {
      console.error('写真削除エラー:', error);
      alert('写真の削除に失敗しました');
    }
  };

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
        photos: photos, // 写真データを追加
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
      // 関連する写真もStorage から削除
      for (const photo of photos) {
        try {
          const imageRef = ref(storage, photo.fileName);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('写真削除エラー:', error);
        }
      }
      
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

        {/* 情報種別 */}
        <div className="form-group">
          <label>情報種別:</label>
          <div className="info-type-buttons">
            {['メモ', 'TODO'].map(type => (
              <button
                key={type}
                className={`type-btn ${infoType === type ? 'active' : ''}`}
                onClick={() => setInfoType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 優先度 */}
        <div className="form-group">
          <label>優先度:</label>
          <div className="priority-buttons">
            {[
              { value: '重要', icon: '🔴', label: '重要' },
              { value: '通常', icon: '🟡', label: '通常' },
              { value: '低', icon: '🟢', label: '低' }
            ].map(item => (
              <button
                key={item.value}
                className={`priority-btn ${priority === item.value ? 'active' : ''}`}
                onClick={() => setPriority(item.value)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 情報内容 */}
        <div className="form-group">
          <label>情報内容:</label>
          <textarea
            value={infoContent}
            onChange={(e) => setInfoContent(e.target.value)}
            placeholder="情報の詳細を入力してください"
            rows="4"
          />
        </div>

        {/* TODO用の期限設定 */}
        {infoType === 'TODO' && (
          <div className="todo-section">
            <div className="form-group">
              <label>期限:</label>
              <div className="due-date-input">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  style={{ marginLeft: '10px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>完了状態:</label>
              <div className="completion-toggle">
                <div className="toggle-container">
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

        {/* 写真撮影・選択 */}
        <div className="form-group">
          <label>写真（資料・メモ・スクリーンショットなど）:</label>
          <div className="photo-section">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              disabled={uploadingPhoto}
              style={{ marginBottom: '10px' }}
            />
            {uploadingPhoto && <p>アップロード中...</p>}
            
            {/* 撮影済み写真の表示 */}
            {photos.length > 0 && (
              <div className="photos-grid">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img 
                      src={photo.url} 
                      alt={`情報写真 ${index + 1}`}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    <button 
                      className="photo-delete-btn"
                      onClick={() => handlePhotoDelete(index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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

export default InfoRecord;

import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

function ExpenseRecord({ onBack, onSave, editingRecord }) {
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [paymentLocation, setPaymentLocation] = useState('');
  const [paymentLocationInput, setPaymentLocationInput] = useState('');
  const [isCustomPaymentLocation, setIsCustomPaymentLocation] = useState(false);
  const [expenseContent, setExpenseContent] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('現金');
  const [useLocationInfo, setUseLocationInfo] = useState(true);
  const [memo, setMemo] = useState('');
  
  // 写真関連の状態
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // マスタデータの状態
  const [paymentLocations, setPaymentLocations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // マスタデータの読み込み
  useEffect(() => {
    // 支払先の読み込み
    const unsubscribePaymentLocations = onSnapshot(
      query(collection(db, 'masterData', 'paymentLocations', 'items'), orderBy('name')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data().name);
        setPaymentLocations(items);
      },
      (error) => {
        console.error('支払先マスタ読み込みエラー:', error);
        // エラー時はデフォルト値を使用
        setPaymentLocations([
          'ファミリーマート',
          'セブンイレブン', 
          'ローソン',
          'スターバックス',
          'マクドナルド',
          'イオン',
          'ヨドバシカメラ',
          'ガソリンスタンド'
        ]);
      }
    );

    // 支払方法の読み込み
    const unsubscribePaymentMethods = onSnapshot(
      query(collection(db, 'masterData', 'paymentMethods', 'items'), orderBy('name')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data().name);
        setPaymentMethods(items);
      },
      (error) => {
        console.error('支払方法マスタ読み込みエラー:', error);
        // エラー時はデフォルト値を使用
        setPaymentMethods([
          '現金',
          'クレジットカード',
          '電子マネー',
          '交通系IC',
          'QRコード決済',
          'デビットカード'
        ]);
      }
    );

    return () => {
      unsubscribePaymentLocations();
      unsubscribePaymentMethods();
    };
  }, []);

  // 編集時のデータ初期化
  useEffect(() => {
    if (editingRecord) {
      setRecordTime(editingRecord.recordTime || '');
      setPaymentLocation(editingRecord.paymentLocation || '');
      setPaymentLocationInput('');
      setIsCustomPaymentLocation(false);
      setExpenseContent(editingRecord.expenseContent || '');
      setAmount(editingRecord.amount ? editingRecord.amount.toString() : '');
      setPaymentMethod(editingRecord.paymentMethod || (paymentMethods.length > 0 ? paymentMethods[0] : '現金'));
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
      setPhotos(editingRecord.photos || []); // 既存の写真を読み込み
    }
  }, [editingRecord, paymentMethods]);

  // 写真撮影・選択処理
  const handlePhotoCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // ファイル名を生成（日時 + ランダム文字列）
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `expense-photos/${timestamp}_${randomId}.jpg`;
      
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
      const expenseData = {
        category: '支出',
        recordTime: recordTime,
        paymentLocation: isCustomPaymentLocation ? paymentLocationInput : paymentLocation,
        expenseContent: expenseContent,
        amount: parseInt(amount) || 0,
        paymentMethod: paymentMethod,
        useLocationInfo: useLocationInfo,
        memo: memo,
        photos: photos, // 写真データを追加
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), expenseData);
        alert('支出記録を更新しました！');
      } else {
        await addDoc(collection(db, 'records'), expenseData);
        alert('支出記録を保存しました！');
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
      alert('支出記録を削除しました');
      onSave();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="expense-record">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{editingRecord ? '支出記録編集' : '支出記録'}</h2>
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

        {/* 支払先 */}
        <div className="form-group">
          <label>支払先:</label>
          <div className="location-selection">
            <select
              value={isCustomPaymentLocation ? 'custom' : paymentLocation}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomPaymentLocation(true);
                  setPaymentLocation('');
                } else {
                  setIsCustomPaymentLocation(false);
                  setPaymentLocation(e.target.value);
                }
              }}
            >
              <option value="">選択してください</option>
              {commonStores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
              <option value="custom">その他（手入力）</option>
            </select>
            
            {isCustomPaymentLocation && (
              <input
                type="text"
                value={paymentLocationInput}
                onChange={(e) => setPaymentLocationInput(e.target.value)}
                placeholder="店舗名を入力"
                style={{ marginTop: '5px' }}
              />
            )}
          </div>
        </div>

        {/* 支出内容 */}
        <div className="form-group">
          <label>支出内容:</label>
          <input
            type="text"
            value={expenseContent}
            onChange={(e) => setExpenseContent(e.target.value)}
            placeholder="購入した商品・サービス"
          />
        </div>

        {/* 金額 */}
        <div className="form-group">
          <label>金額:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="円"
          />
        </div>

        {/* 支払方法 */}
        <div className="form-group">
          <label>支払方法:</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        {/* 写真撮影・選択 */}
        <div className="form-group">
          <label>写真（レシート・商品など）:</label>
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
                      alt={`支出写真 ${index + 1}`}
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

export default ExpenseRecord;

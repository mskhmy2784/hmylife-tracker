import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

function MealRecord({ onBack, onSave, editingRecord }) {
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  // 時間に応じた食事種別のデフォルト設定
  const getDefaultMealType = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 5 && hour < 10) return '朝食';
    if (hour >= 10 && hour < 15) return '昼食';
    if (hour >= 15 && hour < 21) return '夕食';
    return '間食';
  };
  
  const [mealType, setMealType] = useState(getDefaultMealType());
  const [calories, setCalories] = useState('');
  const [useDefault, setUseDefault] = useState(false);
  const [mealContent, setMealContent] = useState('');
  const [isExternalMeal, setIsExternalMeal] = useState(false);
  const [paymentLocation, setPaymentLocation] = useState('');
  const [paymentLocationInput, setPaymentLocationInput] = useState('');
  const [isCustomPaymentLocation, setIsCustomPaymentLocation] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
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
    // デフォルトカロリー設定の読み込み
    const loadDefaultCalories = async () => {
      try {
        const caloriesDoc = await getDoc(doc(db, 'settings', 'defaultCalories'));
        if (caloriesDoc.exists()) {
          setDefaultCalories(caloriesDoc.data());
        }
      } catch (error) {
        console.error('デフォルトカロリー読み込みエラー:', error);
      }
    };
    loadDefaultCalories();

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
          '吉野家',
          'すき家'
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

  // 支払方法の初期値設定
  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethod && !editingRecord) {
      setPaymentMethod(paymentMethods[0]);
    }
  }, [paymentMethods, paymentMethod, editingRecord]);

  // 編集時のデータ初期化
  useEffect(() => {
    if (editingRecord) {
      setRecordTime(editingRecord.recordTime || '');
      setMealType(editingRecord.mealType || '昼食');
      setCalories(editingRecord.calories ? editingRecord.calories.toString() : '');
      setUseDefault(false);
      setMealContent(editingRecord.mealContent || '');
      setIsExternalMeal(editingRecord.isExternalMeal || false);
      setPaymentLocation(editingRecord.paymentLocation || '');
      setPaymentLocationInput('');
      setIsCustomPaymentLocation(false);
      setAmount(editingRecord.amount ? editingRecord.amount.toString() : '');
      setPaymentMethod(editingRecord.paymentMethod || (paymentMethods.length > 0 ? paymentMethods[0] : '現金'));
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
      setPhotos(editingRecord.photos || []); // 既存の写真を読み込み
    }
  }, [editingRecord, paymentMethods]);

  // デフォルトカロリー設定
  const defaultCalories = {
    '朝食': 500,
    '昼食': 700,
    '夕食': 600,
    '間食': 200
  };

  // 写真撮影・選択処理
  const handlePhotoCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // ファイル名を生成（日時 + ランダム文字列）
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `meal-photos/${timestamp}_${randomId}.jpg`;
      
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
    // バリデーション
    if (!mealContent.trim()) {
      alert('食事内容を入力してください');
      return;
    }

    if (!useDefault && (!calories || parseInt(calories) <= 0)) {
      alert('カロリーを正しく入力してください');
      return;
    }

    if (isExternalMeal) {
      const finalPaymentLocation = isCustomPaymentLocation ? paymentLocationInput : paymentLocation;
      if (!finalPaymentLocation.trim()) {
        alert('外食時は支払先を入力してください');
        return;
      }
      
      if (!amount || parseInt(amount) <= 0) {
        alert('外食時は金額を正しく入力してください');
        return;
      }
    }

    try {
      const finalCalories = useDefault ? defaultCalories[mealType] : parseInt(calories) || 0;
      
      const mealData = {
        category: '食事',
        recordTime: recordTime,
        mealType: mealType,
        calories: finalCalories,
        mealContent: mealContent,
        isExternalMeal: isExternalMeal,
        paymentLocation: isExternalMeal ? (isCustomPaymentLocation ? paymentLocationInput : paymentLocation) : '',
        amount: isExternalMeal ? parseInt(amount) || 0 : 0,
        paymentMethod: isExternalMeal ? paymentMethod : '',
        useLocationInfo: useLocationInfo,
        memo: memo,
        photos: photos, // 写真データを追加
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), mealData);
        alert('食事記録を更新しました！');
      } else {
        await addDoc(collection(db, 'records'), mealData);
        alert('食事記録を保存しました！');
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
      alert('食事記録を削除しました');
      onSave();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="meal-record">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{editingRecord ? '食事記録編集' : '食事記録'}</h2>
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

        {/* 食事種別 */}
        <div className="form-group">
          <label>食事種別:</label>
          <div className="meal-type-buttons">
            {['朝食', '昼食', '夕食', '間食'].map(type => (
              <button
                key={type}
                className={`type-btn ${mealType === type ? 'active' : ''}`}
                onClick={() => setMealType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* カロリー */}
        <div className="form-group">
          <label>カロリー:</label>
          <div className="calories-input">
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="kcal"
              disabled={useDefault}
            />
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="useDefault"
                checked={useDefault}
                onChange={(e) => setUseDefault(e.target.checked)}
              />
              <label htmlFor="useDefault">
                デフォルト値使用 ({defaultCalories[mealType]}kcal)
              </label>
            </div>
          </div>
        </div>

        {/* 食事内容 */}
        <div className="form-group">
          <label>食事内容:</label>
          <textarea
            value={mealContent}
            onChange={(e) => setMealContent(e.target.value)}
            placeholder="何を食べましたか？"
            rows="3"
          />
        </div>

        {/* 写真撮影・選択 */}
        <div className="form-group">
          <label>写真:</label>
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
                      alt={`食事写真 ${index + 1}`}
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

        {/* 外食チェックボックス */}
        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="isExternalMeal"
              checked={isExternalMeal}
              onChange={(e) => setIsExternalMeal(e.target.checked)}
            />
            <label htmlFor="isExternalMeal">外食（支払いあり）</label>
          </div>
        </div>

        {/* 外食時の支払い情報 */}
        {isExternalMeal && (
          <div className="external-meal-section">
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
                  {paymentLocations.map(store => (
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

            <div className="form-group">
              <label>金額:</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="円"
              />
            </div>

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

export default MealRecord;

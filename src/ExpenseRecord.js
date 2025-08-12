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
  const [currentLocation, setCurrentLocation] = useState(null);
  const [memo, setMemo] = useState('');

  // マスタデータ
  const [masterStores, setMasterStores] = useState([]);
  const [loadingMasterData, setLoadingMasterData] = useState(true);

  // フォールバック用の店舗データ
  const fallbackStores = [
    'ファミリーマート',
    'セブンイレブン', 
    'ローソン',
    'スターバックス',
    'マクドナルド',
    'イオン',
    'ヨドバシカメラ',
    'ガソリンスタンド'
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
    const q = query(
      collection(db, 'master_stores'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const stores = [];
        querySnapshot.forEach((doc) => {
          stores.push({ id: doc.id, ...doc.data() });
        });
        setMasterStores(stores);
        setLoadingMasterData(false);
      },
      (error) => {
        console.error('マスタデータ取得エラー:', error);
        setLoadingMasterData(false);
      }
    );

    return () => unsubscribe();
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
      setPaymentMethod(editingRecord.paymentMethod || '現金');
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
      
      // 編集時は既存の位置情報があれば設定
      if (editingRecord.location) {
        setCurrentLocation(editingRecord.location);
      }
    }
  }, [editingRecord]);

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
        location: useLocationInfo && currentLocation ? currentLocation : null,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        updatedAt: new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), expenseData);
      } else {
        await addDoc(collection(db, 'records'), expenseData);
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

  // 使用する店舗データを決定
  const getStoreOptions = () => {
    if (masterStores.length > 0) {
      return masterStores.map(store => store.name);
    }
    return fallbackStores;
  };

  const storeOptions = getStoreOptions();

  return (
    <div className="record-screen">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
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
          {loadingMasterData ? (
            <div className="loading-text">マスタデータ読み込み中...</div>
          ) : (
            <div className="store-selection">
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
                <option value="">
                  {masterStores.length > 0 ? '登録された店舗を選択' : 'よく使う店舗を選択'}
                </option>
                {storeOptions.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
                <option value="custom">手入力で追加</option>
              </select>
              
              {isCustomPaymentLocation && (
                <input
                  type="text"
                  value={paymentLocationInput}
                  onChange={(e) => setPaymentLocationInput(e.target.value)}
                  placeholder="店舗名を入力"
                  className="custom-input"
                />
              )}
            </div>
          )}
          {masterStores.length === 0 && !loadingMasterData && (
            <div className="master-data-hint">
              💡 設定画面で店舗を追加できます
            </div>
          )}
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
            <option value="現金">現金</option>
            <option value="クレジットカード">クレジットカード</option>
            <option value="電子マネー">電子マネー</option>
            <option value="交通系IC">交通系IC</option>
            <option value="QRコード決済">QRコード決済</option>
            <option value="デビットカード">デビットカード</option>
          </select>
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

export default ExpenseRecord;

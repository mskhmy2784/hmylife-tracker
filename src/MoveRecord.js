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

function MoveRecord({ onBack, onSave, editingRecord }) {
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [endTime, setEndTime] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [fromLocationInput, setFromLocationInput] = useState('');
  const [isCustomFromLocation, setIsCustomFromLocation] = useState(false);
  const [toLocation, setToLocation] = useState('');
  const [toLocationInput, setToLocationInput] = useState('');
  const [isCustomToLocation, setIsCustomToLocation] = useState(false);
  const [transportMethod, setTransportMethod] = useState('徒歩');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [hasPayment, setHasPayment] = useState(false);
  const [paymentLocation, setPaymentLocation] = useState('');
  const [paymentLocationInput, setPaymentLocationInput] = useState('');
  const [isCustomPaymentLocation, setIsCustomPaymentLocation] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('交通系IC');
  const [useLocationInfo, setUseLocationInfo] = useState(true);
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState({});

  // マスタデータ
  const [masterLocations, setMasterLocations] = useState([]);
  const [masterTransportMethods, setMasterTransportMethods] = useState([]);
  const [masterStores, setMasterStores] = useState([]);
  const [loadingMasterData, setLoadingMasterData] = useState(true);

  // フォールバック用データ
  const fallbackLocations = [
    '自宅',
    '職場',
    '最寄り駅',
    '新宿駅',
    '渋谷駅',
    '東京駅',
    'スーパー',
    'ジム'
  ];

  const fallbackTransportMethods = [
    '徒歩',
    '電車',
    'バス',
    '車',
    '自転車',
    'タクシー',
    '飛行機',
    'その他'
  ];

  const fallbackStores = [
    'JR東日本',
    '東京メトロ',
    '都営地下鉄',
    '東急電鉄',
    '小田急電鉄',
    '京王電鉄',
    'バス会社'
  ];

  // マスタデータ読み込み
  useEffect(() => {
    let loadedCount = 0;
    const totalCollections = 3;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalCollections) {
        setLoadingMasterData(false);
      }
    };

    // 場所のマスタデータ
    const locationsQuery = query(
      collection(db, 'master_locations'),
      orderBy('order', 'asc')
    );

    const unsubscribeLocations = onSnapshot(locationsQuery, 
      (querySnapshot) => {
        const locations = [];
        querySnapshot.forEach((doc) => {
          locations.push({ id: doc.id, ...doc.data() });
        });
        setMasterLocations(locations);
        checkAllLoaded();
      },
      (error) => {
        console.error('場所マスタデータ取得エラー:', error);
        checkAllLoaded();
      }
    );

    // 交通手段のマスタデータ
    const transportQuery = query(
      collection(db, 'master_transport_methods'),
      orderBy('order', 'asc')
    );

    const unsubscribeTransport = onSnapshot(transportQuery, 
      (querySnapshot) => {
        const methods = [];
        querySnapshot.forEach((doc) => {
          methods.push({ id: doc.id, ...doc.data() });
        });
        setMasterTransportMethods(methods);
        checkAllLoaded();
      },
      (error) => {
        console.error('交通手段マスタデータ取得エラー:', error);
        checkAllLoaded();
      }
    );

    // 店舗のマスタデータ（支払先用）
    const storesQuery = query(
      collection(db, 'master_stores'),
      orderBy('order', 'asc')
    );

    const unsubscribeStores = onSnapshot(storesQuery, 
      (querySnapshot) => {
        const stores = [];
        querySnapshot.forEach((doc) => {
          stores.push({ id: doc.id, ...doc.data() });
        });
        setMasterStores(stores);
        checkAllLoaded();
      },
      (error) => {
        console.error('店舗マスタデータ取得エラー:', error);
        checkAllLoaded();
      }
    );

    return () => {
      unsubscribeLocations();
      unsubscribeTransport();
      unsubscribeStores();
    };
  }, []);

  // 編集時のデータ初期化
  useEffect(() => {
    if (editingRecord) {
      setStartTime(editingRecord.startTime || '');
      setEndTime(editingRecord.endTime || '');
      setFromLocation(editingRecord.fromLocation || '');
      setFromLocationInput('');
      setIsCustomFromLocation(false);
      setToLocation(editingRecord.toLocation || '');
      setToLocationInput('');
      setIsCustomToLocation(false);
      setTransportMethod(editingRecord.transportMethod || '徒歩');
      setCaloriesBurned(editingRecord.caloriesBurned ? editingRecord.caloriesBurned.toString() : '');
      setHasPayment(editingRecord.hasPayment || false);
      setPaymentLocation(editingRecord.paymentLocation || '');
      setPaymentLocationInput('');
      setIsCustomPaymentLocation(false);
      setAmount(editingRecord.amount ? editingRecord.amount.toString() : '');
      setPaymentMethod(editingRecord.paymentMethod || '交通系IC');
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
    }
  }, [editingRecord]);

  // 移動時間を計算
  const calculateDuration = () => {
    if (!startTime || !endTime) return { minutes: 0, text: '0分' };
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // 日をまたぐ場合
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const totalMinutes = endMinutes - startMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let text = '';
    if (hours > 0) {
      text = `${hours}時間${minutes}分`;
    } else {
      text = `${minutes}分`;
    }
    
    return { minutes: totalMinutes, text };
  };

  const duration = calculateDuration();

  // 保存処理
  const handleSave = async () => {
    try {
      const moveData = {
        category: '移動',
        startTime: startTime,
        endTime: endTime,
        fromLocation: isCustomFromLocation ? fromLocationInput : fromLocation,
        toLocation: isCustomToLocation ? toLocationInput : toLocation,
        transportMethod: transportMethod,
        durationMinutes: duration.minutes,
        caloriesBurned: parseInt(caloriesBurned) || null,
        hasPayment: hasPayment,
        paymentLocation: hasPayment ? (isCustomPaymentLocation ? paymentLocationInput : paymentLocation) : '',
        amount: hasPayment ? parseInt(amount) || 0 : 0,
        paymentMethod: hasPayment ? paymentMethod : '',
        useLocationInfo: useLocationInfo,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        updatedAt: new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), moveData);
      } else {
        await addDoc(collection(db, 'records'), moveData);
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

  // 使用するデータを決定
  const getLocationOptions = () => {
    if (masterLocations.length > 0) {
      return masterLocations.map(location => location.name);
    }
    return fallbackLocations;
  };

  const getTransportMethodOptions = () => {
    if (masterTransportMethods.length > 0) {
      return masterTransportMethods.map(method => method.name);
    }
    return fallbackTransportMethods;
  };

  const getStoreOptions = () => {
    if (masterStores.length > 0) {
      return masterStores.map(store => store.name);
    }
    return fallbackStores;
  };

  const locationOptions = getLocationOptions();
  const transportMethodOptions = getTransportMethodOptions();
  const storeOptions = getStoreOptions();

  return (
    <div className="record-screen">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <h2>{editingRecord ? '移動記録編集' : '移動記録'}</h2>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>

      <div className="record-form">
        {/* 時刻設定 */}
        <div className="form-group">
          <label>開始時刻:</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>終了時刻:</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          {duration.minutes > 0 && (
            <div className="duration-display">
              移動時間: {duration.text}
            </div>
          )}
        </div>

        {/* 移動元 */}
        <div className="form-group">
          <label>移動元:</label>
          {loadingMasterData ? (
            <div className="loading-text">マスタデータ読み込み中...</div>
          ) : (
            <div className="location-selection">
              <select
                value={isCustomFromLocation ? 'custom' : fromLocation}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomFromLocation(true);
                    setFromLocation('');
                  } else {
                    setIsCustomFromLocation(false);
                    setFromLocation(e.target.value);
                  }
                }}
              >
                <option value="">
                  {masterLocations.length > 0 ? '登録された場所を選択' : 'よく使う場所を選択'}
                </option>
                {locationOptions.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
                <option value="custom">手入力で追加</option>
              </select>
              
              {isCustomFromLocation && (
                <input
                  type="text"
                  value={fromLocationInput}
                  onChange={(e) => setFromLocationInput(e.target.value)}
                  placeholder="移動元を入力"
                  className="custom-input"
                />
              )}
            </div>
          )}
        </div>

        {/* 移動先 */}
        <div className="form-group">
          <label>移動先:</label>
          {loadingMasterData ? (
            <div className="loading-text">マスタデータ読み込み中...</div>
          ) : (
            <div className="location-selection">
              <select
                value={isCustomToLocation ? 'custom' : toLocation}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomToLocation(true);
                    setToLocation('');
                  } else {
                    setIsCustomToLocation(false);
                    setToLocation(e.target.value);
                  }
                }}
              >
                <option value="">
                  {masterLocations.length > 0 ? '登録された場所を選択' : 'よく使う場所を選択'}
                </option>
                {locationOptions.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
                <option value="custom">手入力で追加</option>
              </select>
              
              {isCustomToLocation && (
                <input
                  type="text"
                  value={toLocationInput}
                  onChange={(e) => setToLocationInput(e.target.value)}
                  placeholder="移動先を入力"
                  className="custom-input"
                />
              )}
            </div>
          )}
        </div>

        {/* 交通手段 */}
        <div className="form-group">
          <label>交通手段:</label>
          {loadingMasterData ? (
            <div className="loading-text">マスタデータ読み込み中...</div>
          ) : (
            <select
              value={transportMethod}
              onChange={(e) => setTransportMethod(e.target.value)}
            >
              {transportMethodOptions.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          )}
          {masterTransportMethods.length === 0 && !loadingMasterData && (
            <div className="master-data-hint">
              💡 設定画面で交通手段を追加できます
            </div>
          )}
        </div>

        {/* 消費カロリー */}
        <div className="form-group">
          <label>消費カロリー (任意):</label>
          <input
            type="number"
            value={caloriesBurned}
            onChange={(e) => setCaloriesBurned(e.target.value)}
            placeholder="kcal"
          />
        </div>

        {/* 交通費支払い */}
        <div className="form-group">
          <div className="switch-group">
            <label>交通費の支払い: 料金が発生した場合</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={hasPayment}
                onChange={(e) => setHasPayment(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {hasPayment && (
            <div className="payment-info">
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
                        {masterStores.length > 0 ? '登録された事業者を選択' : '交通事業者を選択'}
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
                        placeholder="事業者名を入力"
                        className="custom-input"
                      />
                    )}
                  </div>
                )}
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
                  <option value="交通系IC">交通系IC</option>
                  <option value="現金">現金</option>
                  <option value="クレジットカード">クレジットカード</option>
                  <option value="電子マネー">電子マネー</option>
                </select>
              </div>
            </div>
          )}
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

        {masterLocations.length === 0 && !loadingMasterData && (
          <div className="master-data-hint">
            💡 設定画面で場所を追加すると、移動記録がより便利になります
          </div>
        )}
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

export default MoveRecord;

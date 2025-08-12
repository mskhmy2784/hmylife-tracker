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

function MealRecord({ onBack, onSave, editingRecord }) {
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [mealType, setMealType] = useState('');
  const [calories, setCalories] = useState('');
  const [useDefault, setUseDefault] = useState(false);
  const [mealContent, setMealContent] = useState('');
  const [isExternalMeal, setIsExternalMeal] = useState(false);
  const [paymentLocation, setPaymentLocation] = useState('');
  const [paymentLocationInput, setPaymentLocationInput] = useState('');
  const [isCustomPaymentLocation, setIsCustomPaymentLocation] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('現金');
  const [useLocationInfo, setUseLocationInfo] = useState(true);
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
    '吉野家',
    'すき家'
  ];

  // 時間に応じた食事種別の自動判定
  const determineMealTypeByTime = (timeString) => {
    const [hours] = timeString.split(':').map(Number);
    
    if (hours >= 5 && hours < 10) {
      return '朝食';
    } else if (hours >= 11 && hours < 15) {
      return '昼食';
    } else if (hours >= 17 && hours < 22) {
      return '夕食';
    } else {
      return '間食';
    }
  };

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

  // 初期表示時の食事種別設定
  useEffect(() => {
    if (!editingRecord && !mealType) {
      const determinedMealType = determineMealTypeByTime(recordTime);
      setMealType(determinedMealType);
    }
  }, [recordTime, editingRecord, mealType]);

  // 記録時刻変更時の食事種別自動更新（編集時以外）
  const handleTimeChange = (newTime) => {
    setRecordTime(newTime);
    if (!editingRecord) {
      const determinedMealType = determineMealTypeByTime(newTime);
      setMealType(determinedMealType);
    }
  };

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
      setPaymentMethod(editingRecord.paymentMethod || '現金');
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
    }
  }, [editingRecord]);

  // デフォルトカロリー設定
  const defaultCalories = {
    '朝食': 500,
    '昼食': 700,
    '夕食': 600,
    '間食': 200
  };

  // 保存処理
  const handleSave = async () => {
    try {
      const finalCalories = useDefault ? defaultCalories[mealType] : parseInt(calories) || 0;
      
      const mealData = {
        category: '食事',
        recordTime: recordTime,
        mealType: mealType,
        calories: finalCalories,
        mealContent: mealContent || '',
        isExternalMeal: isExternalMeal,
        paymentLocation: isExternalMeal ? (isCustomPaymentLocation ? paymentLocationInput : paymentLocation) : '',
        amount: isExternalMeal ? parseInt(amount) || 0 : 0,
        paymentMethod: isExternalMeal ? paymentMethod : '',
        useLocationInfo: useLocationInfo,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        updatedAt: new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), mealData);
      } else {
        await addDoc(collection(db, 'records'), mealData);
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
            onChange={(e) => handleTimeChange(e.target.value)}
          />
          {!editingRecord && (
            <div className="time-hint">
              💡 時刻に応じて食事種別が自動設定されます
            </div>
          )}
        </div>

        {/* 食事種別 */}
        <div className="form-group">
          <label>食事種別:</label>
          <div className="meal-type-buttons">
            {['朝食', '昼食', '夕食', '間食'].map((type) => (
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

        {/* 摂取カロリー */}
        <div className="form-group">
          <label>摂取カロリー:</label>
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
              デフォルト値を使用 ({mealType}: {defaultCalories[mealType]}kcal)
            </label>
          </div>
        </div>

        {/* 食事内容 */}
        <div className="form-group">
          <label>食事内容 (任意):</label>
          <textarea
            value={mealContent}
            onChange={(e) => setMealContent(e.target.value)}
            placeholder="例：パスタとサラダ（記入は任意です）"
            rows="3"
          />
        </div>

        {/* 外食情報 */}
        <div className="form-group">
          <div className="switch-group">
            <label>外食情報: 外食の場合</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={isExternalMeal}
                onChange={(e) => setIsExternalMeal(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {isExternalMeal && (
            <div className="external-meal-info">
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
                  <option value="現金">現金</option>
                  <option value="クレジットカード">クレジットカード</option>
                  <option value="電子マネー">電子マネー</option>
                  <option value="交通系IC">交通系IC</option>
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

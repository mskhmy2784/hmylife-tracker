import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

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

  // マスタデータの状態
  const [locations, setLocations] = useState([]);
  const [paymentLocations, setPaymentLocations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // 移動手段のマスタデータ（固定値）
  const transportMethods = [
    '徒歩',
    '電車',
    'バス',
    '車',
    '自転車',
    'タクシー',
    '飛行機',
    'その他'
  ];

  // マスタデータの読み込み
  useEffect(() => {
    // 場所の読み込み
    const unsubscribeLocations = onSnapshot(
      query(collection(db, 'masterData', 'locations', 'items'), orderBy('name')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data().name);
        setLocations(items);
      },
      (error) => {
        console.error('場所マスタ読み込みエラー:', error);
        // エラー時はデフォルト値を使用
        setLocations([
          '自宅',
          '職場',
          '最寄り駅',
          '新宿駅',
          '渋谷駅',
          '東京駅',
          'スーパー',
          'ジム'
        ]);
      }
    );

    // 支払先の読み込み（交通費支払い用）
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
          'JR東日本',
          '東京メトロ',
          '都営地下鉄',
          '東急電鉄',
          '小田急電鉄',
          '京王電鉄',
          'バス会社'
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
          '交通系IC',
          '現金',
          'クレジットカード',
          'その他'
        ]);
      }
    );

    return () => {
      unsubscribeLocations();
      unsubscribePaymentLocations();
      unsubscribePaymentMethods();
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

  // バリデーション
  const validateForm = () => {
    const newErrors = {};

    // 開始時刻チェック
    if (!startTime) {
      newErrors.startTime = '開始時刻を入力してください';
    }

    // 時刻の論理チェック（両方入力されている場合のみ）
    if (startTime && endTime && duration.minutes <= 0) {
      newErrors.timeLogic = '終了時刻は開始時刻より後の時刻を入力してください';
    }

    // 移動時間の妥当性チェック（両方入力されている場合のみ）
    if (startTime && endTime && duration.minutes > 24 * 60) {
      newErrors.timeLogic = '移動時間は24時間以下にしてください';
    }

    // 移動元チェック
    const finalFromLocation = isCustomFromLocation ? fromLocationInput : fromLocation;
    if (!finalFromLocation.trim()) {
      newErrors.fromLocation = '移動元を入力してください';
    }

    // 移動先チェック
    const finalToLocation = isCustomToLocation ? toLocationInput : toLocation;
    if (!finalToLocation.trim()) {
      newErrors.toLocation = '移動先を入力してください';
    }

    // 消費カロリーチェック
    if (caloriesBurned && parseInt(caloriesBurned) < 0) {
      newErrors.caloriesBurned = '消費カロリーは0以上で入力してください';
    }

    // 交通費支払いチェック
    if (hasPayment) {
      const finalPaymentLocation = isCustomPaymentLocation ? paymentLocationInput : paymentLocation;
      if (!finalPaymentLocation.trim()) {
        newErrors.paymentLocation = '交通費支払時は支払先を入力してください';
      }
      
      const amountNum = parseInt(amount);
      if (!amount || amountNum < 1) {
        newErrors.amount = '交通費支払時は金額を1円以上で入力してください';
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
      const moveData = {
        category: '移動',
        startTime: startTime,
        endTime: endTime,
        durationMinutes: duration.minutes,
        fromLocation: isCustomFromLocation ? fromLocationInput : fromLocation,
        toLocation: isCustomToLocation ? toLocationInput : toLocation,
        transportMethod: transportMethod,
        caloriesBurned: parseInt(caloriesBurned) || null,
        hasPayment: hasPayment,
        paymentLocation: hasPayment ? (isCustomPaymentLocation ? paymentLocationInput : paymentLocation) : '',
        amount: hasPayment ? parseInt(amount) || 0 : 0,
        paymentMethod: hasPayment ? paymentMethod : '',
        useLocationInfo: useLocationInfo,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), moveData);
        alert('移動記録を更新しました！');
      } else {
        await addDoc(collection(db, 'records'), moveData);
        alert('移動記録を保存しました！');
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
      alert('移動記録を削除しました');
      onSave();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="move-record">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{editingRecord ? '移動記録編集' : '移動記録'}</h2>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>

      <div className="record-form">
        {/* 開始・終了時刻 */}
        <div className="form-group">
          <label>開始時刻: <span className="required">*</span></label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              if (errors.startTime || errors.timeLogic) {
                setErrors({...errors, startTime: '', timeLogic: ''});
              }
            }}
            className={errors.startTime || errors.timeLogic ? 'error' : ''}
          />
          {errors.startTime && <span className="error-message">{errors.startTime}</span>}
        </div>

        <div className="form-group">
          <label>終了時刻:</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              if (errors.timeLogic) {
                setErrors({...errors, timeLogic: ''});
              }
            }}
            className={errors.timeLogic ? 'error' : ''}
          />
          {errors.timeLogic && <span className="error-message">{errors.timeLogic}</span>}
        </div>

        {/* 移動時間（自動計算） */}
        {duration.minutes > 0 && (
          <div className="form-group">
            <label>移動時間:</label>
            <div className="duration-display">
              {duration.text}
            </div>
          </div>
        )}

        {/* 移動元 */}
        <div className="form-group">
          <label>移動元: <span className="required">*</span></label>
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
                if (errors.fromLocation) {
                  setErrors({...errors, fromLocation: ''});
                }
              }}
              className={errors.fromLocation ? 'error' : ''}
            >
              <option value="">選択してください</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
              <option value="custom">その他（手入力）</option>
            </select>
            
            {isCustomFromLocation && (
              <input
                type="text"
                value={fromLocationInput}
                onChange={(e) => {
                  setFromLocationInput(e.target.value);
                  if (errors.fromLocation) {
                    setErrors({...errors, fromLocation: ''});
                  }
                }}
                placeholder="移動元を入力"
                className={errors.fromLocation ? 'error' : ''}
                style={{ marginTop: '5px' }}
              />
            )}
          </div>
          {errors.fromLocation && <span className="error-message">{errors.fromLocation}</span>}
        </div>

        {/* 移動先 */}
        <div className="form-group">
          <label>移動先: <span className="required">*</span></label>
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
                if (errors.toLocation) {
                  setErrors({...errors, toLocation: ''});
                }
              }}
              className={errors.toLocation ? 'error' : ''}
            >
              <option value="">選択してください</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
              <option value="custom">その他（手入力）</option>
            </select>
            
            {isCustomToLocation && (
              <input
                type="text"
                value={toLocationInput}
                onChange={(e) => {
                  setToLocationInput(e.target.value);
                  if (errors.toLocation) {
                    setErrors({...errors, toLocation: ''});
                  }
                }}
                placeholder="移動先を入力"
                className={errors.toLocation ? 'error' : ''}
                style={{ marginTop: '5px' }}
              />
            )}
          </div>
          {errors.toLocation && <span className="error-message">{errors.toLocation}</span>}
        </div>

        {/* 移動手段 */}
        <div className="form-group">
          <label>移動手段:</label>
          <select
            value={transportMethod}
            onChange={(e) => setTransportMethod(e.target.value)}
          >
            {transportMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        {/* 消費カロリー */}
        <div className="form-group">
          <label>消費カロリー:</label>
          <input
            type="number"
            value={caloriesBurned}
            onChange={(e) => {
              setCaloriesBurned(e.target.value);
              if (errors.caloriesBurned) {
                setErrors({...errors, caloriesBurned: ''});
              }
            }}
            placeholder="kcal"
            className={errors.caloriesBurned ? 'error' : ''}
          />
          {errors.caloriesBurned && <span className="error-message">{errors.caloriesBurned}</span>}
        </div>

        {/* 交通費支払い */}
        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="hasPayment"
              checked={hasPayment}
              onChange={(e) => setHasPayment(e.target.checked)}
            />
            <label htmlFor="hasPayment">交通費の支払いあり</label>
          </div>

          {hasPayment && (
            <div className="payment-info">
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
                      if (errors.paymentLocation) {
                        setErrors({...errors, paymentLocation: ''});
                      }
                    }}
                    className={errors.paymentLocation ? 'error' : ''}
                  >
                    <option value="">選択してください</option>
                    {paymentLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                    <option value="custom">その他（手入力）</option>
                  </select>
                  
                  {isCustomPaymentLocation && (
                    <input
                      type="text"
                      value={paymentLocationInput}
                      onChange={(e) => {
                        setPaymentLocationInput(e.target.value);
                        if (errors.paymentLocation) {
                          setErrors({...errors, paymentLocation: ''});
                        }
                      }}
                      placeholder="支払先を入力"
                      className={errors.paymentLocation ? 'error' : ''}
                      style={{ marginTop: '5px' }}
                    />
                  )}
                </div>
                {errors.paymentLocation && <span className="error-message">{errors.paymentLocation}</span>}
              </div>
              <div className="form-group">
                <label>金額:</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) {
                      setErrors({...errors, amount: ''});
                    }
                  }}
                  placeholder="円"
                  className={errors.amount ? 'error' : ''}
                />
                {errors.amount && <span className="error-message">{errors.amount}</span>}
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

export default MoveRecord;

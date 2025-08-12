import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

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

  // よく使う店舗のマスタデータ（今後はFirestoreから取得）
  const commonStores = [
    'ファミリーマート',
    'セブンイレブン', 
    'ローソン',
    'スターバックス',
    'マクドナルド',
    'イオン',
    'ヨドバシカメラ',
    'ガソリンスタンド'
  ];

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
        memo: memo,
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
              <option value="">よく使う店舗を選択</option>
              {commonStores.map(store => (
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
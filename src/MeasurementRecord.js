import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

function MeasurementRecord({ onBack, onSave, editingRecord }) {
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [weight, setWeight] = useState('');
  const [bodyFatRate, setBodyFatRate] = useState('');
  const [bloodPressureHigh, setBloodPressureHigh] = useState('');
  const [bloodPressureLow, setBloodPressureLow] = useState('');
  const [waistSize, setWaistSize] = useState('');
  const [useLocationInfo, setUseLocationInfo] = useState(true);
  const [memo, setMemo] = useState('');

  // ユーザー設定情報
  const [userHeight, setUserHeight] = useState(170.0); // デフォルト値
  const [userGender, setUserGender] = useState('male');
  const [userAge, setUserAge] = useState(30);

  // ユーザー設定の読み込み
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'settings', 'userInfo'));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.height) {
            setUserHeight(data.height);
          }
          if (data.gender) {
            setUserGender(data.gender);
          }
          if (data.birthDate) {
            // 年齢計算
            const today = new Date();
            const birth = new Date(data.birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
              age--;
            }
            setUserAge(age);
          }
        }
      } catch (error) {
        console.error('ユーザー設定読み込みエラー:', error);
      }
    };
    loadUserSettings();
  }, []);

  // 編集時のデータ初期化
  useEffect(() => {
    if (editingRecord) {
      setRecordTime(editingRecord.recordTime || '');
      setWeight(editingRecord.weight ? editingRecord.weight.toString() : '');
      setBodyFatRate(editingRecord.bodyFatRate ? editingRecord.bodyFatRate.toString() : '');
      setBloodPressureHigh(editingRecord.bloodPressureHigh ? editingRecord.bloodPressureHigh.toString() : '');
      setBloodPressureLow(editingRecord.bloodPressureLow ? editingRecord.bloodPressureLow.toString() : '');
      setWaistSize(editingRecord.waistSize ? editingRecord.waistSize.toString() : '');
      setUseLocationInfo(editingRecord.useLocationInfo !== false);
      setMemo(editingRecord.memo || '');
    }
  }, [editingRecord]);

  // BMI計算
  const calculateBMI = () => {
    if (!weight || weight <= 0 || userHeight <= 0) return null;
    const weightNum = parseFloat(weight);
    const heightM = userHeight / 100; // cmをmに変換
    const bmi = weightNum / (heightM * heightM);
    return Math.round(bmi * 10) / 10; // 小数点1桁
  };

  const bmi = calculateBMI();

  // BMI判定
  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return '低体重';
    if (bmi < 25) return '普通体重';
    if (bmi < 30) return '肥満(1度)';
    return '肥満(2度以上)';
  };

  // 基礎代謝計算（Harris-Benedict式）
  const calculateBMR = () => {
    if (!weight || !userHeight || !userAge) return null;
    const weightNum = parseFloat(weight);
    
    if (userGender === 'male') {
      // 男性: BMR = 88.362 + (13.397 × 体重kg) + (4.799 × 身長cm) - (5.677 × 年齢)
      return Math.round(88.362 + (13.397 * weightNum) + (4.799 * userHeight) - (5.677 * userAge));
    } else {
      // 女性: BMR = 447.593 + (9.247 × 体重kg) + (3.098 × 身長cm) - (4.330 × 年齢)
      return Math.round(447.593 + (9.247 * weightNum) + (3.098 * userHeight) - (4.330 * userAge));
    }
  };

  const bmr = calculateBMR();

  // 標準体重計算
  const calculateStandardWeight = () => {
    if (!userHeight) return null;
    const heightM = userHeight / 100;
    return Math.round(22 * heightM * heightM * 10) / 10; // BMI22での体重
  };

  const standardWeight = calculateStandardWeight();

  // 保存処理
  const handleSave = async () => {
    try {
      const measurementData = {
        category: '計量',
        recordTime: recordTime,
        weight: parseFloat(weight) || null,
        bodyFatRate: parseFloat(bodyFatRate) || null,
        bloodPressureHigh: parseInt(bloodPressureHigh) || null,
        bloodPressureLow: parseInt(bloodPressureLow) || null,
        waistSize: parseFloat(waistSize) || null,
        bmi: bmi,
        bmiCategory: getBMICategory(bmi),
        bmr: bmr, // 基礎代謝を追加
        standardWeight: standardWeight, // 標準体重を追加
        height: userHeight, // 計算に使用した身長も保存
        age: userAge, // 計算に使用した年齢も保存
        gender: userGender, // 計算に使用した性別も保存
        useLocationInfo: useLocationInfo,
        memo: memo,
        createdAt: editingRecord ? editingRecord.createdAt : new Date(),
        date: new Date().toDateString()
      };

      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), measurementData);
        alert('計量記録を更新しました！');
      } else {
        await addDoc(collection(db, 'records'), measurementData);
        alert('計量記録を保存しました！');
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
      alert('計量記録を削除しました');
      onSave();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="measurement-record">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{editingRecord ? '計量記録編集' : '計量記録'}</h2>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>

      <div className="record-form">
        {/* 測定時刻 */}
        <div className="form-group">
          <label>測定時刻:</label>
          <input
            type="time"
            value={recordTime}
            onChange={(e) => setRecordTime(e.target.value)}
          />
        </div>

        {/* 体重 */}
        <div className="form-group">
          <label>体重:</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="kg"
          />
          {standardWeight && (
            <div className="standard-weight-info">
              標準体重: {standardWeight}kg (BMI22基準)
            </div>
          )}
        </div>

        {/* BMI表示 */}
        {bmi && (
          <div className="form-group">
            <label>BMI:</label>
            <div className="bmi-display">
              <span className="bmi-value">{bmi}</span>
              <span className="bmi-category">({getBMICategory(bmi)})</span>
            </div>
            <div className="bmi-note">身長: {userHeight}cm で計算</div>
          </div>
        )}

        {/* 基礎代謝表示 */}
        {bmr && (
          <div className="form-group">
            <label>基礎代謝:</label>
            <div className="bmr-display">
              <span className="bmr-value">{bmr} kcal/日</span>
            </div>
            <div className="bmr-note">
              {userAge}歳 {userGender === 'male' ? '男性' : '女性'} {userHeight}cm {weight}kg で計算
            </div>
          </div>
        )}

        {/* 体脂肪率 */}
        <div className="form-group">
          <label>体脂肪率:</label>
          <input
            type="number"
            step="0.1"
            value={bodyFatRate}
            onChange={(e) => setBodyFatRate(e.target.value)}
            placeholder="% (任意)"
          />
        </div>

        {/* 血圧 */}
        <div className="form-group">
          <label>血圧:</label>
          <div className="blood-pressure-inputs">
            <input
              type="number"
              value={bloodPressureHigh}
              onChange={(e) => setBloodPressureHigh(e.target.value)}
              placeholder="最高"
            />
            <span className="separator">/</span>
            <input
              type="number"
              value={bloodPressureLow}
              onChange={(e) => setBloodPressureLow(e.target.value)}
              placeholder="最低"
            />
            <span className="unit">mmHg (任意)</span>
          </div>
        </div>

        {/* 腹囲 */}
        <div className="form-group">
          <label>腹囲:</label>
          <input
            type="number"
            step="0.1"
            value={waistSize}
            onChange={(e) => setWaistSize(e.target.value)}
            placeholder="cm (任意)"
          />
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

export default MeasurementRecord;

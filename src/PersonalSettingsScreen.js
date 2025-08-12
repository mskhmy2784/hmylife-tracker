import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

function PersonalSettingsScreen({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 個人情報
  const [height, setHeight] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [activityLevel, setActivityLevel] = useState('普通');
  
  // 目標設定
  const [targetWeight, setTargetWeight] = useState('');
  const [targetCaloriesIntake, setTargetCaloriesIntake] = useState('');
  const [targetCaloriesBurn, setTargetCaloriesBurn] = useState('');
  const [targetSleepHours, setTargetSleepHours] = useState('8');
  const [targetExerciseMinutes, setTargetExerciseMinutes] = useState('30');
  
  // 通知設定
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [notificationTime, setNotificationTime] = useState('22:00');

  const personalSettingsDocId = 'user_personal_settings';

  // 年齢計算
  const calculateAge = (birthdayString) => {
    if (!birthdayString) return null;
    const today = new Date();
    const birth = new Date(birthdayString);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // BMR（基礎代謝）計算（Harris-Benedict式）
  const calculateBMR = () => {
    if (!height || !targetWeight || !birthday || !gender) return null;
    
    const age = calculateAge(birthday);
    if (!age) return null;
    
    const h = parseFloat(height);
    const w = parseFloat(targetWeight);
    
    let bmr;
    if (gender === '男性') {
      bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * age);
    } else if (gender === '女性') {
      bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * age);
    } else {
      return null;
    }
    
    // 活動レベルによる補正
    const activityMultiplier = {
      '低い': 1.2,    // 座り仕事、運動なし
      '普通': 1.375,  // 軽い運動を週1-3回
      '高い': 1.55,   // 中程度の運動を週3-5回
      '非常に高い': 1.725  // 激しい運動を週6-7回
    };
    
    return Math.round(bmr * (activityMultiplier[activityLevel] || 1.375));
  };

  // データ読み込み
  useEffect(() => {
    const docRef = doc(db, 'personal_settings', personalSettingsDocId);
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setHeight(data.height || '');
          setBirthday(data.birthday || '');
          setGender(data.gender || '');
          setBloodType(data.bloodType || '');
          setActivityLevel(data.activityLevel || '普通');
          setTargetWeight(data.targetWeight || '');
          setTargetCaloriesIntake(data.targetCaloriesIntake || '');
          setTargetCaloriesBurn(data.targetCaloriesBurn || '');
          setTargetSleepHours(data.targetSleepHours || '8');
          setTargetExerciseMinutes(data.targetExerciseMinutes || '30');
          setEnableNotifications(data.enableNotifications !== false);
          setNotificationTime(data.notificationTime || '22:00');
        }
        setLoading(false);
      },
      (error) => {
        console.error('個人設定取得エラー:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 保存処理
  const handleSave = async () => {
    setSaving(true);
    try {
      const personalData = {
        height: parseFloat(height) || null,
        birthday: birthday || null,
        gender: gender || null,
        bloodType: bloodType || null,
        activityLevel: activityLevel,
        targetWeight: parseFloat(targetWeight) || null,
        targetCaloriesIntake: parseInt(targetCaloriesIntake) || null,
        targetCaloriesBurn: parseInt(targetCaloriesBurn) || null,
        targetSleepHours: parseFloat(targetSleepHours) || 8,
        targetExerciseMinutes: parseInt(targetExerciseMinutes) || 30,
        enableNotifications: enableNotifications,
        notificationTime: notificationTime,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'personal_settings', personalSettingsDocId), personalData);
      alert('個人設定を保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const age = calculateAge(birthday);
  const bmr = calculateBMR();

  if (loading) {
    return (
      <div className="settings-screen">
        <div className="settings-header">
          <button className="back-btn" onClick={onBack}>← 戻る</button>
          <h2>個人設定</h2>
        </div>
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <h2>個人設定</h2>
        <button 
          className="save-btn" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="settings-content">
        {/* 基本情報 */}
        <div className="settings-section">
          <h3>🧑‍💼 基本情報</h3>
          
          <div className="form-group">
            <label>身長 (cm):</label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="例: 170.5"
            />
          </div>

          <div className="form-group">
            <label>誕生日:</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
            {age && (
              <div className="calculated-info">
                現在の年齢: {age}歳
              </div>
            )}
          </div>

          <div className="form-group">
            <label>性別:</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">選択してください</option>
              <option value="男性">男性</option>
              <option value="女性">女性</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div className="form-group">
            <label>血液型 (任意):</label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
            >
              <option value="">選択してください</option>
              <option value="A">A型</option>
              <option value="B">B型</option>
              <option value="AB">AB型</option>
              <option value="O">O型</option>
            </select>
          </div>

          <div className="form-group">
            <label>活動レベル:</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
            >
              <option value="低い">低い（座り仕事、運動なし）</option>
              <option value="普通">普通（軽い運動を週1-3回）</option>
              <option value="高い">高い（中程度の運動を週3-5回）</option>
              <option value="非常に高い">非常に高い（激しい運動を週6-7回）</option>
            </select>
          </div>
        </div>

        {/* 目標設定 */}
        <div className="settings-section">
          <h3>🎯 目標設定</h3>
          
          <div className="form-group">
            <label>目標体重 (kg):</label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="例: 65.0"
            />
          </div>

          <div className="form-group">
            <label>目標摂取カロリー (kcal/日):</label>
            <input
              type="number"
              value={targetCaloriesIntake}
              onChange={(e) => setTargetCaloriesIntake(e.target.value)}
              placeholder={bmr ? `推奨: ${bmr}` : "例: 2000"}
            />
            {bmr && (
              <div className="calculated-info">
                推定必要カロリー: {bmr}kcal/日（基礎代謝×活動レベル）
              </div>
            )}
          </div>

          <div className="form-group">
            <label>目標消費カロリー (kcal/日):</label>
            <input
              type="number"
              value={targetCaloriesBurn}
              onChange={(e) => setTargetCaloriesBurn(e.target.value)}
              placeholder="例: 300"
            />
          </div>

          <div className="form-group">
            <label>目標睡眠時間 (時間/日):</label>
            <input
              type="number"
              step="0.5"
              value={targetSleepHours}
              onChange={(e) => setTargetSleepHours(e.target.value)}
              placeholder="例: 8"
            />
          </div>

          <div className="form-group">
            <label>目標運動時間 (分/日):</label>
            <input
              type="number"
              value={targetExerciseMinutes}
              onChange={(e) => setTargetExerciseMinutes(e.target.value)}
              placeholder="例: 30"
            />
          </div>
        </div>

        {/* 通知設定 */}
        <div className="settings-section">
          <h3>🔔 通知設定</h3>
          
          <div className="form-group">
            <div className="switch-group">
              <label>通知を有効にする:</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={enableNotifications}
                  onChange={(e) => setEnableNotifications(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {enableNotifications && (
            <div className="form-group">
              <label>通知時刻:</label>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
              />
              <div className="notification-note">
                記録の入力を促す通知を送信します
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonalSettingsScreen;

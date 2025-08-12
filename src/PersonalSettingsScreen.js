import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  writeBatch 
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

  // データ管理関連
  const [deleteDate, setDeleteDate] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStats, setDeleteStats] = useState(null);
  
  // エクスポート関連
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStats, setExportStats] = useState(null);

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

  // エクスポート統計の取得
  const getExportStats = async (startDate, endDate) => {
    if (!startDate || !endDate) return null;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        return { error: '開始日は終了日より前に設定してください' };
      }
      
      const startDateString = start.toDateString();
      const endDateString = end.toDateString();
      
      // 期間内のレコードを検索
      const q = query(
        collection(db, 'records'),
        where('date', '>=', startDateString),
        where('date', '<=', endDateString)
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });

      // カテゴリ別の統計を計算
      const categoryStats = {};
      records.forEach(record => {
        const category = record.category || '未分類';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      return {
        totalCount: records.length,
        categoryStats,
        dateRange: {
          from: startDate,
          to: endDate
        }
      };
    } catch (error) {
      console.error('エクスポート統計取得エラー:', error);
      return { error: 'データの取得に失敗しました' };
    }
  };

  // CSVエクスポート機能
  const handleExportToCsv = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert('エクスポート期間を選択してください');
      return;
    }

    const stats = await getExportStats(exportStartDate, exportEndDate);
    if (!stats) return;
    
    if (stats.error) {
      alert(stats.error);
      return;
    }
    
    if (stats.totalCount === 0) {
      alert('エクスポート対象のデータがありません');
      return;
    }

    setIsExporting(true);

    try {
      const start = new Date(exportStartDate);
      const end = new Date(exportEndDate);
      const startDateString = start.toDateString();
      const endDateString = end.toDateString();
      
      // エクスポート対象のレコードを取得
      const q = query(
        collection(db, 'records'),
        where('date', '>=', startDateString),
        where('date', '<=', endDateString)
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });

      if (records.length === 0) {
        alert('エクスポート対象のデータがありません');
        return;
      }

      // データを日付・時刻順でソート
      records.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        const timeA = a.recordTime || a.wakeTime || a.startTime || '00:00';
        const timeB = b.recordTime || b.wakeTime || b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });

      // CSV用のヘッダーを定義
      const csvHeaders = [
        'ID',
        '日付',
        '時刻',
        'カテゴリ',
        '詳細タイプ',
        '内容',
        '数値1',
        '数値2',
        '数値3',
        '場所',
        '支払方法',
        '重要度',
        '完了状況',
        '緯度',
        '経度',
        '住所',
        'メモ',
        '作成日時',
        '更新日時'
      ];

      // CSV用のデータを変換
      const csvData = records.map(record => {
        const formatDate = (date) => {
          if (!date) return '';
          if (date.toDate) return date.toDate().toISOString();
          if (date instanceof Date) return date.toISOString();
          return date;
        };

        return [
          record.id || '',
          record.date || '',
          record.recordTime || record.wakeTime || record.startTime || '',
          record.category || '',
          record.mealType || record.exerciseType || record.transportMethod || record.infoType || '',
          record.mealContent || record.exerciseContent || record.expenseContent || record.infoContent || '',
          record.calories || record.amount || record.weight || record.caloriesBurned || record.sleepHours || '',
          record.sleepMinutes || record.duration || record.distance || record.bodyFatRate || record.bloodPressureHigh || '',
          record.bmi || record.bloodPressureLow || record.waistSize || record.reps || record.durationMinutes || '',
          record.paymentLocation || record.exerciseLocation || record.fromLocation || record.toLocation || '',
          record.paymentMethod || '',
          record.priority || '',
          record.isCompleted ? '完了' : '未完了',
          record.location?.latitude || '',
          record.location?.longitude || '',
          record.location?.address?.fullAddress || '',
          record.memo || '',
          formatDate(record.createdAt),
          formatDate(record.updatedAt)
        ];
      });

      // CSV文字列を作成
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => 
          row.map(field => {
            // フィールドにカンマや改行が含まれる場合はダブルクォートで囲む
            const fieldStr = String(field || '');
            if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('"')) {
              return `"${fieldStr.replace(/"/g, '""')}"`;
            }
            return fieldStr;
          }).join(',')
        )
      ].join('\n');

      // BOMを追加してUTF-8エンコーディングを明示
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // ダウンロード用のリンクを作成
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const fileName = `life_tracker_${exportStartDate}_to_${exportEndDate}.csv`;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`${records.length}件のデータをCSVファイルとしてダウンロードしました`);

    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      alert('CSVエクスポートに失敗しました: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };
  const getDeleteStats = async (toDate) => {
    if (!toDate) return null;

    try {
      const targetDate = new Date(toDate);
      const targetDateString = targetDate.toDateString();
      
      // 指定日付以前のレコードを検索
      const q = query(
        collection(db, 'records'),
        where('date', '<=', targetDateString)
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });

      // カテゴリ別の統計を計算
      const categoryStats = {};
      records.forEach(record => {
        const category = record.category || '未分類';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      return {
        totalCount: records.length,
        categoryStats,
        dateRange: {
          from: records.length > 0 ? records.map(r => r.date).sort()[0] : toDate,
          to: toDate
        }
      };
    } catch (error) {
      console.error('削除統計取得エラー:', error);
      return null;
    }
  };

  // エクスポートプレビューの更新
  useEffect(() => {
    if (exportStartDate && exportEndDate) {
      getExportStats(exportStartDate, exportEndDate).then(setExportStats);
    } else {
      setExportStats(null);
    }
  }, [exportStartDate, exportEndDate]);

  // 削除プレビューの更新
  useEffect(() => {
    if (deleteDate) {
      getDeleteStats(deleteDate).then(setDeleteStats);
    } else {
      setDeleteStats(null);
    }
  }, [deleteDate]);

  // 特定日付以前のデータ削除
  const handleDeleteDataToDate = async () => {
    if (!deleteDate) {
      alert('削除終了日を選択してください');
      return;
    }

    const stats = await getDeleteStats(deleteDate);
    if (!stats || stats.totalCount === 0) {
      alert('削除対象のデータがありません');
      return;
    }

    const confirmMessage = `${deleteDate}以前のデータ（${stats.totalCount}件）を削除しますか？\n\nこの操作は元に戻せません。`;
    
    if (!window.confirm(confirmMessage)) return;

    // 最終確認
    const finalConfirm = window.prompt(
      '本当に削除しますか？\n削除を実行する場合は「削除」と入力してください',
      ''
    );
    
    if (finalConfirm !== '削除') {
      alert('削除がキャンセルされました');
      return;
    }

    setIsDeleting(true);

    try {
      const targetDate = new Date(deleteDate);
      const targetDateString = targetDate.toDateString();
      
      // 削除対象のレコードを取得
      const q = query(
        collection(db, 'records'),
        where('date', '<=', targetDateString)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert('削除対象のデータがありません');
        return;
      }

      // バッチ削除（Firestoreの制限により500件ずつ処理）
      const batch = writeBatch(db);
      let batchCount = 0;
      let totalDeleted = 0;

      for (const docSnapshot of querySnapshot.docs) {
        batch.delete(docSnapshot.ref);
        batchCount++;
        totalDeleted++;

        // 500件に達したらバッチをコミット
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      // 残りのバッチをコミット
      if (batchCount > 0) {
        await batch.commit();
      }

      alert(`${totalDeleted}件のデータを削除しました`);
      setDeleteDate('');
      setDeleteStats(null);

    } catch (error) {
      console.error('データ削除エラー:', error);
      alert('データの削除に失敗しました: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
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

        {/* データ管理セクション */}
        <div className="settings-section">
          <h3>🗑️ データ管理</h3>
          
          {/* CSVエクスポート */}
          <div className="form-group">
            <label>CSVエクスポート:</label>
            <div className="export-section">
              <div className="date-range-inputs">
                <div className="date-input-group">
                  <label>開始日:</label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="date-input-group">
                  <label>終了日:</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    min={exportStartDate}
                  />
                </div>
              </div>
              
              {exportStats && !exportStats.error && (
                <div className="export-preview">
                  <h4>エクスポートプレビュー</h4>
                  <p><strong>対象期間:</strong> {exportStats.dateRange.from} 〜 {exportStats.dateRange.to}</p>
                  <p><strong>エクスポート件数:</strong> {exportStats.totalCount}件</p>
                  
                  {Object.keys(exportStats.categoryStats).length > 0 && (
                    <div className="category-breakdown">
                      <strong>カテゴリ別内訳:</strong>
                      <ul>
                        {Object.entries(exportStats.categoryStats).map(([category, count]) => (
                          <li key={category}>{category}: {count}件</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {exportStats && exportStats.error && (
                <div className="export-error">
                  ❌ {exportStats.error}
                </div>
              )}
              
              <button 
                className="export-btn"
                onClick={handleExportToCsv}
                disabled={!exportStartDate || !exportEndDate || isExporting || !exportStats || exportStats.error || exportStats.totalCount === 0}
              >
                {isExporting ? 'エクスポート中...' : 'CSVファイルをダウンロード'}
              </button>
              
              <div className="export-info">
                💡 エクスポートされたCSVファイルはExcelなどで開くことができます
              </div>
            </div>
          </div>

          {/* データ削除 */}
          <div className="form-group">
            <label>特定日付以前のデータを削除:</label>
            <div className="delete-date-section">
              <input
                type="date"
                value={deleteDate}
                onChange={(e) => setDeleteDate(e.target.value)}
                placeholder="削除終了日を選択"
                max={new Date().toISOString().split('T')[0]}
              />
              
              {deleteStats && (
                <div className="delete-preview">
                  <h4>削除プレビュー</h4>
                  <p><strong>削除対象期間:</strong> {deleteStats.dateRange.from} 〜 {deleteStats.dateRange.to}</p>
                  <p><strong>削除件数:</strong> {deleteStats.totalCount}件</p>
                  
                  {Object.keys(deleteStats.categoryStats).length > 0 && (
                    <div className="category-breakdown">
                      <strong>カテゴリ別内訳:</strong>
                      <ul>
                        {Object.entries(deleteStats.categoryStats).map(([category, count]) => (
                          <li key={category}>{category}: {count}件</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <button 
                className="delete-data-btn"
                onClick={handleDeleteDataToDate}
                disabled={!deleteDate || isDeleting || !deleteStats || deleteStats.totalCount === 0}
              >
                {isDeleting ? '削除中...' : '指定日以前のデータを削除'}
              </button>
              
              <div className="delete-warning">
                ⚠️ 削除されたデータは復元できません。十分にご注意ください。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalSettingsScreen;

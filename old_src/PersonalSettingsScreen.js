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
import { useAuth } from './contexts/AuthContext';

function PersonalSettingsScreen({ onBack }) {
  const { currentUser } = useAuth();
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

  // 修正：シンプルなドキュメントID
  const personalSettingsDocId = currentUser?.uid;

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

  // BMR計算（基礎代謝率）
  const calculateBMR = () => {
    if (!height || !targetWeight || !birthday || !gender) return null;
    
    const age = calculateAge(birthday);
    if (!age) return null;
    
    const h = parseFloat(height);
    const w = parseFloat(targetWeight);
    
    if (gender === '男性') {
      return Math.round(88.362 + (13.397 * w) + (4.799 * h) - (5.677 * age));
    } else if (gender === '女性') {
      return Math.round(447.593 + (9.247 * w) + (3.098 * h) - (4.330 * age));
    }
    return null;
  };

  // デバッグログ追加
  console.log('PersonalSettingsScreen Debug:');
  console.log('- currentUser:', currentUser);
  console.log('- personalSettingsDocId:', personalSettingsDocId);

  // データ読み込み処理（完全修正版）
  useEffect(() => {
    console.log('useEffect開始 - currentUser:', currentUser);
    
    if (!currentUser) {
      console.error('currentUser is null/undefined - ログインが必要');
      setLoading(false);
      return;
    }

    if (!personalSettingsDocId) {
      console.error('personalSettingsDocId is null/undefined');
      setLoading(false);
      return;
    }

    console.log('Firestore読み込み開始:', personalSettingsDocId);
    
    const docRef = doc(db, 'personal_settings', personalSettingsDocId);
    console.log('Document path:', docRef.path);
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnapshot) => {
        console.log('onSnapshot成功 - Document exists:', docSnapshot.exists());
        
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('取得データ:', data);
          
          // データの設定
          setHeight(data.height?.toString() || '');
          setBirthday(data.birthday || '');
          setGender(data.gender || '');
          setBloodType(data.bloodType || '');
          setActivityLevel(data.activityLevel || '普通');
          setTargetWeight(data.targetWeight?.toString() || '');
          setTargetCaloriesIntake(data.targetCaloriesIntake?.toString() || '');
          setTargetCaloriesBurn(data.targetCaloriesBurn?.toString() || '');
          setTargetSleepHours(data.targetSleepHours?.toString() || '8');
          setTargetExerciseMinutes(data.targetExerciseMinutes?.toString() || '30');
          setEnableNotifications(data.enableNotifications !== false);
          setNotificationTime(data.notificationTime || '22:00');
        } else {
          console.log('Document does not exist - 初回作成');
        }
        setLoading(false);
      },
      (error) => {
        console.error('onSnapshot エラー:', error);
        console.error('エラーコード:', error.code);
        console.error('エラーメッセージ:', error.message);
        
        // 具体的なエラーメッセージを表示
        let userMessage = 'データの読み込みに失敗しました';
        if (error.code === 'permission-denied') {
          userMessage = 'アクセス権限がありません。Firestoreセキュリティルールを確認してください。';
        } else if (error.code === 'unauthenticated') {
          userMessage = '認証が必要です。再ログインしてください。';
        }
        
        alert(userMessage + `\n詳細: ${error.message}`);
        setLoading(false);
      }
    );

    return () => {
      console.log('onSnapshot unsubscribe');
      unsubscribe();
    };
  }, [currentUser, personalSettingsDocId]);

  // 保存処理（完全修正版）
  const handleSave = async () => {
    console.log('保存処理開始');
    
    if (!currentUser) {
      alert('ログインが必要です');
      return;
    }

    if (!personalSettingsDocId) {
      alert('ユーザーIDが取得できません');
      return;
    }

    setSaving(true);
    
    try {
      const personalData = {
        userId: currentUser.uid, // 必須：セキュリティルール用
        height: height ? parseFloat(height) : null,
        birthday: birthday || null,
        gender: gender || null,
        bloodType: bloodType || null,
        activityLevel: activityLevel || '普通',
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        targetCaloriesIntake: targetCaloriesIntake ? parseInt(targetCaloriesIntake) : null,
        targetCaloriesBurn: targetCaloriesBurn ? parseInt(targetCaloriesBurn) : null,
        targetSleepHours: targetSleepHours ? parseFloat(targetSleepHours) : 8,
        targetExerciseMinutes: targetExerciseMinutes ? parseInt(targetExerciseMinutes) : 30,
        enableNotifications: enableNotifications,
        notificationTime: notificationTime || '22:00',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('保存データ:', personalData);
      console.log('保存先:', `personal_settings/${personalSettingsDocId}`);

      // merge: true で既存データを保持しつつ更新
      await setDoc(doc(db, 'personal_settings', personalSettingsDocId), personalData, { merge: true });
      
      console.log('保存成功');
      alert('個人設定を保存しました！');
      
    } catch (error) {
      console.error('保存エラー:', error);
      console.error('エラーコード:', error.code);
      console.error('エラーメッセージ:', error.message);
      
      let userMessage = '保存に失敗しました';
      if (error.code === 'permission-denied') {
        userMessage = 'アクセス権限がありません。Firestoreセキュリティルールを確認してください。';
      } else if (error.code === 'unauthenticated') {
        userMessage = '認証が必要です。再ログインしてください。';
      }
      
      alert(userMessage + `\n詳細: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // エクスポート統計取得
  const getExportStats = async (startDate, endDate) => {
    if (!currentUser || !startDate || !endDate) return null;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startDateString = start.toDateString();
      const endDateString = end.toDateString();

      const q = query(
        collection(db, 'records'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const recordDate = new Date(data.date);
        if (recordDate >= start && recordDate <= end) {
          records.push({ id: doc.id, ...data });
        }
      });

      // カテゴリ別集計
      const categoryCount = {};
      records.forEach(record => {
        categoryCount[record.category] = (categoryCount[record.category] || 0) + 1;
      });

      return {
        totalCount: records.length,
        categoryBreakdown: categoryCount,
        dateRange: {
          from: startDateString,
          to: endDateString
        }
      };
    } catch (error) {
      console.error('エクスポート統計取得エラー:', error);
      return null;
    }
  };

  // データエクスポート
  const handleExportData = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert('エクスポート期間を指定してください');
      return;
    }

    const stats = await getExportStats(exportStartDate, exportEndDate);
    if (!stats || stats.totalCount === 0) {
      alert('エクスポート対象のデータがありません');
      return;
    }

    setIsExporting(true);

    try {
      const start = new Date(exportStartDate);
      const end = new Date(exportEndDate);
      
      const q = query(
        collection(db, 'records'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const recordDate = new Date(data.date);
        if (recordDate >= start && recordDate <= end) {
          records.push({ id: doc.id, ...data });
        }
      });

      // CSVデータの作成
      const csvHeaders = ['日付', 'カテゴリ', '時刻', '内容', '金額', 'カロリー', 'メモ'];
      const csvRows = records.map(record => [
        record.date || '',
        record.category || '',
        record.recordTime || record.wakeTime || record.startTime || '',
        record.mealContent || record.exerciseType || record.transportMethod || '',
        record.amount || '',
        record.calories || record.caloriesBurned || '',
        record.memo || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // ファイルダウンロード
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ライフトラッカー_${exportStartDate}_${exportEndDate}.csv`;
      link.click();

      alert(`${stats.totalCount}件のデータをエクスポートしました`);

    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('エクスポートに失敗しました: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 削除統計取得
  const getDeleteStats = async (endDate) => {
    if (!currentUser || !endDate) return null;

    try {
      const targetDate = new Date(endDate);
      const targetDateString = targetDate.toDateString();

      const q = query(
        collection(db, 'records'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date <= targetDateString) {
          records.push({ id: doc.id, ...data });
        }
      });

      // カテゴリ別集計
      const categoryCount = {};
      records.forEach(record => {
        categoryCount[record.category] = (categoryCount[record.category] || 0) + 1;
      });

      return {
        totalCount: records.length,
        categoryBreakdown: categoryCount,
        dateRange: {
          from: records.length > 0 ? records.map(r => r.date).sort()[0] : endDate,
          to: endDate
        }
      };
    } catch (error) {
      console.error('削除統計取得エラー:', error);
      return null;
    }
  };

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
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const docsToDelete = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.date <= targetDateString) {
          docsToDelete.push(docSnapshot.ref);
        }
      });
      
      if (docsToDelete.length === 0) {
        alert('削除対象のデータがありません');
        return;
      }

      // バッチ削除（Firestoreの制限により500件ずつ処理）
      const batchSize = 500;
      let totalDeleted = 0;

      for (let i = 0; i < docsToDelete.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = docsToDelete.slice(i, i + batchSize);
        
        batchDocs.forEach((docRef) => {
          batch.delete(docRef);
        });
        
        await batch.commit();
        totalDeleted += batchDocs.length;
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
        {/* 個人情報セクション */}
        <div className="settings-section">
          <h3>📋 個人情報</h3>
          
          <div className="form-group">
            <label>身長 (cm):</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
            />
          </div>

          <div className="form-group">
            <label>生年月日:</label>
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
            <label>血液型:</label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
            >
              <option value="">選択してください</option>
              <option value="A">A型</option>
              <option value="B">B型</option>
              <option value="O">O型</option>
              <option value="AB">AB型</option>
            </select>
          </div>

          <div className="form-group">
            <label>活動レベル:</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
            >
              <option value="低い">低い（座りがち）</option>
              <option value="普通">普通（週1-3回運動）</option>
              <option value="高い">高い（週4-6回運動）</option>
              <option value="非常に高い">非常に高い（毎日運動）</option>
            </select>
          </div>
        </div>

        {/* 目標設定セクション */}
        <div className="settings-section">
          <h3>🎯 目標設定</h3>
          
          <div className="form-group">
            <label>目標体重 (kg):</label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="60.0"
            />
            {bmr && (
              <div className="calculated-info">
                予想基礎代謝: {bmr}kcal/日
              </div>
            )}
          </div>

          <div className="form-group">
            <label>目標摂取カロリー (kcal/日):</label>
            <input
              type="number"
              value={targetCaloriesIntake}
              onChange={(e) => setTargetCaloriesIntake(e.target.value)}
              placeholder="2000"
            />
          </div>

          <div className="form-group">
            <label>目標消費カロリー (kcal/日):</label>
            <input
              type="number"
              value={targetCaloriesBurn}
              onChange={(e) => setTargetCaloriesBurn(e.target.value)}
              placeholder="300"
            />
          </div>

          <div className="form-group">
            <label>目標睡眠時間 (時間/日):</label>
            <input
              type="number"
              step="0.5"
              value={targetSleepHours}
              onChange={(e) => setTargetSleepHours(e.target.value)}
              placeholder="8"
            />
          </div>

          <div className="form-group">
            <label>目標運動時間 (分/日):</label>
            <input
              type="number"
              value={targetExerciseMinutes}
              onChange={(e) => setTargetExerciseMinutes(e.target.value)}
              placeholder="30"
            />
          </div>
        </div>

        {/* 通知設定セクション */}
        <div className="settings-section">
          <h3>🔔 通知設定</h3>
          
          <div className="switch-group">
            <label>通知を有効にする</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={enableNotifications}
                onChange={(e) => setEnableNotifications(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="form-group">
            <label>通知時刻:</label>
            <input
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              disabled={!enableNotifications}
            />
            <div className="notification-note">
              ※ 現在はブラウザ通知のみサポート
            </div>
          </div>
        </div>

        {/* データ管理セクション */}
        <div className="settings-section">
          <h3>💾 データ管理</h3>

          {/* データエクスポート */}
          <div className="export-section">
            <h4>データエクスポート</h4>
            <div className="date-range-inputs">
              <div className="date-input-group">
                <label>開始日:</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label>終了日:</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>

            {exportStats && (
              <div className="export-preview">
                <h4>エクスポート予定データ</h4>
                <p><strong>総件数:</strong> {exportStats.totalCount}件</p>
                <p><strong>期間:</strong> {exportStats.dateRange.from} 〜 {exportStats.dateRange.to}</p>
                <div className="category-breakdown">
                  <strong>カテゴリ別内訳:</strong>
                  <ul>
                    {Object.entries(exportStats.categoryBreakdown).map(([category, count]) => (
                      <li key={category}>{category}: {count}件</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {exportStartDate && exportEndDate && !exportStats && (
              <div className="export-error">
                指定期間にデータがありません
              </div>
            )}

            <button 
              className="export-btn"
              onClick={handleExportData}
              disabled={isExporting || !exportStartDate || !exportEndDate || !exportStats}
            >
              {isExporting ? 'エクスポート中...' : 'CSVでエクスポート'}
            </button>

            <div className="export-info">
              エクスポートしたCSVファイルはExcelで開くことができます
            </div>
          </div>

          {/* データ削除 */}
          <div className="delete-date-section">
            <h4>データ削除</h4>
            <label>削除終了日（この日以前のデータを削除）:</label>
            <input
              type="date"
              value={deleteDate}
              onChange={(e) => setDeleteDate(e.target.value)}
            />

            {deleteStats && (
              <div className="delete-preview">
                <h4>削除予定データ</h4>
                <p><strong>総件数:</strong> {deleteStats.totalCount}件</p>
                <p><strong>期間:</strong> {deleteStats.dateRange.from} 〜 {deleteStats.dateRange.to}</p>
                <div className="category-breakdown">
                  <strong>カテゴリ別内訳:</strong>
                  <ul>
                    {Object.entries(deleteStats.categoryBreakdown).map(([category, count]) => (
                      <li key={category}>{category}: {count}件</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {deleteDate && !deleteStats && (
              <div className="delete-warning">
                指定日以前にデータがありません
              </div>
            )}

            <button 
              className="delete-data-btn"
              onClick={handleDeleteDataToDate}
              disabled={isDeleting || !deleteDate || !deleteStats}
            >
              {isDeleting ? '削除中...' : 'データを削除'}
            </button>

            <div className="delete-warning">
              ⚠️ 削除したデータは元に戻せません。エクスポートしてからの削除をお勧めします。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalSettingsScreen;
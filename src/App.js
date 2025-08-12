import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import MealRecord from './MealRecord';
import SleepRecord from './SleepRecord';
import ExpenseRecord from './ExpenseRecord';
import MeasurementRecord from './MeasurementRecord';
import ExerciseRecord from './ExerciseRecord';
import MoveRecord from './MoveRecord';
import InfoRecord from './InfoRecord';
import SettingsScreen from './SettingsScreen';
import LoginScreen from './components/LoginScreen'; // ← 追加
import { AuthProvider, useAuth } from './contexts/AuthContext'; // ← 追加
import './App.css';

// メインアプリコンポーネント（認証後に表示される画面）
function MainApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);

  // 認証情報を取得
  const { currentUser, logout } = useAuth();

  // データ読み込み（ユーザー固有のデータのみ）
  useEffect(() => {
    if (!currentUser) return; // ログインしていない場合は何もしない

    console.log('データ読み込み開始:', currentDate);
    const dateString = currentDate.toDateString();
    console.log('検索対象日付:', dateString);
    
    const q = query(
      collection(db, 'records'),
      where('date', '==', dateString),
      where('userId', '==', currentUser.uid) // ← ユーザー固有のデータのみ取得
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        console.log('Firestore応答:', querySnapshot.size, '件');
        const recordsData = [];
        querySnapshot.forEach((doc) => {
          console.log('データ:', doc.data());
          recordsData.push({ id: doc.id, ...doc.data() });
        });
        
        // フロントエンドで記録時刻順にソート（降順）
        recordsData.sort((a, b) => {
          const timeA = a.recordTime || a.wakeTime || a.startTime || '00:00';
          const timeB = b.recordTime || b.wakeTime || b.startTime || '00:00';
          return timeB.localeCompare(timeA); // 降順
        });
        
        setRecords(recordsData);
        setLoading(false);
      },
      (error) => {
        console.error('Firestoreエラー:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentDate, currentUser]);

  // その日の概要を計算
  const calculateSummary = () => {
    const totalExpense = records
      .filter(r => r.category === '支出' || (r.category === '食事' && r.amount > 0) || (r.category === '移動' && r.amount > 0))
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const totalCaloriesIntake = records
      .filter(r => r.category === '食事')
      .reduce((sum, r) => sum + (r.calories || 0), 0);
    
    // 睡眠時間の計算（最新の記録を使用）
    const sleepRecord = records.find(r => r.category === '睡眠');
    const sleepHours = sleepRecord ? 
      sleepRecord.sleepHours + (sleepRecord.sleepMinutes / 60) : 0;
    
    // 運動記録から消費カロリーと運動時間を計算
    const totalCaloriesBurn = records
      .filter(r => r.category === '運動' || r.category === '移動')
      .reduce((sum, r) => sum + (r.caloriesBurned || 0), 0);
    
    const exerciseMinutes = records
      .filter(r => r.category === '運動')
      .reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      expense: totalExpense,
      caloriesIntake: totalCaloriesIntake,
      caloriesBurn: totalCaloriesBurn,
      sleepHours: Math.round(sleepHours * 10) / 10, // 小数点1桁
      exerciseMinutes: exerciseMinutes
    };
  };

  const summary = calculateSummary();

  // 日付を文字列に変換
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  // 日付変更ハンドラー
  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // 記録ボタンのハンドラー
  const handleRecord = (category) => {
    if (category === '食事') {
      setCurrentScreen('meal-record');
    } else if (category === '睡眠') {
      setCurrentScreen('sleep-record');
    } else if (category === '支出') {
      setCurrentScreen('expense-record');
    } else if (category === '計量') {
      setCurrentScreen('measurement-record');
    } else if (category === '運動') {
      setCurrentScreen('exercise-record');
    } else if (category === '移動') {
      setCurrentScreen('move-record');
    } else if (category === '情報') {
      setCurrentScreen('info-record');
    } else {
      alert(`${category}の記録画面は今後実装予定です`);
    }
  };

  // 画面遷移ハンドラー
  const handleBack = () => {
    setCurrentScreen('dashboard');
    setEditingRecord(null);
  };

  const handleSave = () => {
    setCurrentScreen('dashboard');
    setEditingRecord(null);
    // データはリアルタイムで更新されるので、ここでは何もしない
  };

  // 設定画面への遷移
  const handleSettings = () => {
    setCurrentScreen('settings');
  };

  // ログアウト処理
  const handleLogout = async () => {
    if (window.confirm('ログアウトしますか？')) {
      try {
        await logout();
      } catch (error) {
        console.error('ログアウトエラー:', error);
        alert('ログアウトに失敗しました');
      }
    }
  };

  // 編集画面への遷移
  const handleEdit = (record) => {
    if (record.category === '食事') {
      setCurrentScreen('meal-edit');
      setEditingRecord(record);
    } else if (record.category === '睡眠') {
      setCurrentScreen('sleep-edit');
      setEditingRecord(record);
    } else if (record.category === '支出') {
      setCurrentScreen('expense-edit');
      setEditingRecord(record);
    } else if (record.category === '計量') {
      setCurrentScreen('measurement-edit');
      setEditingRecord(record);
    } else if (record.category === '運動') {
      setCurrentScreen('exercise-edit');
      setEditingRecord(record);
    } else if (record.category === '移動') {
      setCurrentScreen('move-edit');
      setEditingRecord(record);
    } else if (record.category === '情報') {
      setCurrentScreen('info-edit');
      setEditingRecord(record);
    } else {
      alert(`${record.category}の編集機能は今後実装予定です`);
    }
  };

  // 記録を表示用にフォーマット
  const formatRecord = (record) => {
    const time = record.recordTime || record.wakeTime || record.startTime || '時刻未設定';
    let content = '';
    let icon = '';

    switch (record.category) {
      case '食事':
        icon = '🍽️';
        const amountText = record.amount > 0 ? ` ¥${record.amount.toLocaleString()}` : '';
        const mealContentText = record.mealContent ? ` ${record.mealContent}` : '';
        content = `${record.mealType}${amountText} ${record.calories}kcal${mealContentText}`;
        break;
      case '睡眠':
        icon = '😴';
        content = `睡眠時間: ${record.sleepHours}時間${record.sleepMinutes}分 (${record.sleepTime}〜${record.wakeTime})`;
        break;
      case '支出':
        icon = '💰';
        content = `${record.paymentLocation} ¥${record.amount.toLocaleString()} ${record.expenseContent}`;
        break;
      case '計量':
        icon = '⚖️';
        let measurementDetails = [];
        if (record.weight) measurementDetails.push(`体重${record.weight}kg`);
        if (record.bmi) measurementDetails.push(`BMI${record.bmi}`);
        if (record.bodyFatRate) measurementDetails.push(`体脂肪${record.bodyFatRate}%`);
        if (record.bloodPressureHigh && record.bloodPressureLow) {
          measurementDetails.push(`血圧${record.bloodPressureHigh}/${record.bloodPressureLow}`);
        }
        content = measurementDetails.join(' ') || '測定データ';
        break;
      case '運動':
        icon = '🏃';
        let exerciseDetails = [record.exerciseType];
        if (record.caloriesBurned) exerciseDetails.push(`${record.caloriesBurned}kcal`);
        if (record.duration) exerciseDetails.push(`${record.duration}分`);
        if (record.distance) exerciseDetails.push(`${record.distance}km`);
        if (record.exerciseContent) exerciseDetails.push(record.exerciseContent);
        content = exerciseDetails.join(' ');
        break;
      case '移動':
        icon = '🚶';
        const transportText = record.transportMethod;
        
        // 移動時間の表示
        const durationText = record.durationMinutes ? 
          record.durationMinutes >= 60 ? 
            `${Math.floor(record.durationMinutes/60)}時間${record.durationMinutes%60}分` : 
            `${record.durationMinutes}分` 
          : '';
        
        // 時間範囲の表示 (開始時刻〜終了時刻)
        const timeRangeText = record.startTime && record.endTime ? 
          `(${record.startTime}〜${record.endTime})` : '';
        
        // 金額の表示
        const moveAmountText = record.amount > 0 ? ` ¥${record.amount.toLocaleString()}` : '';
        
        // ルートの表示
        const routeText = `${record.fromLocation}→${record.toLocation}`;
        
        // 全体の組み立て: 交通手段 時間(開始〜終了) 金額 ルート
        content = `${transportText} ${durationText}${timeRangeText}${moveAmountText} ${routeText}`;
        break;
      case '情報':
        icon = '📝';
        const priorityIcon = record.priority === '重要' ? '🔴' : record.priority === '低' ? '🟢' : '🟡';
        const typeText = record.infoType;
        const completionText = record.infoType === 'TODO' && record.isCompleted ? ' ✅' : '';
        const dueDateText = record.dueDate ? ` (${record.dueDate}期限)` : '';
        
        // 情報内容の最初の50文字のみ表示
        const shortContent = record.infoContent.length > 50 ? 
          record.infoContent.substring(0, 50) + '...' : 
          record.infoContent;
        
        content = `${priorityIcon} [${typeText}] ${shortContent}${dueDateText}${completionText}`;
        break;
      // 今後他のカテゴリも追加
      default:
        icon = '📝';
        content = record.content || '内容なし';
    }

    return { time, content, icon };
  };

  // 画面の条件分岐レンダリング
  if (currentScreen === 'settings') {
    return <SettingsScreen onBack={handleBack} />;
  }

  if (currentScreen === 'meal-record') {
    return <MealRecord onBack={handleBack} onSave={handleSave} />;
  }
  
  if (currentScreen === 'meal-edit') {
    return <MealRecord onBack={handleBack} onSave={handleSave} editingRecord={editingRecord} />;
  }

  if (currentScreen === 'sleep-record') {
    return <SleepRecord onBack={handleBack} onSave={handleSave} />;
  }
  
  if (currentScreen === 'sleep-edit') {
    return <SleepRecord onBack={handleBack} onSave={handleSave} editingRecord={editingRecord} />;
  }

  if (currentScreen === 'expense-record') {
    return <ExpenseRecord onBack={handleBack} onSave={handleSave} />;
  }
  
  if (currentScreen === 'expense-edit') {
    return <ExpenseRecord onBack={handleBack} onSave={handleSave} editingRecord={editingRecord} />;
  }

  if (currentScreen === 'measurement-record') {
    return <MeasurementRecord onBack={handleBack} onSave={handleSave} />;
  }
  
  if (currentScreen === 'measurement-edit') {
    return <MeasurementRecord onBack={handleBack} onSave={handleSave} editingRecord={editingRecord} />;
  }

  if (currentScreen === 'exercise-record') {
    return <ExerciseRecord onBack={handleBack} onSave={handleSave} />;
  }
  
  if (currentScreen === 'exercise-edit') {
    return <ExerciseRecord onBack={handleBack} onSave={handleSave} editingRecord={editingRecord} />;
  }

  if (currentScreen === 'move-record') {
    return <MoveRecord onBack={handleBack} onSave={handleSave} />;
  }
  
  if (currentScreen === 'move-edit') {
    return <MoveRecord onBack={handleBack} onSave={handleSave} editingRecord={editingRecord} />;
  }

  if (currentScreen === 'info-record') {
    return <InfoRecord onBack={handleBack} onSave={handleSave} />;
  }
  
  if (currentScreen === 'info-edit') {
    return <InfoRecord onBack={handleBack} onSave={handleSave} editingRecord={editingRecord} />;
  }

  // メイン画面（ダッシュボード）
  return (
    <div className="App">
      {/* ヘッダー（ログアウトボタン追加） */}
      <div className="app-header">
        <h1>ライフトラッカー</h1>
        <div className="header-buttons">
          <button className="settings-btn" onClick={handleSettings}>⚙️</button>
          <button className="logout-btn" onClick={handleLogout}>👋</button>
        </div>
      </div>

      {/* 記録ボタン */}
      <div className="record-buttons">
        <div className="button-row">
          <button className="record-btn" onClick={() => handleRecord('食事')}>🍽️ 食事</button>
          <button className="record-btn" onClick={() => handleRecord('睡眠')}>😴 睡眠</button>
          <button className="record-btn" onClick={() => handleRecord('支出')}>💰 支出</button>
        </div>
        <div className="button-row">
          <button className="record-btn" onClick={() => handleRecord('計量')}>⚖️ 計量</button>
          <button className="record-btn" onClick={() => handleRecord('運動')}>🏃 運動</button>
          <button className="record-btn" onClick={() => handleRecord('移動')}>🚶 移動</button>
        </div>
        <div className="button-row">
          <button className="record-btn" onClick={() => handleRecord('情報')}>📝 情報</button>
          <button className="record-btn empty"></button>
          <button className="record-btn empty"></button>
        </div>
      </div>

      {/* 日付選択 */}
      <div className="date-selector">
        <button className="date-arrow" onClick={() => changeDate(-1)}>←</button>
        <div className="current-date">{formatDate(currentDate)}</div>
        <button className="date-arrow" onClick={() => changeDate(1)}>→</button>
      </div>

      {/* その日の概要 */}
      <div className="daily-summary">
        <h3>今日の概要</h3>
        <div className="summary-item">💰 支出: ¥{summary.expense.toLocaleString()}</div>
        <div className="summary-item">🍽️ 摂取: {summary.caloriesIntake}kcal</div>
        <div className="summary-item">🔥 消費: {summary.caloriesBurn}kcal</div>
        <div className="summary-item">😴 睡眠: {summary.sleepHours}時間</div>
        <div className="summary-item">🏃 運動: {summary.exerciseMinutes}分</div>
      </div>

      {/* 時系列一覧 */}
      <div className="timeline">
        <h3>記録一覧</h3>
        {loading ? (
          <div>読み込み中...</div>
        ) : records.length === 0 ? (
          <div className="timeline-empty">今日の記録はまだありません</div>
        ) : (
          records.map((record) => {
            const { time, content, icon } = formatRecord(record);
            return (
              <div key={record.id} className="timeline-item" onClick={() => handleEdit(record)}>
                <div className="timeline-time">{time}</div>
                <div className="timeline-icon">{icon}</div>
                <div className="timeline-content">{content}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 最上位のAppコンポーネント（認証プロバイダーとログイン状態管理）
function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

// 認証状態に応じてログイン画面かメイン画面を表示
function AppWithAuth() {
  const { currentUser } = useAuth();

  return (
    <div>
      {currentUser ? <MainApp /> : <LoginScreen />}
    </div>
  );
}

export default App;

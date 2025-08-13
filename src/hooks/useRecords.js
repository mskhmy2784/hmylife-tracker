// src/hooks/useRecords.js
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { recordsService } from '../services/recordsService';
import { useAuth } from './useAuth';
import { formatDate } from '../utils/dateUtils';

const RecordsContext = createContext();

export function useRecords() {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within RecordsProvider');
  }
  return context;
}

export function RecordsProvider({ children }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 指定日の記録を取得
  const fetchRecords = useCallback(async (date, showLoading = true) => {
    if (!user) {
      setRecords([]);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      clearError();
      
      const dateString = formatDate(date);
      const data = await recordsService.getRecordsByDate(user.uid, dateString);
      setRecords(data);
    } catch (err) {
      console.error('記録取得エラー:', err);
      setError(err.message);
      setRecords([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user, clearError]);

  // リアルタイムで記録を監視
  const subscribeToRecords = useCallback((date) => {
    if (!user) return;

    // 既存のリスナーを解除
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const dateString = formatDate(date);
    
    try {
      const unsubscribe = recordsService.subscribeToRecords(
        user.uid, 
        dateString, 
        (data, error) => {
          if (error) {
            setError(error.message);
            setRecords([]);
          } else {
            setRecords(data);
            clearError();
          }
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error('リアルタイム監視エラー:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [user, clearError]);

  // 記録追加
  const addRecord = useCallback(async (recordData) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    try {
      clearError();
      
      const newRecord = {
        ...recordData,
        userId: user.uid,
        date: formatDate(currentDate)
      };

      const id = await recordsService.addRecord(newRecord);
      
      // 楽観的更新は行わない（リアルタイムリスナーが更新）
      return id;
    } catch (err) {
      console.error('記録追加エラー:', err);
      setError(err.message);
      throw err;
    }
  }, [user, currentDate, clearError]);

  // 記録更新
  const updateRecord = useCallback(async (id, updates) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    try {
      clearError();
      
      await recordsService.updateRecord(id, {
        ...updates,
        userId: user.uid,
        date: formatDate(currentDate)
      });
      
      // 楽観的更新は行わない（リアルタイムリスナーが更新）
      return true;
    } catch (err) {
      console.error('記録更新エラー:', err);
      setError(err.message);
      throw err;
    }
  }, [user, currentDate, clearError]);

  // 記録削除
  const deleteRecord = useCallback(async (id) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    try {
      clearError();
      
      await recordsService.deleteRecord(id, user.uid, formatDate(currentDate));
      
      // 楽観的更新は行わない（リアルタイムリスナーが更新）
      return true;
    } catch (err) {
      console.error('記録削除エラー:', err);
      setError(err.message);
      throw err;
    }
  }, [user, currentDate, clearError]);

  // 日付変更
  const changeDate = useCallback((newDate) => {
    setCurrentDate(newDate);
  }, []);

  // 前の日/次の日に移動
  const goToPreviousDay = useCallback(() => {
    const previousDay = new Date(currentDate);
    previousDay.setDate(currentDate.getDate() - 1);
    setCurrentDate(previousDay);
  }, [currentDate]);

  const goToNextDay = useCallback(() => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDay);
  }, [currentDate]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // 日付の概要を計算
  const getDailySummary = useCallback(() => {
    if (!records || records.length === 0) {
      return {
        totalExpense: 0,
        totalCaloriesIntake: 0,
        totalCaloriesBurn: 0,
        sleepHours: 0,
        exerciseMinutes: 0,
        recordCount: 0
      };
    }

    const summary = {
      totalExpense: 0,
      totalCaloriesIntake: 0,
      totalCaloriesBurn: 0,
      sleepHours: 0,
      exerciseMinutes: 0,
      recordCount: records.length
    };

    records.forEach(record => {
      // 支出計算（支出カテゴリ + 食事・移動の金額）
      if (record.category === '支出' || 
          (record.category === '食事' && record.amount > 0) ||
          (record.category === '移動' && record.amount > 0)) {
        summary.totalExpense += record.amount || 0;
      }

      // 摂取カロリー計算
      if (record.category === '食事') {
        summary.totalCaloriesIntake += record.calories || 0;
      }

      // 消費カロリー計算
      if (record.category === '運動' || record.category === '移動') {
        summary.totalCaloriesBurn += record.caloriesBurned || 0;
      }

      // 睡眠時間計算
      if (record.category === '睡眠') {
        summary.sleepHours += (record.sleepHours || 0) + ((record.sleepMinutes || 0) / 60);
      }

      // 運動時間計算
      if (record.category === '運動') {
        summary.exerciseMinutes += record.duration || 0;
      }
    });

    // 小数点以下を適切に丸める
    summary.sleepHours = Math.round(summary.sleepHours * 10) / 10;

    return summary;
  }, [records]);

  // カテゴリ別の記録を取得
  const getRecordsByCategory = useCallback((category) => {
    return records.filter(record => record.category === category);
  }, [records]);

  // 現在の日付の記録を監視（useEffectで日付変更時に自動実行）
  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    subscribeToRecords(currentDate);

    // クリーンアップ時にリスナーを解除
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentDate, user, subscribeToRecords]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      // すべてのリスナーを解除
      recordsService.unsubscribeAll();
    };
  }, []);

  const value = {
    // データ
    records,
    currentDate,
    loading,
    error,
    
    // 計算されたデータ
    dailySummary: getDailySummary(),
    
    // アクション
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    clearError,
    
    // 日付操作
    changeDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    
    // ユーティリティ
    getRecordsByCategory
  };

  return (
    <RecordsContext.Provider value={value}>
      {children}
    </RecordsContext.Provider>
  );
}
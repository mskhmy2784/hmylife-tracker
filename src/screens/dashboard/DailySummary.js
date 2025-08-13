import React from 'react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatCurrency, formatCalories, formatSleepHours } from '../../utils/formatters';

function DailySummary({ 
  currentDate, 
  dailySummary, 
  onDateChange, 
  onPreviousDay, 
  onNextDay 
}) {
  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  const isFuture = () => {
    const today = new Date();
    return currentDate > today;
  };

  return (
    <div className="daily-summary">
      {/* 日付ナビゲーション */}
      <div className="date-navigation">
        <button 
          className="date-nav-btn" 
          onClick={onPreviousDay}
          aria-label="前の日"
        >
          ←
        </button>
        
        <div className="current-date">
          <h2>{formatDisplayDate(currentDate)}</h2>
          <span className="date-indicator">
            {isToday() ? '今日' : isFuture() ? '未来' : '過去'}
          </span>
        </div>
        
        <button 
          className="date-nav-btn" 
          onClick={onNextDay}
          aria-label="次の日"
        >
          →
        </button>
      </div>

      {/* サマリー情報 */}
      <div className="summary-grid">
        <div className="summary-card expense">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <div className="summary-label">支出</div>
            <div className="summary-value">
              {formatCurrency(dailySummary.totalExpense)}
            </div>
          </div>
        </div>

        <div className="summary-card calories">
          <div className="summary-icon">🍽️</div>
          <div className="summary-content">
            <div className="summary-label">摂取</div>
            <div className="summary-value">
              {formatCalories(dailySummary.totalCaloriesIntake)}
            </div>
          </div>
        </div>

        <div className="summary-card burn">
          <div className="summary-icon">🔥</div>
          <div className="summary-content">
            <div className="summary-label">消費</div>
            <div className="summary-value">
              {formatCalories(dailySummary.totalCaloriesBurn)}
            </div>
          </div>
        </div>

        <div className="summary-card sleep">
          <div className="summary-icon">😴</div>
          <div className="summary-content">
            <div className="summary-label">睡眠</div>
            <div className="summary-value">
              {formatSleepHours(dailySummary.sleepHours)}
            </div>
          </div>
        </div>

        <div className="summary-card exercise">
          <div className="summary-icon">🏃</div>
          <div className="summary-content">
            <div className="summary-label">運動</div>
            <div className="summary-value">
              {dailySummary.exerciseMinutes}分
            </div>
          </div>
        </div>

        <div className="summary-card records">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-label">記録数</div>
            <div className="summary-value">
              {dailySummary.recordCount}件
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailySummary;
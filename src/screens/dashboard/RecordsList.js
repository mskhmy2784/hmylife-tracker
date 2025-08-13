// src/screens/dashboard/RecordsList.js
import React from 'react';
import { formatTime } from '../../utils/dateUtils';
import { formatCurrency, formatCalories } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';

function RecordsList({ records, loading, onRecordEdit }) {
  const formatRecordContent = (record) => {
    switch (record.category) {
      case '食事':
        const amountText = record.amount > 0 ? ` ${formatCurrency(record.amount)}` : '';
        const caloriesText = record.calories ? ` ${formatCalories(record.calories)}` : '';
        const mealTypeText = record.mealType || '';
        const contentText = record.mealContent ? ` - ${record.mealContent}` : '';
        return `${mealTypeText}${amountText}${caloriesText}${contentText}`;

      case '睡眠':
        const sleepHours = record.sleepHours || 0;
        const sleepMinutes = record.sleepMinutes || 0;
        const timeRange = record.sleepTime && record.wakeTime ? 
          ` (${record.sleepTime}〜${record.wakeTime})` : '';
        return `睡眠時間: ${sleepHours}時間${sleepMinutes}分${timeRange}`;

      case '支出':
        const expenseAmount = formatCurrency(record.amount || 0);
        const location = record.paymentLocation || '';
        const content = record.expenseContent || '';
        return `${location} ${expenseAmount} ${content}`.trim();

      case '計量':
        const measurements = [];
        if (record.weight) measurements.push(`体重${record.weight}kg`);
        if (record.bmi) measurements.push(`BMI${record.bmi}`);
        if (record.bodyFatRate) measurements.push(`体脂肪${record.bodyFatRate}%`);
        if (record.bloodPressureHigh && record.bloodPressureLow) {
          measurements.push(`血圧${record.bloodPressureHigh}/${record.bloodPressureLow}`);
        }
        return measurements.join(' ') || '測定データ';

      case '運動':
        const exerciseDetails = [record.exerciseType || '運動'];
        if (record.caloriesBurned) exerciseDetails.push(`${record.caloriesBurned}kcal`);
        if (record.duration) exerciseDetails.push(`${record.duration}分`);
        if (record.distance) exerciseDetails.push(`${record.distance}km`);
        return exerciseDetails.join(' ');

      case '移動':
        const transport = record.transportMethod || '移動';
        const duration = record.durationMinutes ? 
          record.durationMinutes >= 60 ? 
            `${Math.floor(record.durationMinutes/60)}時間${record.durationMinutes%60}分` : 
            `${record.durationMinutes}分` 
          : '';
        const route = record.fromLocation && record.toLocation ? 
          `${record.fromLocation}→${record.toLocation}` : '';
        const moveAmount = record.amount > 0 ? formatCurrency(record.amount) : '';
        return `${transport} ${duration} ${moveAmount} ${route}`.trim();

      case '情報':
        const priorityIcon = record.priority === '高' ? '🔴' : 
                           record.priority === '低' ? '🟢' : '🟡';
        const typeText = record.infoType || 'メモ';
        const completionText = record.infoType === 'TODO' && record.isCompleted ? ' ✅' : '';
        const shortContent = record.infoContent && record.infoContent.length > 30 ? 
          record.infoContent.substring(0, 30) + '...' : 
          record.infoContent || '';
        return `${priorityIcon} [${typeText}] ${shortContent}${completionText}`;

      default:
        return record.content || '内容なし';
    }
  };

  if (loading) {
    return (
      <div className="records-list">
        <h3 className="records-title">記録一覧</h3>
        <div className="records-loading">
          <div className="loading-spinner"></div>
          <p>記録を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="records-list">
      <h3 className="records-title">記録一覧</h3>
      
      {records.length === 0 ? (
        <div className="records-empty">
          <div className="empty-icon">📝</div>
          <p>今日の記録はまだありません</p>
          <p className="empty-subtitle">上のボタンから記録を追加してみましょう</p>
        </div>
      ) : (
        <div className="records-container">
          {records.map((record) => {
            const recordTime = record.recordTime || record.wakeTime || record.startTime || '時刻未設定';
            const icon = CATEGORY_ICONS[record.category] || '📝';
            const content = formatRecordContent(record);

            return (
              <div 
                key={record.id} 
                className="record-item"
                onClick={() => onRecordEdit && onRecordEdit(record)}
              >
                <div className="record-time">{recordTime}</div>
                <div className="record-icon">{icon}</div>
                <div className="record-content">
                  <div className="record-category">{record.category}</div>
                  <div className="record-details">{content}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecordsList;
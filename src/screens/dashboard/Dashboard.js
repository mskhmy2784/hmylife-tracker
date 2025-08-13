// src/screens/dashboard/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecords } from '../../hooks/useRecords';
import Header from '../../components/layout/Header';
import DailySummary from './DailySummary';
import QuickActions from './QuickActions';
import RecordsList from './RecordsList';
import ErrorMessage from '../../components/ui/ErrorMessage';

function Dashboard() {
  const navigate = useNavigate();
  const { 
    records, 
    currentDate, 
    loading, 
    error, 
    dailySummary,
    changeDate,
    goToPreviousDay,
    goToNextDay
  } = useRecords();

  const handleRecordAdd = (category) => {
    // 今後実装予定：記録追加画面への遷移
    console.log('記録追加:', category);
    alert(`${category}の記録機能は今後実装予定です`);
  };

  const handleRecordEdit = (record) => {
    // 今後実装予定：記録編集画面への遷移
    console.log('記録編集:', record);
    alert(`${record.category}の編集機能は今後実装予定です`);
  };

  const handleDateChange = (newDate) => {
    changeDate(newDate);
  };

  return (
    <div className="dashboard">
      <Header />
      
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* エラーメッセージ */}
          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => {}}
            />
          )}
          
          {/* 日別サマリー */}
          <DailySummary 
            currentDate={currentDate}
            dailySummary={dailySummary}
            onDateChange={handleDateChange}
            onPreviousDay={goToPreviousDay}
            onNextDay={goToNextDay}
          />
          
          {/* クイックアクション */}
          <QuickActions onRecordAdd={handleRecordAdd} />
          
          {/* 記録一覧 */}
          <RecordsList 
            records={records}
            loading={loading}
            onRecordEdit={handleRecordEdit}
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
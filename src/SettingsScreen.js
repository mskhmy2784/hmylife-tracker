.App {
  max-width: 400px;
  margin: 0 auto;
  background-color: #f5f5f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ヘッダー */
.app-header {
  background-color: #4CAF50;
  color: white;
  padding: 15px;
  text-align: center;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5em;
}

.settings-btn {
  position: absolute;
  right: 15px;
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.settings-btn:hover {
  background-color: rgba(255,255,255,0.1);
}

/* 記録ボタン */
.record-buttons {
  padding: 20px 15px;
  background-color: white;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.button-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.button-row:last-child {
  margin-bottom: 0;
}

.record-btn {
  flex: 1;
  margin: 0 5px;
  padding: 15px 5px;
  border: none;
  border-radius: 8px;
  background-color: #e3f2fd;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 60px;
}

.record-btn:hover {
  background-color: #bbdefb;
}

.record-btn.empty {
  background-color: transparent;
  cursor: default;
}

.record-btn.empty:hover {
  background-color: transparent;
}

/* 日付選択 */
.date-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  background-color: white;
  margin: 0 10px 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.date-arrow {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px 15px;
  color: #666;
}

.date-arrow:hover {
  color: #333;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.current-date {
  font-size: 16px;
  font-weight: bold;
  margin: 0 20px;
  min-width: 150px;
  text-align: center;
}

/* その日の概要 */
.daily-summary {
  background-color: white;
  margin: 0 10px 10px;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-item {
  margin: 8px 0;
  font-size: 14px;
  color: #333;
}

/* 時系列一覧 */
.timeline {
  background-color: white;
  margin: 0 10px 10px;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-height: 200px;
}

.timeline h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
}

.timeline-empty {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 50px 20px;
}

.timeline-loading {
  text-align: center;
  color: #666;
  padding: 50px 20px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #4CAF50;
  gap: 10px;
}

.timeline-item.clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.timeline-item.clickable:hover {
  background-color: #f0f0f0;
}

.timeline-time {
  font-weight: bold;
  color: #333;
  min-width: 50px;
  font-size: 13px;
}

.timeline-icon {
  font-size: 16px;
  min-width: 20px;
}

.timeline-text {
  color: #555;
  font-size: 13px;
  line-height: 1.4;
  flex: 1;
}

/* 記録画面共通スタイル */
.meal-record, .sleep-record, .expense-record, .measurement-record, 
.exercise-record, .move-record, .info-record {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #4CAF50;
  color: white;
  padding: 15px;
}

.record-header h2 {
  margin: 0;
  font-size: 1.2em;
}

.back-btn, .save-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 5px 10px;
}

.back-btn:hover, .save-btn:hover {
  background-color: rgba(255,255,255,0.1);
  border-radius: 4px;
}

.record-form {
  padding: 20px 15px;
}

.form-group {
  margin-bottom: 20px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group input[type="time"],
.form-group input[type="number"],
.form-group input[type="text"],
.form-group input[type="date"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

/* バリデーション用スタイル */
.required {
  color: #f44336;
  font-weight: bold;
}

.error {
  border-color: #f44336 !important;
  background-color: #ffeaea !important;
}

.error-message {
  display: block;
  color: #f44336;
  font-size: 12px;
  margin-top: 5px;
  font-weight: normal;
}

.sleep-duration.error {
  border-color: #f44336;
  background-color: #ffeaea;
}

/* 食事種別ボタン */
.meal-type-buttons, .info-type-buttons {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.type-btn {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.type-btn.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.type-btn:hover {
  border-color: #4CAF50;
}

/* 優先度ボタン */
.priority-buttons {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.priority-btn {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.priority-btn.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.priority-btn:hover {
  border-color: #4CAF50;
}

/* チェックボックス */
.checkbox-group {
  display: flex;
  align-items: center;
  margin-top: 10px;
  gap: 8px;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkbox-group label {
  margin: 0;
  font-weight: normal;
  cursor: pointer;
}

.location-status {
  margin-left: 10px;
  color: #666;
  font-size: 14px;
}

/* カロリー入力 */
.calories-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* スイッチ関連 */
.switch-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4CAF50;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* 外食情報 */
.external-meal-section, .payment-info, .todo-section {
  margin-top: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #4CAF50;
}

/* 店舗選択・場所選択 */
.location-selection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 写真関連のスタイル */
.photo-section {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.photo-item {
  position: relative;
  display: inline-block;
}

.photo-delete-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  cursor: pointer;
}

.photo-delete-btn:hover {
  background: #cc0000;
}

input[type="file"] {
  margin-bottom: 10px;
}

/* 削除ボタン */
.delete-section {
  padding: 20px 15px;
  text-align: center;
}

.delete-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

/* 睡眠記録専用スタイル */
.sleep-note {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
}

.sleep-duration {
  font-size: 18px;
  font-weight: bold;
  color: #4CAF50;
  padding: 15px;
  background-color: #f0f8f0;
  border-radius: 6px;
  text-align: center;
  border: 2px solid #e8f5e8;
}

/* 計量記録専用スタイル */
.bmi-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: #f0f8f0;
  border-radius: 6px;
  border: 2px solid #e8f5e8;
}

.bmi-value {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
}

.bmi-category {
  font-size: 16px;
  color: #666;
}

.bmi-note {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
}

.blood-pressure-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blood-pressure-inputs input {
  width: 80px;
  flex: none;
}

.separator {
  font-size: 18px;
  font-weight: bold;
  color: #666;
}

.unit {
  font-size: 14px;
  color: #666;
  margin-left: 5px;
}

/* 運動記録専用スタイル */
.exercise-data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 10px;
}

.data-item {
  display: flex;
  flex-direction: column;
}

.data-item label {
  font-size: 14px;
  margin-bottom: 5px;
  color: #555;
  font-weight: bold;
}

.data-item input {
  margin-top: 0;
}

/* 移動記録専用スタイル */
.duration-display {
  font-size: 16px;
  font-weight: bold;
  color: #4CAF50;
  padding: 10px;
  background-color: #f0f8f0;
  border-radius: 6px;
  text-align: center;
  border: 2px solid #e8f5e8;
}

/* 情報記録専用スタイル */
.due-date-input {
  display: flex;
  gap: 10px;
}

.due-date-input input {
  flex: 1;
}

.completion-toggle {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-label {
  font-size: 14px;
  color: #999;
  transition: all 0.2s;
}

.status-label.active {
  font-weight: bold;
  color: #4CAF50;
}

/* 管理画面のスタイル */
.settings-screen {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.tab-menu {
  display: flex;
  background-color: white;
  margin: 0 10px;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-btn {
  flex: 1;
  padding: 15px;
  border: none;
  background-color: #f0f0f0;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: #4CAF50;
  color: white;
}

.tab-btn:hover:not(.active) {
  background-color: #e0e0e0;
}

.settings-content {
  background-color: white;
  margin: 0 10px 10px;
  padding: 20px;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-height: calc(100vh - 200px);
}

/* ユーザー基本情報セクション */
.user-info-section .form-group {
  margin-bottom: 25px;
}

.gender-buttons {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.gender-btn {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #ddd;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.gender-btn.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.gender-btn:hover:not(.active) {
  border-color: #4CAF50;
}

.info-display {
  margin-top: 8px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
  color: #2e7d32;
  font-weight: bold;
}

.calculation-results {
  background-color: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin: 25px 0;
}

.calculation-results h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e9ecef;
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  font-weight: bold;
  color: #555;
}

.result-value {
  font-size: 18px;
  font-weight: bold;
  color: #4CAF50;
}

.result-note {
  margin-top: 15px;
  font-size: 12px;
  color: #666;
  font-style: italic;
  line-height: 1.4;
}

.save-section {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.save-btn-large {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn-large:hover:not(:disabled) {
  background-color: #45a049;
}

.save-btn-large:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* マスタデータセクション */
.master-data-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.master-category {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.master-category h3 {
  margin: 0;
  padding: 15px 20px;
  background-color: #f8f9fa;
  color: #333;
  font-size: 16px;
  border-bottom: 1px solid #ddd;
}

.add-item-form {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #ddd;
}

.add-item-form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.add-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background-color: #45a049;
}

.master-list {
  max-height: 300px;
  overflow-y: auto;
}

.master-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.master-item:hover {
  background-color: #f8f9fa;
}

.master-item:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.delete-item-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.delete-item-btn:hover {
  background-color: #d32f2f;
}

/* レスポンシブ対応 */
@media (max-width: 480px) {
  .tab-btn {
    padding: 12px 8px;
    font-size: 14px;
  }
  
  .gender-buttons {
    flex-direction: column;
  }
  
  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .add-item-form {
    flex-direction: column;
  }
  
  .master-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .delete-item-btn {
    align-self: flex-end;
  }
}

/* レスポンシブ対応 */
@media (max-width: 480px) {
  .record-btn {
    font-size: 11px;
    padding: 12px 3px;
    min-height: 55px;
  }
  
  .current-date {
    font-size: 14px;
    min-width: 120px;
  }

  .exercise-data-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .blood-pressure-inputs {
    flex-wrap: wrap;
  }

  .due-date-input {
    flex-direction: column;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .meal-type-buttons, .info-type-buttons {
    flex-direction: column;
  }

  .type-btn {
    min-width: auto;
  }
}

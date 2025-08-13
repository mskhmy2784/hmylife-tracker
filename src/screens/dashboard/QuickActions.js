// src/screens/dashboard/QuickActions.js
import React from 'react';
import { CATEGORIES, CATEGORY_ICONS } from '../../utils/constants';

function QuickActions({ onRecordAdd }) {
  const actionButtons = [
    { category: CATEGORIES.MEAL, label: '食事', icon: CATEGORY_ICONS[CATEGORIES.MEAL] },
    { category: CATEGORIES.SLEEP, label: '睡眠', icon: CATEGORY_ICONS[CATEGORIES.SLEEP] },
    { category: CATEGORIES.EXPENSE, label: '支出', icon: CATEGORY_ICONS[CATEGORIES.EXPENSE] },
    { category: CATEGORIES.MEASUREMENT, label: '計量', icon: CATEGORY_ICONS[CATEGORIES.MEASUREMENT] },
    { category: CATEGORIES.EXERCISE, label: '運動', icon: CATEGORY_ICONS[CATEGORIES.EXERCISE] },
    { category: CATEGORIES.MOVEMENT, label: '移動', icon: CATEGORY_ICONS[CATEGORIES.MOVEMENT] },
    { category: CATEGORIES.INFO, label: '情報', icon: CATEGORY_ICONS[CATEGORIES.INFO] },
  ];

  return (
    <div className="quick-actions">
      <h3 className="quick-actions-title">記録を追加</h3>
      
      <div className="actions-grid">
        {actionButtons.map((action) => (
          <button
            key={action.category}
            className="action-btn"
            onClick={() => onRecordAdd(action.category)}
            aria-label={`${action.label}を記録`}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
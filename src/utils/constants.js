export const CATEGORIES = {
  MEAL: '食事',
  SLEEP: '睡眠',
  EXPENSE: '支出',
  MEASUREMENT: '計量',
  EXERCISE: '運動',
  MOVEMENT: '移動',
  INFO: '情報'
};

export const MEAL_TYPES = ['朝食', '昼食', '夕食', '間食'];

export const PAYMENT_METHODS = ['現金', 'クレジットカード', '電子マネー', '交通系IC', 'QRコード決済'];

export const EXERCISE_TYPES = ['ウォーキング', 'ジョギング', 'サイクリング', '筋トレ', 'ヨガ', 'ストレッチ', 'その他'];

export const TRANSPORT_METHODS = ['徒歩', '自転車', '電車', 'バス', 'タクシー', '自動車', 'その他'];

export const INFO_TYPES = ['メモ', 'TODO'];

export const PRIORITY_LEVELS = [
  { value: '高', label: '高', icon: '🔴' },
  { value: '中', label: '中', icon: '🟡' },
  { value: '低', label: '低', icon: '🟢' }
];

// デフォルトカロリー（食事種別ごと）
export const DEFAULT_CALORIES = {
  '朝食': 400,
  '昼食': 600,
  '夕食': 700,
  '間食': 200
};

// カテゴリ別のアイコン
export const CATEGORY_ICONS = {
  '食事': '🍽️',
  '睡眠': '😴',
  '支出': '💰',
  '計量': '⚖️',
  '運動': '🏃',
  '移動': '🚶',
  '情報': '📝'
};

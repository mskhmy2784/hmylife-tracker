export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '¥0';
  return `¥${amount.toLocaleString()}`;
};

export const formatCalories = (calories) => {
  if (typeof calories !== 'number') return '0kcal';
  return `${calories}kcal`;
};

export const formatDuration = (minutes) => {
  if (typeof minutes !== 'number') return '0分';
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}時間${remainingMinutes}分`
      : `${hours}時間`;
  }
  
  return `${minutes}分`;
};

export const formatWeight = (weight) => {
  if (typeof weight !== 'number') return '';
  return `${weight}kg`;
};

export const formatSleepHours = (hours) => {
  if (typeof hours !== 'number') return '0時間';
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}時間`;
  } else {
    return `${wholeHours}時間${minutes}分`;
  }
};

export const formatDistance = (distance) => {
  if (typeof distance !== 'number') return '';
  
  if (distance >= 1) {
    return `${distance}km`;
  } else {
    return `${Math.round(distance * 1000)}m`;
  }
};

export const formatBloodPressure = (high, low) => {
  if (!high || !low) return '';
  return `${high}/${low}`;
};

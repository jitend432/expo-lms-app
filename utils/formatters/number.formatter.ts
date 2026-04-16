// Format number with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Format currency
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format compact number (e.g., 1.2K, 3.4M)
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) {
    return num.toString();
  }
  
  const units = ['', 'K', 'M', 'B', 'T'];
  const order = Math.floor(Math.log10(num) / 3);
  const unitName = units[order];
  const value = num / Math.pow(1000, order);
  
  return `${value.toFixed(value < 10 ? 1 : 0)}${unitName}`;
};

// Format percentage
export const formatPercentage = (
  value: number,
  total: number,
  decimals: number = 1
): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format duration from seconds
export const formatDurationFromSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Format rating (e.g., 4.5 out of 5)
export const formatRating = (rating: number, maxRating: number = 5): string => {
  return `${rating.toFixed(1)} (${formatNumber(Math.floor(rating * 100))} reviews)`;
};

// Format ordinal number (1st, 2nd, 3rd, etc.)
export const formatOrdinal = (num: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

// Format decimal to fixed precision
export const formatDecimal = (
  num: number,
  precision: number = 2,
  trimZeros: boolean = true
): string => {
  let formatted = num.toFixed(precision);
  
  if (trimZeros) {
    formatted = formatted.replace(/\.?0+$/, '');
  }
  
  return formatted;
};

// Parse formatted number string to number
export const parseFormattedNumber = (str: string): number => {
  return parseFloat(str.replace(/[^0-9.-]+/g, ''));
};

// Calculate percentage
export const calculatePercentage = (
  value: number,
  total: number
): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

// Clamp number between min and max
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

// Round to nearest
export const roundTo = (num: number, decimals: number = 0): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};
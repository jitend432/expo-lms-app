import { Platform } from 'react-native';

// Format date to readable string
export const formatDate = (
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'long',
    day: 'numeric',
  };

  if (format === 'full') {
    options.weekday = 'long';
    options.hour = 'numeric';
    options.minute = 'numeric';
  }

  return d.toLocaleDateString(undefined, options);
};

// Format time to readable string
export const formatTime = (
  date: Date | string | number,
  includeSeconds: boolean = false
): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid time';
  }

  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  });
};

// Format date and time
export const formatDateTime = (
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  return `${formatDate(d, format)} at ${formatTime(d)}`;
};

// Format relative time (e.g., "2 hours ago", "3 days ago")
export const formatRelativeTime = (date: Date | string | number): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return seconds <= 5 ? 'just now' : `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
};

// Format duration in minutes to readable string
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

// Format date for API requests (ISO string)
export const formatDateForAPI = (date: Date | string | number): string => {
  return new Date(date).toISOString();
};

// Parse date from API response
export const parseAPIDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Check if date is today
export const isToday = (date: Date | string | number): boolean => {
  const d = new Date(date);
  const today = new Date();
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

// Check if date is yesterday
export const isYesterday = (date: Date | string | number): boolean => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
};

// Get friendly date format (Today, Yesterday, or formatted date)
export const getFriendlyDate = (date: Date | string | number): string => {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return formatDate(date, 'medium');
};

// Format date range
export const formatDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number
): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`;
    }
    return `${start.toLocaleString('default', { month: 'short' })} ${start.getDate()} - ${end.toLocaleString('default', { month: 'short' })} ${end.getDate()}, ${start.getFullYear()}`;
  }
  
  return `${formatDate(start, 'medium')} - ${formatDate(end, 'medium')}`;
};

// Add days to date
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Get start of day
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

// Get end of day
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};
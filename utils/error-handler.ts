import { Alert, Platform } from 'react-native';
import { ERROR_MESSAGES, HTTP_STATUS } from '@/constants/api';

export interface AppError extends Error {
  code?: string;
  status?: number;
  data?: any;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  isAuthError?: boolean;
  isValidationError?: boolean;
}

export class AppErrorClass extends Error implements AppError {
  code?: string;
  status?: number;
  data?: any;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  isAuthError?: boolean;
  isValidationError?: boolean;

  constructor(message: string, options?: Partial<AppError>) {
    super(message);
    this.name = 'AppError';
    Object.assign(this, options);
  }
}

// Parse API error response
export const parseApiError = (error: any): AppError => {
  // Network error
  if (error.message === 'Network Error' || error.isAxiosError && !error.response) {
    return new AppErrorClass(ERROR_MESSAGES.NETWORK_ERROR, {
      isNetworkError: true,
      code: 'NETWORK_ERROR',
    });
  }

  // Timeout error
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return new AppErrorClass(ERROR_MESSAGES.TIMEOUT_ERROR, {
      isTimeout: true,
      code: 'TIMEOUT_ERROR',
    });
  }

  // API response error
  if (error.response) {
    const { status, data } = error.response;
    
    const errorMessage = data?.message || data?.error || error.message;
    
    const appError = new AppErrorClass(errorMessage, {
      status,
      data,
    });

    // Set error flags based on status
    if (status === HTTP_STATUS.UNAUTHORIZED) {
      appError.isAuthError = true;
    } else if (status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
      appError.isValidationError = true;
    }

    return appError;
  }

  // Unknown error
  return new AppErrorClass(error.message || ERROR_MESSAGES.UNKNOWN_ERROR, {
    code: 'UNKNOWN_ERROR',
  });
};

// Get user-friendly error message
export const getUserFriendlyErrorMessage = (error: AppError): string => {
  if (error.isNetworkError) {
    return 'No internet connection. Please check your network settings.';
  }
  
  if (error.isTimeout) {
    return 'Request timed out. Please try again.';
  }
  
  if (error.isAuthError) {
    return 'Your session has expired. Please login again.';
  }
  
  if (error.isValidationError) {
    return error.message || 'Please check your input and try again.';
  }
  
  if (error.status === HTTP_STATUS.NOT_FOUND) {
    return 'The requested resource was not found.';
  }
  
  if (error.status === HTTP_STATUS.FORBIDDEN) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return 'Too many requests. Please try again later.';
  }
  
  if (error.status && error.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Handle error with user feedback
export const handleError = (
  error: any,
  options?: {
    showAlert?: boolean;
    title?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
  }
): AppError => {
  const { showAlert = true, title = 'Error', onRetry, onDismiss } = options || {};
  
  const appError = parseApiError(error);
  const message = getUserFriendlyErrorMessage(appError);
  
  if (showAlert) {
    const buttons = [];
    
    if (onRetry) {
      buttons.push({
        text: 'Retry',
        onPress: onRetry,
      });
    }
    
    buttons.push({
      text: 'OK',
      onPress: onDismiss,
    });
    
    Alert.alert(title, message, buttons);
  }
  
  return appError;
};

// Handle offline error
export const handleOfflineError = (
  action?: string,
  onRetry?: () => void
): void => {
  const actionText = action ? ` while trying to ${action}` : '';
  
  Alert.alert(
    'Offline',
    `You are currently offline${actionText}. Please check your internet connection and try again.`,
    onRetry
      ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: onRetry },
        ]
      : [{ text: 'OK' }]
  );
};

// Log error for debugging
export const logError = (
  error: any,
  context?: Record<string, any>
): void => {
  if (__DEV__) {
    console.error('Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      ...context,
      stack: error.stack,
    });
  }
  
  // Here you can integrate with error tracking service like Sentry
  // if (FEATURES.ENABLE_CRASH_REPORTING) {
  //   Sentry.captureException(error, { extra: context });
  // }
};

// Create error boundary fallback
export const createErrorFallback = (error: Error, resetError: () => void) => {
  return {
    title: 'Something went wrong',
    message: getUserFriendlyErrorMessage(error as AppError),
    onRetry: resetError,
  };
};
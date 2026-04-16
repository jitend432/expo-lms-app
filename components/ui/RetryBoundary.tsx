import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Button } from './Button';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
}

interface RetryBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => Promise<void> | void;
  config?: RetryConfig;
  fallback?: React.ReactNode;
  showRetryButton?: boolean;
  className?: string;
}

export const RetryBoundary: React.FC<RetryBoundaryProps> = ({
  children,
  onRetry,
  config = {},
  fallback,
  showRetryButton = true,
  className = '',
}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = config;

  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const handleError = useCallback((err: Error) => {
    setError(err);
  }, []);

  const retry = useCallback(async () => {
    if (!onRetry || retryCount >= maxRetries) {
      return;
    }

    if (!shouldRetry(error!)) {
      return;
    }

    setIsRetrying(true);
    setError(null);

    try {
      await onRetry();
      setRetryCount(0);
    } catch (err: any) {
      const delay = retryDelay * Math.pow(backoffMultiplier, retryCount);
      
      const id = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        retry();
      }, delay);
      
      setTimeoutId(id);
      setError(err);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount, maxRetries, error, shouldRetry, retryDelay, backoffMultiplier]);

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View className={`flex-1 items-center justify-center p-6 ${className}`}>
        <View className="bg-red-50 dark:bg-red-900/20 rounded-full p-4 mb-4">
          <Ionicons name="alert-circle-outline" size={48} color={colors.red[500]} />
        </View>
        
        <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Load
        </Text>
        
        <Text className="text-gray-600 dark:text-gray-400 text-center mb-2">
          {error.message}
        </Text>

        {retryCount > 0 && (
          <Text className="text-gray-500 dark:text-gray-500 text-sm mb-4">
            Retry attempt {retryCount} of {maxRetries}
          </Text>
        )}

        {isRetrying ? (
          <View className="items-center">
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text className="text-gray-600 dark:text-gray-400 mt-3">
              Retrying...
            </Text>
          </View>
        ) : (
          showRetryButton && (
            <View className="flex-row space-x-3">
              {retryCount < maxRetries && onRetry && (
                <Button onPress={retry} leftIcon="refresh-outline">
                  Retry
                </Button>
              )}
              <Button
                variant="outline"
                onPress={reset}
                leftIcon="close-outline"
              >
                Dismiss
              </Button>
            </View>
          )
        )}

        {retryCount >= maxRetries && (
          <Text className="text-red-500 text-sm mt-4">
            Maximum retry attempts reached
          </Text>
        )}
      </View>
    );
  }

  try {
    return <>{children}</>;
  } catch (err: any) {
    handleError(err);
    return null;
  }
};

interface RetryWrapperProps {
  children: (props: {
    isLoading: boolean;
    error: Error | null;
    retry: () => void;
  }) => React.ReactNode;
  action: () => Promise<any>;
  config?: RetryConfig;
}

export const RetryWrapper: React.FC<RetryWrapperProps> = ({
  children,
  action,
  config = {},
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await action();
      setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [action]);

  useEffect(() => {
    execute();
  }, [execute]);

  return (
    <RetryBoundary onRetry={execute} config={config}>
      {children({ isLoading, error, retry: execute })}
    </RetryBoundary>
  );
};
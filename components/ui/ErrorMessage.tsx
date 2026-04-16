import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface ErrorMessageProps {
  message: string;
  variant?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  onRetry?: () => void;
  autoDismiss?: boolean;
  duration?: number;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  variant = 'error',
  onDismiss,
  onRetry,
  autoDismiss = false,
  duration = 5000,
  className = '',
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'alert-circle',
          iconColor: colors.red[500],
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'warning',
          iconColor: colors.yellow[500],
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'information-circle',
          iconColor: colors.blue[500],
        };
      default:
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'alert-circle',
          iconColor: colors.red[500],
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
      className={`
        flex-row items-center
        border rounded-xl
        ${styles.bg}
        ${styles.border}
        ${Platform.OS === 'ios' ? 'shadow-sm' : 'elevation-2'}
        ${className}
      `}
    >
      <View className="p-3">
        <Ionicons name={styles.icon as any} size={22} color={styles.iconColor} />
      </View>

      <Text className={`flex-1 text-sm font-medium pr-2 ${styles.text}`}>
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="px-3 py-2 mr-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
            Retry
          </Text>
        </TouchableOpacity>
      )}

      {onDismiss && (
        <TouchableOpacity
          onPress={handleDismiss}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={styles.iconColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={64} color={colors.red[500]} />
          <Text className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
            Something went wrong
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center mt-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            className="mt-6 px-6 py-3 bg-primary-500 rounded-xl"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
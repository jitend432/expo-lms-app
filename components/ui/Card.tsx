import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onPress,
  disabled = false,
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'default':
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
      case 'elevated':
        return 'bg-white dark:bg-gray-800 shadow-lg shadow-black/10 dark:shadow-black/30';
      case 'outlined':
        return 'bg-transparent border-2 border-gray-300 dark:border-gray-600';
      case 'flat':
        return 'bg-gray-50 dark:bg-gray-800';
      default:
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
    }
  };

  const getPaddingStyles = (): string => {
    switch (padding) {
      case 'none':
        return 'p-0';
      case 'sm':
        return 'p-3';
      case 'md':
        return 'p-4';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      className={`
        rounded-2xl
        ${getVariantStyles()}
        ${getPaddingStyles()}
        ${onPress ? 'active:opacity-70' : ''}
        ${className}
      `}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  rightElement,
  className = '',
}) => {
  return (
    <View className={`flex-row items-center justify-between mb-3 ${className}`}>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <View
      className={`flex-row items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </View>
  );
};

interface CardDividerProps {
  className?: string;
}

export const CardDivider: React.FC<CardDividerProps> = ({ className = '' }) => {
  return (
    <View
      className={`h-px bg-gray-200 dark:bg-gray-700 my-3 ${className}`}
    />
  );
};
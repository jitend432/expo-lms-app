import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  textClassName = '',
  disabled,
  onPress,
  ...props
}) => {
  const getVariantStyles = (): { button: string; text: string } => {
    switch (variant) {
      case 'primary':
        return {
          button: 'bg-primary-500',
          text: 'text-white',
        };
      case 'secondary':
        return {
          button: 'bg-gray-200 dark:bg-gray-700',
          text: 'text-gray-900 dark:text-white',
        };
      case 'outline':
        return {
          button: 'bg-transparent border border-primary-500',
          text: 'text-primary-500',
        };
      case 'ghost':
        return {
          button: 'bg-transparent',
          text: 'text-primary-500',
        };
      case 'destructive':
        return {
          button: 'bg-red-500',
          text: 'text-white',
        };
      default:
        return {
          button: 'bg-primary-500',
          text: 'text-white',
        };
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 rounded-lg';
      case 'md':
        return 'px-4 py-2.5 rounded-xl';
      case 'lg':
        return 'px-6 py-3.5 rounded-xl';
      default:
        return 'px-4 py-2.5 rounded-xl';
    }
  };

  const getTextSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textSizeStyles = getTextSizeStyles();
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      className={`
        flex-row items-center justify-center
        ${variantStyles.button}
        ${sizeStyles}
        ${fullWidth ? 'w-full' : 'self-start'}
        ${isDisabled ? 'opacity-50' : 'opacity-100'}
        ${className}
      `}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? 'white' : colors.primary[500]}
        />
      ) : (
        <View className="flex-row items-center space-x-2">
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18}
              color={
                variant === 'primary' || variant === 'destructive'
                  ? 'white'
                  : colors.primary[500]
              }
            />
          )}
          <Text
            className={`
              font-semibold
              ${variantStyles.text}
              ${textSizeStyles}
              ${textClassName}
            `}
          >
            {children}
          </Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18}
              color={
                variant === 'primary' || variant === 'destructive'
                  ? 'white'
                  : colors.primary[500]
              }
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
import React, { useState, useRef, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  success?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      helperText,
      success = false,
      containerClassName = '',
      inputClassName = '',
      labelClassName = '',
      value,
      onFocus,
      onBlur,
      editable = true,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

    const handleFocus = (e: any) => {
      setIsFocused(true);
      animateLabel(1);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (!value) {
        animateLabel(0);
      }
      onBlur?.(e);
    };

    const animateLabel = (toValue: number) => {
      Animated.timing(animatedLabel, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const labelStyle = {
      top: animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: [Platform.OS === 'ios' ? 16 : 18, -8],
      }),
      fontSize: animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 12],
      }),
      color: animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: [
          colors.gray[400],
          error ? colors.red[500] : success ? colors.green[500] : colors.primary[500],
        ],
      }),
    };

    const getBorderColor = () => {
      if (error) return 'border-red-500';
      if (success) return 'border-green-500';
      if (isFocused) return 'border-primary-500';
      return 'border-gray-300 dark:border-gray-600';
    };

    const isPassword = props.secureTextEntry;
    const displayRightIcon = isPassword ? (
      <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
        <Ionicons
          name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.gray[400]}
        />
      </TouchableOpacity>
    ) : (
      rightIcon
    );

    return (
      <View className={`mb-4 ${containerClassName}`}>
        <View className="relative">
          {label && (
            <Animated.Text
              style={[
                {
                  position: 'absolute',
                  left: leftIcon ? 40 : 12,
                  zIndex: 1,
                  backgroundColor: 'transparent',
                  paddingHorizontal: 4,
                },
                labelStyle,
              ]}
              className={`font-medium ${labelClassName}`}
            >
              {label}
            </Animated.Text>
          )}

          <View
            className={`
              flex-row items-center
              border-2 rounded-xl
              ${getBorderColor()}
              ${!editable ? 'bg-gray-100 dark:bg-gray-800' : 'bg-transparent'}
              ${inputClassName}
            `}
          >
            {leftIcon && <View className="pl-3">{leftIcon}</View>}

            <TextInput
              ref={ref}
              className={`
                flex-1
                px-3 py-4
                text-base text-gray-900 dark:text-white
                ${Platform.OS === 'ios' ? 'pt-5' : 'pt-4'}
                ${!editable ? 'text-gray-500' : ''}
              `}
              placeholderTextColor={colors.gray[400]}
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={value}
              editable={editable}
              secureTextEntry={isPassword && !isPasswordVisible}
              {...props}
            />

            {displayRightIcon && <View className="pr-3">{displayRightIcon}</View>}
          </View>
        </View>

        {(error || helperText) && (
          <View className="flex-row items-center mt-1 ml-1">
            {error && (
              <Ionicons
                name="alert-circle-outline"
                size={14}
                color={colors.red[500]}
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              className={`text-xs ${
                error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {error || helperText}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
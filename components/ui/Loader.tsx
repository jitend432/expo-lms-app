import React, { useEffect, useRef } from 'react';
import { ViewStyle } from 'react-native';
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { colors } from '@/constants/theme';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color = colors.primary[500],
  text,
  fullScreen = false,
  overlay = false,
  className = '',
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fullScreen || overlay) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [fullScreen, overlay, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const LoaderContent = (
    <View
      className={`
        items-center justify-center
        ${fullScreen ? 'flex-1' : 'p-4'}
        ${overlay ? 'bg-black/50' : ''}
        ${className}
      `}
    >
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 items-center shadow-lg">
        <ActivityIndicator size={size} color={color} />
        {text && (
          <Text className="text-gray-600 dark:text-gray-300 mt-3 font-medium">
            {text}
          </Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={true} animationType="fade">
        {LoaderContent}
      </Modal>
    );
  }

  if (fullScreen) {
    return LoaderContent;
  }

  return (
    <View className="items-center justify-center p-4">
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
          {text}
        </Text>
      )}
    </View>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        opacity,
      }as Animated.WithAnimatedObject<ViewStyle>}
      className={`bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
};
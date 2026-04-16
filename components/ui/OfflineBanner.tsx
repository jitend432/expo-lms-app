import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineBannerProps {
  visible?: boolean;
  message?: string;
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  visible,
  message = 'No internet connection',
  className = '',
}) => {
  const { isConnected } = useNetworkStatus();
  const isVisible = visible ?? !isConnected;
  
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, translateY, opacity]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
      }}
      className={`
        absolute top-0 left-0 right-0 z-50
        bg-yellow-500 dark:bg-yellow-600
        ${Platform.OS === 'ios' ? 'pt-12' : 'pt-2'}
        pb-2 px-4
        ${className}
      `}
    >
      <View className="flex-row items-center justify-center">
        <Ionicons name="cloud-offline-outline" size={18} color="white" />
        <Text className="text-white font-medium ml-2 text-sm">
          {message}
        </Text>
        <Text className="text-white/80 ml-2 text-xs">
          • Offline Mode
        </Text>
      </View>
      <Text className="text-white/80 text-center text-xs mt-1">
        You're viewing cached content
      </Text>
    </Animated.View>
  );
};

export const NetworkStatusIndicator: React.FC = () => {
  const { isConnected, isSlowConnection, type } = useNetworkStatus();

  if (isConnected && !isSlowConnection) return null;

  const getStatusColor = () => {
    if (!isConnected) return colors.red[500];
    if (isSlowConnection) return colors.yellow[500];
    return colors.green[500];
  };

  const getStatusText = () => {
    if (!isConnected) return 'Offline';
    if (isSlowConnection) return 'Slow Connection';
    return type;
  };

  return (
    <View className="flex-row items-center">
      <View
        className="w-2 h-2 rounded-full mr-2"
        style={{ backgroundColor: getStatusColor() }}
      />
      <Text className="text-xs text-gray-600 dark:text-gray-400">
        {getStatusText()}
      </Text>
    </View>
  );
};
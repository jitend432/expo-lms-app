import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  useColorScheme,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCourses } from '@/hooks/useCourses';
import { colors } from '@/constants/theme';

interface SettingItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'link' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { user, logout, updateProfile } = useAuth();
  const { bookmarks } = useBookmarks();
  const { enrolledCourses } = useCourses();
  
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark === 'dark');
  const [offlineMode, setOfflineMode] = useState(false);

  const handleUpdateAvatar = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to update your avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsLoading(true);
        await updateProfile({
          avatar: `data:image/jpeg;base64,${result.assets[0].base64}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [updateProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }, [logout, router]);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings.'
        );
        return;
      }
    }
    setNotificationsEnabled(value);
  }, []);

  const settings: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      icon: 'notifications-outline',
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: handleToggleNotifications,
    },
    {
      id: 'darkMode',
      title: 'Dark Mode',
      icon: 'moon-outline',
      type: 'toggle',
      value: darkMode,
      onToggle: setDarkMode,
    },
    {
      id: 'offlineMode',
      title: 'Offline Mode',
      icon: 'cloud-offline-outline',
      type: 'toggle',
      value: offlineMode,
      onToggle: setOfflineMode,
    },
    {
      id: 'editProfile',
      title: 'Edit Profile',
      icon: 'create-outline',
      type: 'link',
      onPress: () => router.push('/profile/edit'),
    },
    {
      id: 'changePassword',
      title: 'Change Password',
      icon: 'key-outline',
      type: 'link',
      onPress: () => router.push('/profile/change-password'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      type: 'link',
      onPress: () => router.push('/legal/privacy'),
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'document-text-outline',
      type: 'link',
      onPress: () => router.push('/legal/terms'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      type: 'link',
      onPress: () => router.push('/support'),
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      type: 'link',
      onPress: () => router.push('/about'),
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out-outline',
      type: 'action',
      onPress: handleLogout,
      destructive: true,
    },
  ];

  const stats = [
    {
      label: 'Enrolled',
      value: enrolledCourses.length,
      icon: 'book-outline' as const,
      color: colors.primary[500],
    },
    {
      label: 'Bookmarks',
      value: bookmarks.length,
      icon: 'bookmark-outline' as const,
      color: colors.yellow[500],
    },
    {
      label: 'Completed',
      value: enrolledCourses.filter((c) => c.progress === 100).length,
      icon: 'checkmark-circle-outline' as const,
      color: colors.green[500],
    },
    {
      label: 'Hours',
      value: enrolledCourses.reduce((acc, c) => acc + (c.progress / 100) * c.duration, 0).toFixed(1),
      icon: 'time-outline' as const,
      color: colors.purple[500],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="bg-white dark:bg-gray-800 px-6 pt-6 pb-8 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center"
            >
              <Ionicons name="settings-outline" size={22} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center">
            <AvatarUpload
              uri={user?.avatar}
              size={80}
              onPress={handleUpdateAvatar}
              isLoading={isLoading}
            />
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {user?.name || 'User Name'}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {user?.email || 'email@example.com'}
              </Text>
              <View className="flex-row items-center mt-2">
                <View className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-medium text-green-700 dark:text-green-300">
                    {user?.role || 'Student'}
                  </Text>
                </View>
                <Text className="text-xs text-gray-400 ml-2">
                  Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <ProfileStats stats={stats} />

        {/* Settings */}
        <View className="mt-6 bg-white dark:bg-gray-800 rounded-t-3xl px-6 py-6">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Settings
          </Text>

          {settings.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <TouchableOpacity
                onPress={item.type !== 'toggle' ? item.onPress : undefined}
                disabled={item.type === 'toggle'}
                className={`flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 ${
                  index === settings.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg items-center justify-center mr-3">
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.destructive ? colors.red[500] : colors.primary[500]}
                    />
                  </View>
                  <Text
                    className={`text-base ${
                      item.destructive
                        ? 'text-red-500'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {item.title}
                  </Text>
                </View>

                {item.type === 'toggle' && (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
                    thumbColor={Platform.OS === 'ios' ? 'white' : undefined}
                  />
                )}

                {item.type === 'link' && (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.gray[400]}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* App Version */}
          <View className="items-center mt-8">
            <Text className="text-xs text-gray-400">
              Version 1.0.0 • Build 2026.01
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
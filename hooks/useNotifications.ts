import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAppState } from './useAppState';
import { asyncStorageService } from '@/services/storage/async-storage.service';
import { STORAGE_KEYS } from '@/constants/storage-keys';

interface NotificationState {
  permissionGranted: boolean;
  expoPushToken: string | null;
  lastNotificationTime: number | null;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permissionGranted: false,
    expoPushToken: null,
    lastNotificationTime: null,
  });
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { appState, previousAppState } = useAppState();

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setState((prev) => ({ ...prev, expoPushToken: token }));
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!);
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  // Check for 24-hour inactivity reminder
  useEffect(() => {
    const checkInactivity = async () => {
      if (appState === 'background' || appState === 'inactive') {
        const lastActive = await asyncStorageService.getItem<number>(
          STORAGE_KEYS.LAST_ACTIVE_TIME
        );
        
        if (lastActive) {
          const hoursSinceLastActive = (Date.now() - lastActive) / (1000 * 60 * 60);
          
          if (hoursSinceLastActive >= 24) {
            await scheduleInactivityReminder();
          }
        }
      }
      
      // Update last active time when app goes to background
      if (previousAppState === 'active' && appState !== 'active') {
        await asyncStorageService.setItem(STORAGE_KEYS.LAST_ACTIVE_TIME, Date.now());
      }
    };
    
    checkInactivity();
  }, [appState, previousAppState]);

  const registerForPushNotificationsAsync = useCallback(async () => {
    let token: string | null = null;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        setState((prev) => ({ ...prev, permissionGranted: false }));
        return null;
      }
      
      setState((prev) => ({ ...prev, permissionGranted: true }));

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
      } catch (error) {
        console.error('Failed to get push token:', error);
      }
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }, []);

  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ) => {
    try {
      if (!state.permissionGranted) {
        console.warn('Notification permissions not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger || null, // null means show immediately
      });

      setState((prev) => ({ ...prev, lastNotificationTime: Date.now() }));
      
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }, [state.permissionGranted]);

  const scheduleInactivityReminder = useCallback(async () => {
    const lastReminder = await asyncStorageService.getItem<number>(
      STORAGE_KEYS.LAST_INACTIVITY_REMINDER
    );
    
    // Only send one reminder per 24-hour period
    if (lastReminder && Date.now() - lastReminder < 24 * 60 * 60 * 1000) {
      return;
    }
    
    await scheduleNotification(
      'We miss you! 👋',
      'Come back and continue your learning journey. New courses are waiting for you!',
      { type: 'inactivity_reminder' }
    );
    
    await asyncStorageService.setItem(STORAGE_KEYS.LAST_INACTIVITY_REMINDER, Date.now());
  }, [scheduleNotification]);

  const scheduleBookmarkMilestone = useCallback(async (count: number) => {
    await scheduleNotification(
      '🎉 Bookmark Milestone!',
      `You've bookmarked ${count} courses! Keep exploring and learning.`,
      { type: 'bookmark_milestone', count }
    );
  }, [scheduleNotification]);

  const cancelNotification = useCallback(async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }, []);

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const { data } = response.notification.request.content;
    
    // Handle navigation based on notification type
    if (data?.type === 'inactivity_reminder') {
      // Navigate to home screen (default)
    } else if (data?.type === 'bookmark_milestone') {
      // Navigate to bookmarks tab
    }
  }, []);

  return {
    ...state,
    scheduleNotification,
    scheduleInactivityReminder,
    scheduleBookmarkMilestone,
    cancelNotification,
    cancelAllNotifications,
  };
}
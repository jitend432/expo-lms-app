import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/constants/theme';
import { useBookmarks } from '@/hooks/useBookmarks';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
  badgeCount?: number;
}) {
  return (
    <View>
      <Ionicons size={props.size || 24} style={{ marginBottom: -3 }} {...props} />
      {props.badgeCount && props.badgeCount > 0 ? (
        <View className="absolute -top-1 -right-2 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
          <Text className="text-white text-[10px] font-bold">
            {props.badgeCount > 9 ? '9+' : props.badgeCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { bookmarks } = useBookmarks();
  const bookmarkCount = bookmarks.length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: isDark ? colors.gray[400] : colors.gray[500],
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 0,
          height: 85,
          paddingTop: 10,
          paddingBottom: 30,
          backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={80}
            className="absolute inset-0"
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? 'library' : 'library-outline'} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'bookmark' : 'bookmark-outline'}
              color={color}
              badgeCount={bookmarkCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'person-circle' : 'person-circle-outline'}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  LinearTransition,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LegendList } from '@legendapp/list';

import { CourseCard } from '@/components/course/CourseCard';
import { SearchBar } from '@/components/course/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useDebounce } from '@/hooks/useDebounce';
import { colors } from '@/constants/theme';

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarks, removeBookmark, clearAllBookmarks } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredBookmarks = useMemo(() => {
    if (!debouncedSearch) return bookmarks;
    
    return bookmarks.filter(
      (course) =>
        course.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [bookmarks, debouncedSearch]);

  const handleCoursePress = useCallback(
    (courseId: string) => {
      if (isEditMode) {
        toggleSelection(courseId);
      } else {
        router.push(`/course/${courseId}`);
      }
    },
    [router, isEditMode]
  );

  const toggleSelection = useCallback((courseId: string) => {
    setSelectedBookmarks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(filteredBookmarks.map((c) => c.id)));
    }
  }, [filteredBookmarks, selectedBookmarks.size]);

  const handleDeleteSelected = useCallback(() => {
    Alert.alert(
      'Remove Bookmarks',
      `Are you sure you want to remove ${selectedBookmarks.size} bookmark${selectedBookmarks.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            selectedBookmarks.forEach((id) => removeBookmark(id));
            setSelectedBookmarks(new Set());
            setIsEditMode(false);
          },
        },
      ]
    );
  }, [selectedBookmarks, removeBookmark]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Bookmarks',
      'Are you sure you want to remove all bookmarks? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllBookmarks();
            setIsEditMode(false);
            setSelectedBookmarks(new Set());
          },
        },
      ]
    );
  }, [clearAllBookmarks]);

  const handleShare = useCallback(async () => {
    try {
      const selectedCourses = filteredBookmarks.filter((c) => selectedBookmarks.has(c.id));
      const message = selectedCourses
        .map((c) => `📚 ${c.title} by ${c.instructor.name}`)
        .join('\n');
      
      await Share.share({
        message: `My bookmarked courses:\n\n${message}`,
        title: 'My Bookmarked Courses',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [filteredBookmarks, selectedBookmarks]);

  const renderHeader = useCallback(() => (
    <View className="px-4 pb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            My Bookmarks
          </Text>
          {bookmarks.length > 0 && (
            <View className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900 rounded-full">
              <Text className="text-xs font-semibold text-primary-600 dark:text-primary-300">
                {bookmarks.length}
              </Text>
            </View>
          )}
        </View>
        
        {bookmarks.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setIsEditMode(!isEditMode);
              setSelectedBookmarks(new Set());
            }}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isEditMode ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {bookmarks.length > 0 && (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search your bookmarks..."
        />
      )}

      {isEditMode && filteredBookmarks.length > 0 && (
        <Animated.View 
          entering={FadeIn}
          exiting={FadeOut}
          className="flex-row items-center justify-between mt-3"
        >
          <TouchableOpacity onPress={handleSelectAll}>
            <Text className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {selectedBookmarks.size === filteredBookmarks.length
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
          
          <View className="flex-row space-x-3">
            {selectedBookmarks.size > 0 && (
              <>
                <TouchableOpacity onPress={handleShare}>
                  <Ionicons name="share-outline" size={22} color={colors.primary[500]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteSelected}>
                  <Ionicons name="trash-outline" size={22} color={colors.red[500]} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  ), [bookmarks.length, searchQuery, isEditMode, filteredBookmarks.length, selectedBookmarks.size, handleSelectAll, handleShare, handleDeleteSelected]);

  const renderEmpty = useCallback(() => (
    <EmptyState
      icon="bookmark-outline"
      title="No bookmarks yet"
      description="Save courses you're interested in and find them here later"
      actionLabel="Browse Courses"
      onAction={() => router.push('/(tabs)')}
    />
  ), [router]);

  const renderFooter = useCallback(() => {
    if (bookmarks.length === 0 || isEditMode) return null;
    
    return (
      <View className="px-4 py-6">
        <TouchableOpacity
          onPress={handleClearAll}
          className="items-center"
        >
          <Text className="text-sm text-red-500 font-medium">Clear All Bookmarks</Text>
        </TouchableOpacity>
      </View>
    );
  }, [bookmarks.length, isEditMode, handleClearAll]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <LegendList
        data={filteredBookmarks}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleCoursePress(item.id)}
            onLongPress={() => {
              if (!isEditMode) {
                setIsEditMode(true);
                toggleSelection(item.id);
              }
            }}
            activeOpacity={0.7}
            className="relative"
          >
            {isEditMode && (
              <View className="absolute left-4 top-4 z-10">
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    selectedBookmarks.has(item.id)
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selectedBookmarks.has(item.id) && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
              </View>
            )}
            <CourseCard
              course={item}
              onPress={() => handleCoursePress(item.id)}
              variant={isEditMode ? 'compact' : 'default'}
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          paddingBottom: 100,
          flexGrow: filteredBookmarks.length === 0 ? 1 : undefined,
        }}
        estimatedItemSize={180}
        itemLayoutAnimation={LinearTransition.springify().damping(15)}
        recycleItems
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
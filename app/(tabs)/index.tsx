import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LegendList } from '@legendapp/list';

import { CourseCard } from '@/components/course/CourseCard';
import { CourseSkeleton } from '@/components/course/CourseSkeleton';
import { SearchBar } from '@/components/course/SearchBar';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useCourses } from '@/hooks/useCourses';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDebounce } from '@/hooks/useDebounce';
import { colors } from '@/constants/theme';
import type { Course } from '@/types/models/Course';

const AnimatedLegendList = Animated.createAnimatedComponent(LegendList);

export default function CourseCatalogScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isConnected } = useNetworkStatus();
  const listRef = useRef<FlatList>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const {
    courses,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useCourses({
    search: debouncedSearch,
    category: selectedCategory === 'All' ? undefined : selectedCategory,
  });

  const scrollY = useSharedValue(0);
  const headerVisible = useSharedValue(true);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const scrolling = event.contentOffset.y;
      scrollY.value = scrolling;
      
      if (scrolling > 100 && headerVisible.value) {
        headerVisible.value = false;
      } else if (scrolling < 50 && !headerVisible.value) {
        headerVisible.value = true;
      }
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(headerVisible.value ? 0 : -100, {
          duration: 300,
        }),
      },
    ],
    opacity: interpolate(
      headerVisible.value ? 1 : 0,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const categories = useMemo(() => {
    const cats = new Set(courses.map((c) => c.category));
    return ['All', ...Array.from(cats)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!debouncedSearch) return courses;
    
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [courses, debouncedSearch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCoursePress = useCallback(
    (courseId: string) => {
      router.push(`/course/${courseId}`);
    },
    [router]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderHeader = useCallback(() => (
    <Animated.View style={headerStyle} className="px-4 pb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Discover Courses
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filteredCourses.length} courses available
          </Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Ionicons name="filter-outline" size={20} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search courses, topics, or instructors..."
      />

      {/* Categories */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3 -mx-4 px-4"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            className={`mr-2 px-4 py-2 rounded-full ${
              selectedCategory === category
                ? 'bg-primary-500'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            <Text
              className={`font-medium ${
                selectedCategory === category
                  ? 'text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>
    </Animated.View>
  ), [headerStyle, searchQuery, categories, selectedCategory, filteredCourses.length]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View className="px-4">
          {[...Array(5)].map((_, i) => (
            <CourseSkeleton key={i} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center p-8">
          <ErrorMessage
            message="Failed to load courses"
            onRetry={refetch}
          />
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="search-outline" size={64} color={colors.gray[300]} />
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
          No courses found
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
          {searchQuery
            ? `No results for "${searchQuery}"`
            : 'Check back later for new courses'}
        </Text>
        {searchQuery && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            className="mt-4 px-6 py-2 bg-primary-500 rounded-lg"
          >
            <Text className="text-white font-medium">Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, error, searchQuery, refetch]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  }, [isFetchingNextPage]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <OfflineBanner visible={!isConnected} />
      
      <AnimatedLegendList
        ref={listRef}
        data={filteredCourses}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => handleCoursePress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
        contentContainerStyle={{
          paddingBottom: 100,
          flexGrow: filteredCourses.length === 0 ? 1 : undefined,
        }}
        estimatedItemSize={180}
        recycleItems
        maintainVisibleContentPosition
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
import { useState, useCallback, useEffect, useRef } from 'react';
import { coursesService } from '@/services/api/courses.service';
import { asyncStorageService } from '@/services/storage/async-storage.service';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { transformRandomProductToCourse, transformRandomUserToInstructor } from '@/utils/transformers';
import type { Course } from '@/types/models/Course';
import type { Instructor } from '@/types/models/Instructor';

interface UseCoursesOptions {
  search?: string;
  category?: string;
  limit?: number;
  page?: number;
}

interface UseCoursesResult {
  courses: Course[];
  enrolledCourses: Course[];
  isLoading: boolean;
  error: string | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<boolean>;
  getCourseById: (courseId: string) => Course | undefined;
  updateCourseProgress: (courseId: string, progress: number) => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCourses(options: UseCoursesOptions = {}): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page || 1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { data: Course[]; timestamp: number }>>(new Map());

  const generateCacheKey = useCallback(() => {
    return JSON.stringify({
      search: options.search || '',
      category: options.category || '',
      limit: options.limit || 20,
    });
  }, [options.search, options.category, options.limit]);

  const fetchCourses = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const cacheKey = generateCacheKey();
      const cached = cacheRef.current.get(cacheKey);
      const now = Date.now();

      // Check cache for first page only
      if (pageNum === 1 && cached && now - cached.timestamp < CACHE_DURATION) {
        setCourses(cached.data);
        setIsLoading(false);
        return;
      }

      if (pageNum === 1 && isRefresh) {
        setIsLoading(true);
      } else if (pageNum > 1) {
        setIsFetchingNextPage(true);
      }

      setError(null);

      // Fetch courses (products)
      const productsResponse = await coursesService.getCourses({
        page: pageNum,
        limit: options.limit || 20,
        search: options.search,
        category: options.category,
      });

      // Fetch instructors (users)
      const instructorsResponse = await coursesService.getInstructors({
        limit: productsResponse.data.length,
      });

      // Transform data
      const instructors = instructorsResponse.data.map(transformRandomUserToInstructor);
      const transformedCourses = productsResponse.data.map((product, index) =>
        transformRandomProductToCourse(product, instructors[index % instructors.length])
      );

      let updatedCourses: Course[];
      if (pageNum === 1) {
        updatedCourses = transformedCourses;
        // Cache first page results
        cacheRef.current.set(cacheKey, {
          data: transformedCourses,
          timestamp: now,
        });
      } else {
        updatedCourses = [...courses, ...transformedCourses];
      }

      setCourses(updatedCourses);
      setHasNextPage(productsResponse.hasNextPage || false);
      setPage(pageNum);

      // Cache courses in AsyncStorage for offline access
      if (pageNum === 1) {
        await asyncStorageService.setItem(
          STORAGE_KEYS.CACHED_COURSES,
          {
            data: updatedCourses,
            timestamp: now,
          },
          { expiresIn: CACHE_DURATION }
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch courses');
        
        // Try to load from AsyncStorage if offline
        if (pageNum === 1) {
          const cachedData = await asyncStorageService.getItem<{
            data: Course[];
            timestamp: number;
          }>(STORAGE_KEYS.CACHED_COURSES);
          
          if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION * 2) {
            setCourses(cachedData.data);
          }
        }
      }
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  }, [options.limit, options.search, options.category, courses, generateCacheKey]);

  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const enrolledIds = await asyncStorageService.getItem<string[]>(
        STORAGE_KEYS.ENROLLED_COURSES
      ) || [];
      
      const enrolled = courses.filter((course) => enrolledIds.includes(course.id));
      
      // Load progress from storage
      const progressData = await asyncStorageService.getItem<Record<string, number>>(
        STORAGE_KEYS.COURSE_PROGRESS
      ) || {};
      
      const coursesWithProgress = enrolled.map((course) => ({
        ...course,
        progress: progressData[course.id] || 0,
        isEnrolled: true,
      }));
      
      setEnrolledCourses(coursesWithProgress);
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
    }
  }, [courses]);

  const fetchNextPage = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchCourses(page + 1);
    }
  }, [hasNextPage, isFetchingNextPage, page, fetchCourses]);

  const refetch = useCallback(async () => {
    setPage(1);
    await fetchCourses(1, true);
  }, [fetchCourses]);

  const enrollInCourse = useCallback(async (courseId: string) => {
    try {
      const enrolledIds = await asyncStorageService.getItem<string[]>(
        STORAGE_KEYS.ENROLLED_COURSES
      ) || [];
      
      if (!enrolledIds.includes(courseId)) {
        enrolledIds.push(courseId);
        await asyncStorageService.setItem(STORAGE_KEYS.ENROLLED_COURSES, enrolledIds);
        
        // Update local state
        setCourses((prev) =>
          prev.map((course) =>
            course.id === courseId ? { ...course, isEnrolled: true } : course
          )
        );
        
        await fetchEnrolledCourses();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to enroll in course:', error);
      return false;
    }
  }, [fetchEnrolledCourses]);

  const getCourseById = useCallback(
    (courseId: string) => {
      return courses.find((course) => course.id === courseId);
    },
    [courses]
  );

  const updateCourseProgress = useCallback(async (courseId: string, progress: number) => {
    try {
      const progressData = await asyncStorageService.getItem<Record<string, number>>(
        STORAGE_KEYS.COURSE_PROGRESS
      ) || {};
      
      progressData[courseId] = Math.min(100, Math.max(0, progress));
      await asyncStorageService.setItem(STORAGE_KEYS.COURSE_PROGRESS, progressData);
      
      setEnrolledCourses((prev) =>
        prev.map((course) =>
          course.id === courseId ? { ...course, progress: progressData[courseId] } : course
        )
      );
    } catch (error) {
      console.error('Failed to update course progress:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCourses(1);
  }, [options.search, options.category]);

  // Fetch enrolled courses when courses change
  useEffect(() => {
    if (courses.length > 0) {
      fetchEnrolledCourses();
    }
  }, [courses, fetchEnrolledCourses]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    courses,
    enrolledCourses,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    enrollInCourse,
    getCourseById,
    updateCourseProgress,
  };
}
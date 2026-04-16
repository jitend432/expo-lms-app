import { useState, useCallback, useEffect } from 'react';
import { asyncStorageService } from '@/services/storage/async-storage.service';
import { notificationService } from '@/services/notifications/notification.service';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { Course } from '@/types/models/Course';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bookmarks from storage
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedBookmarks = await asyncStorageService.getItem<Course[]>(
        STORAGE_KEYS.BOOKMARKS
      ) || [];
      
      setBookmarks(storedBookmarks);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBookmarks = useCallback(async (newBookmarks: Course[]) => {
    try {
      await asyncStorageService.setItem(STORAGE_KEYS.BOOKMARKS, newBookmarks);
      setBookmarks(newBookmarks);
      
      // Check if we should show notification (5+ bookmarks)
      if (newBookmarks.length === 5) {
        await notificationService.showBookmarkMilestone(5);
      } else if (newBookmarks.length === 10) {
        await notificationService.showBookmarkMilestone(10);
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to save bookmarks');
      return false;
    }
  }, []);

  const addBookmark = useCallback(async (course: Course) => {
    try {
      const exists = bookmarks.some((b) => b.id === course.id);
      
      if (!exists) {
        const newBookmarks = [...bookmarks, { ...course, isBookmarked: true }];
        await saveBookmarks(newBookmarks);
        return true;
      }
      
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to add bookmark');
      return false;
    }
  }, [bookmarks, saveBookmarks]);

  const removeBookmark = useCallback(async (courseId: string) => {
    try {
      const newBookmarks = bookmarks.filter((b) => b.id !== courseId);
      await saveBookmarks(newBookmarks);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to remove bookmark');
      return false;
    }
  }, [bookmarks, saveBookmarks]);

  const toggleBookmark = useCallback(async (course: Course) => {
    const isBookmarked = bookmarks.some((b) => b.id === course.id);
    
    if (isBookmarked) {
      return removeBookmark(course.id);
    } else {
      return addBookmark(course);
    }
  }, [bookmarks, addBookmark, removeBookmark]);

  const isBookmarked = useCallback((courseId: string) => {
    return bookmarks.some((b) => b.id === courseId);
  }, [bookmarks]);

  const clearAllBookmarks = useCallback(async () => {
    try {
      await asyncStorageService.removeItem(STORAGE_KEYS.BOOKMARKS);
      setBookmarks([]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to clear bookmarks');
      return false;
    }
  }, []);

  const getBookmarkCount = useCallback(() => {
    return bookmarks.length;
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    error,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearAllBookmarks,
    getBookmarkCount,
    refresh: loadBookmarks,
  };
}
import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { authService } from '@/services/api/auth.service';
import { secureStorageService } from '@/services/storage/secure-storage.service';
import { STORAGE_KEYS } from '@/constants/storage-keys';

interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
  isRefreshing: boolean;
  expiresAt: number | null;
}

const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minute buffer

export function useRefreshToken() {
  const [state, setState] = useState<TokenState>({
    accessToken: null,
    refreshToken: null,
    isRefreshing: false,
    expiresAt: null,
  });

  const refreshPromiseRef = useRef<Promise<string> | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize tokens
  useEffect(() => {
    loadTokens();
  }, []);

  // Setup automatic refresh
  useEffect(() => {
    setupAutoRefresh();

    // Refresh when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndRefreshToken();
      }
    });

    return () => {
      subscription.remove();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [state.expiresAt]);

  const loadTokens = useCallback(async () => {
    try {
      const [accessToken, refreshToken, expiresAt] = await Promise.all([
        secureStorageService.getToken(),
        secureStorageService.getRefreshToken(),
        secureStorageService.getItem<number>(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);

      setState({
        accessToken,
        refreshToken,
        isRefreshing: false,
        expiresAt: expiresAt || null,
      });
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }, []);

  const saveTokens = useCallback(async (
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ) => {
    try {
      const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;
      
      await secureStorageService.setToken(accessToken);
      if (refreshToken) {
        await secureStorageService.setRefreshToken(refreshToken);
      }
      if (expiresAt) {
        await secureStorageService.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiresAt);
      }

      setState({
        accessToken,
        refreshToken: refreshToken || state.refreshToken,
        isRefreshing: false,
        expiresAt,
      });
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw error;
    }
  }, [state.refreshToken]);

  const refreshAccessToken = useCallback(async (): Promise<string> => {
    // If already refreshing, return the existing promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    if (!state.refreshToken) {
      throw new Error('No refresh token available');
    }

    setState((prev) => ({ ...prev, isRefreshing: true }));

    const refreshPromise = (async () => {
      try {
        const response = await authService.refreshToken(state.refreshToken!);
        
        await saveTokens(
          response.accessToken,
          response.refreshToken,
          response.expiresIn
        );

        return response.accessToken;
      } catch (error) {
        // Refresh failed, clear tokens and require re-login
        await secureStorageService.clearTokens();
        setState({
          accessToken: null,
          refreshToken: null,
          isRefreshing: false,
          expiresAt: null,
        });
        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [state.refreshToken, saveTokens]);

  const checkAndRefreshToken = useCallback(async (): Promise<string | null> => {
    if (!state.accessToken || !state.expiresAt) {
      return null;
    }

    const timeUntilExpiry = state.expiresAt - Date.now();
    
    // Token is still valid
    if
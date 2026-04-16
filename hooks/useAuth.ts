import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/services/api/auth.service';
import { secureStorageService } from '@/services/storage/secure-storage.service';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { User, LoginCredentials, RegisterData } from '@/types/models/User';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      const token = await secureStorageService.getToken();
      
      if (!token) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Verify token and get user data
      const user = await authService.getCurrentUser();
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Token might be invalid or expired
      await secureStorageService.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.login(credentials);
      
      // Store tokens securely
      await secureStorageService.setToken(response.accessToken);
      if (response.refreshToken) {
        await secureStorageService.setRefreshToken(response.refreshToken);
      }
      
      // Store user data
      await secureStorageService.setUser(response.user);
      
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      return false;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.register(data);
      
      // Store tokens securely
      await secureStorageService.setToken(response.accessToken);
      if (response.refreshToken) {
        await secureStorageService.setRefreshToken(response.refreshToken);
      }
      
      // Store user data
      await secureStorageService.setUser(response.user);
      
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      await secureStorageService.clearTokens();
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Even if logout API fails, clear local storage
      await secureStorageService.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      const updatedUser = await authService.updateProfile(updates);
      await secureStorageService.setUser(updatedUser);
      
      setState((prev) => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
        error: null,
      }));
      
      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to update profile',
      }));
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
    clearError,
  };
}
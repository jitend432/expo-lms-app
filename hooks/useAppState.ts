import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AppStateInfo {
  appState: AppStateStatus;
  previousAppState: AppStateStatus | null;
  isActive: boolean;
  isBackground: boolean;
  isInactive: boolean;
}

export function useAppState(): AppStateInfo {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const previousAppState = useRef<AppStateStatus | null>(null);
  const appStateListener = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      previousAppState.current = appState;
      setAppState(nextAppState);
    };

    appStateListener.current = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (appStateListener.current) {
        appStateListener.current.remove();
      }
    };
  }, [appState]);

  return {
    appState,
    previousAppState: previousAppState.current,
    isActive: appState === 'active',
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
}

// Hook to execute callbacks on app state changes
export function useAppStateEffect(
  onActive?: () => void | Promise<void>,
  onBackground?: () => void | Promise<void>,
  onInactive?: () => void | Promise<void>
) {
  const { appState, previousAppState } = useAppState();

  useEffect(() => {
    const executeCallback = async () => {
      if (appState === 'active' && previousAppState !== 'active') {
        await onActive?.();
      } else if (appState === 'background' && previousAppState === 'active') {
        await onBackground?.();
      } else if (appState === 'inactive' && previousAppState === 'active') {
        await onInactive?.();
      }
    };

    executeCallback();
  }, [appState, previousAppState, onActive, onBackground, onInactive]);
}
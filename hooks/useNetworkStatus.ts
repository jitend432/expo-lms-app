import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  isSlowConnection: boolean;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
    isSlowConnection: false,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isSlowConnection = 
        state.type === 'cellular' && 
        state.details?.cellularGeneration && 
        ['2g', '3g'].includes(state.details.cellularGeneration);

      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isSlowConnection: isSlowConnection ?? false,
      });
    });

    // Initial fetch
    NetInfo.fetch().then((state: NetInfoState) => {
      const isSlowConnection = 
        state.type === 'cellular' && 
        state.details?.cellularGeneration && 
        ['2g', '3g'].includes(state.details.cellularGeneration);

      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isSlowConnection: isSlowConnection ?? false,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
    };
  }, []);

  return {
    ...status,
    checkConnection,
  };
}
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as LocalAuthentication from 'expo-local-authentication';

export type PermissionType =
  | 'notifications'
  | 'camera'
  | 'photoLibrary'
  | 'location'
  | 'biometric'
  | 'mediaLibrary';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  expires?: 'never' | number;
}

// Check if permission is granted
export const checkPermission = async (
  type: PermissionType
): Promise<PermissionStatus> => {
  try {
    switch (type) {
      case 'notifications': {
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain: canAskAgain ?? true,
        };
      }
      
      case 'camera': {
        const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain: canAskAgain ?? true,
        };
      }
      
      case 'photoLibrary':
      case 'mediaLibrary': {
        const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain: canAskAgain ?? true,
        };
      }
      
      case 'location': {
        const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain: canAskAgain ?? true,
        };
      }
      
      case 'biometric': {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return {
          granted: hasHardware && isEnrolled,
          canAskAgain: true,
        };
      }
      
      default:
        return { granted: false, canAskAgain: true };
    }
  } catch (error) {
    console.error(`Failed to check ${type} permission:`, error);
    return { granted: false, canAskAgain: true };
  }
};

// Request permission
export const requestPermission = async (
  type: PermissionType,
  options?: {
    title?: string;
    message?: string;
    onDenied?: () => void;
    onBlocked?: () => void;
  }
): Promise<boolean> => {
  try {
    const currentStatus = await checkPermission(type);
    
    // Already granted
    if (currentStatus.granted) {
      return true;
    }
    
    // Cannot ask again
    if (!currentStatus.canAskAgain) {
      showPermissionBlockedAlert(type, options);
      return false;
    }
    
    // Request permission
    let result;
    
    switch (type) {
      case 'notifications':
        result = await Notifications.requestPermissionsAsync();
        break;
        
      case 'camera':
        result = await Camera.requestCameraPermissionsAsync();
        break;
        
      case 'photoLibrary':
      case 'mediaLibrary':
        result = await MediaLibrary.requestPermissionsAsync();
        break;
        
      case 'location':
        result = await Location.requestForegroundPermissionsAsync();
        break;
        
      case 'biometric':
        result = await LocalAuthentication.authenticateAsync({
          promptMessage: options?.message || 'Authenticate to continue',
        });
        return result.success;
        
      default:
        return false;
    }
    
    const granted = result?.status === 'granted';
    
    if (!granted) {
      if (!result?.canAskAgain) {
        showPermissionBlockedAlert(type, options);
      } else {
        options?.onDenied?.();
      }
    }
    
    return granted;
  } catch (error) {
    console.error(`Failed to request ${type} permission:`, error);
    return false;
  }
};

// Show alert when permission is blocked
const showPermissionBlockedAlert = (
  type: PermissionType,
  options?: {
    title?: string;
    message?: string;
    onBlocked?: () => void;
  }
): void => {
  const permissionName = getPermissionName(type);
  
  Alert.alert(
    options?.title || `${permissionName} Permission Required`,
    options?.message ||
      `Please enable ${permissionName.toLowerCase()} access in your device settings to use this feature.`,
    [
      { text: 'Cancel', style: 'cancel', onPress: options?.onBlocked },
      {
        text: 'Open Settings',
        onPress: () => {
          Linking.openSettings();
        },
      },
    ]
  );
};

// Get human-readable permission name
const getPermissionName = (type: PermissionType): string => {
  switch (type) {
    case 'notifications':
      return 'Notification';
    case 'camera':
      return 'Camera';
    case 'photoLibrary':
      return 'Photo Library';
    case 'location':
      return 'Location';
    case 'biometric':
      return 'Biometric';
    case 'mediaLibrary':
      return 'Media Library';
    default:
      return 'Permission';
  }
};

// Check multiple permissions
export const checkMultiplePermissions = async (
  types: PermissionType[]
): Promise<Record<PermissionType, PermissionStatus>> => {
  const results: Partial<Record<PermissionType, PermissionStatus>> = {};
  
  for (const type of types) {
    results[type] = await checkPermission(type);
  }
  
  return results as Record<PermissionType, PermissionStatus>;
};

// Request multiple permissions
export const requestMultiplePermissions = async (
  types: PermissionType[]
): Promise<Record<PermissionType, boolean>> => {
  const results: Partial<Record<PermissionType, boolean>> = {};
  
  for (const type of types) {
    results[type] = await requestPermission(type);
  }
  
  return results as Record<PermissionType, boolean>;
};

// Permission hook helper
export const usePermission = (type: PermissionType) => {
  const [status, setStatus] = React.useState<PermissionStatus | null>(null);
  
  React.useEffect(() => {
    checkPermission(type).then(setStatus);
  }, [type]);
  
  const request = React.useCallback(
    (options?: Parameters<typeof requestPermission>[1]) => {
      return requestPermission(type, options).then((granted) => {
        checkPermission(type).then(setStatus);
        return granted;
      });
    },
    [type]
  );
  
  return {
    status,
    request,
    isGranted: status?.granted ?? false,
    canAskAgain: status?.canAskAgain ?? true,
  };
};
import { Platform } from 'react-native';

/** True when running inside a web browser (Expo Web / react-native-web). */
export const isWeb: boolean = Platform.OS === 'web';

/** True when running on a native device (iOS or Android). */
export const isNative: boolean = !isWeb;

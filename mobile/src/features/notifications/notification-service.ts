import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '../../../lib/supabase';

/**
 * Configure how notifications are displayed when the app is in the foreground.
 * Call once at app startup.
 */
export function configureForegroundHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Create a default Android notification channel. No-op on iOS.
 */
export async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }
}

/**
 * Request notification permissions. Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Get the Expo push token for this device.
 * Returns null on simulators or if the token cannot be obtained.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.log('Push tokens are not available on simulators/emulators.');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    if (__DEV__) console.warn('Missing EAS projectId — cannot register for push notifications.');
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

/**
 * Upsert the push token in Supabase. If the same token already exists
 * (e.g. same device, different user), it updates the row.
 */
export async function registerPushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        device_name: Device.deviceName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );

  if (error && __DEV__) {
    console.warn('Failed to register push token:', error.message);
  }
}

/**
 * Remove a push token from Supabase. Called on sign-out.
 */
export async function unregisterPushToken(token: string) {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('token', token);

  if (error && __DEV__) {
    console.warn('Failed to unregister push token:', error.message);
  }
}

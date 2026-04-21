import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import { useAuth } from '@/features/auth/auth-provider';
import {
  configureForegroundHandler,
  getExpoPushToken,
  registerPushToken,
  requestPermissions,
  setupAndroidChannel,
} from './notification-service';

export function useNotifications() {
  const { session } = useAuth();
  const tokenRef = useRef<string | null>(null);

  // Configure foreground display once on mount.
  useEffect(() => {
    configureForegroundHandler();
    setupAndroidChannel();
  }, []);

  // Register token when user signs in, re-run if user changes.
  useEffect(() => {
    if (!session?.user.id) {
      tokenRef.current = null;
      return;
    }

    let cancelled = false;

    async function register() {
      const granted = await requestPermissions();
      if (!granted || cancelled) return;

      const token = await getExpoPushToken();
      if (!token || cancelled) return;

      tokenRef.current = token;
      await registerPushToken(session!.user.id, token);
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  // Notification listeners.
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      if (__DEV__) console.log('Notification received:', notification.request.content);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      // TODO: Add deep-link navigation based on response.notification.request.content.data
      if (__DEV__) console.log('Notification tapped:', response.notification.request.content);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return { expoPushToken: tokenRef.current };
}

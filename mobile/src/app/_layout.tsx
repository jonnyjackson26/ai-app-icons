import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import * as Sentry from '@sentry/react-native';
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/features/auth/auth-provider';
import { NotificationHandler } from '@/features/notifications';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function PostHogScreenTracker() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const screenProperties = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as Record<string, string | string[]>;

    posthog.screen(pathname, screenProperties);
  }, [pathname, params, posthog]);

  return null;
}

function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? ''}
      autocapture={{
        // Expo Router uses React Navigation v7; keep touch autocapture,
        // but disable automatic screen capture and track screens manually.
        captureTouches: true,
        captureScreens: false,
      }}
      options={{
        host: 'https://us.i.posthog.com',
      }}
    >
      <PostHogScreenTracker />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <NotificationHandler />
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}

export default Sentry.wrap(RootLayout);

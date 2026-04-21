import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/features/auth/auth-provider';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const { session, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <AppTabs />;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

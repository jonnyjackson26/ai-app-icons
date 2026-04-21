import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthBackButtonProps = PressableProps & {
  label?: string;
};

export function AuthBackButton({ label = 'Back', style, ...rest }: AuthBackButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          opacity: pressed ? 0.75 : 1,
          borderColor: theme.backgroundSelected,
          backgroundColor: theme.backgroundElement,
        },
        style,
      ]}
      {...rest}>
      <SymbolView name="chevron.left" tintColor={theme.textSecondary} size={18} />
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  label: {
    lineHeight: 16,
  },
});

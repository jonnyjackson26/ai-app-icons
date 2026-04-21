import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthMethodButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AuthMethodButton({
  label,
  icon,
  loading = false,
  selected = false,
  disabled,
  style,
  ...rest
}: AuthMethodButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: pressed || isDisabled ? 0.78 : 1,
          borderColor: selected ? theme.textSecondary : theme.backgroundSelected,
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={theme.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <ThemedText type="smallBold">{label}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});

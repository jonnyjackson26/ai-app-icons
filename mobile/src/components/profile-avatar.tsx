import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

type ProfileAvatarProps = {
  avatarUrl: string | null;
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
};

export function ProfileAvatar({
  avatarUrl,
  disabled = false,
  isLoading = false,
  onPress,
  backgroundColor,
  iconColor,
}: ProfileAvatarProps) {
  return (
    <Pressable
      accessibilityLabel="Edit profile photo"
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.avatar,
        {
          backgroundColor,
          opacity: pressed || disabled ? 0.85 : 1,
        },
      ]}>
      {avatarUrl ? (
        <Image contentFit="cover" source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <SymbolView
          tintColor={iconColor}
          name={{ ios: 'person.fill', web: 'person' }}
          size={24}
          type="hierarchical"
        />
      )}
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={iconColor} size="small" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    height: 56,
    width: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});

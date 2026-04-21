import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View, type AlertButton } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile-avatar';
import { ProfilePhotoViewer } from '@/components/profile-photo-viewer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { useTheme } from '@/hooks/use-theme';

const danger = '#D13F4A';

export default function ProfileScreen() {
  const { session, signOut, deleteAccount, uploadAvatar, removeAvatar, getAvatarPath, getAvatarUrl } = useAuth();
  const theme = useTheme();
  const [isWorking, setIsWorking] = useState(false);
  const [isAvatarWorking, setIsAvatarWorking] = useState(false);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());
  const [isPhotoViewerVisible, setIsPhotoViewerVisible] = useState(false);

  const identityCandidates = [
    session?.user.email,
    session?.user.phone,
    session?.user.user_metadata?.phone,
    session?.user.id,
  ];
  const identityLabel =
    identityCandidates
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find((value) => value.length > 0) ?? 'Unknown user';
  const avatarUrl = useMemo(() => {
    const baseUrl = getAvatarUrl(avatarPath);
    if (!baseUrl) {
      return null;
    }
    return `${baseUrl}?v=${avatarVersion}`;
  }, [avatarPath, avatarVersion, getAvatarUrl]);

  useEffect(() => {
    let isMounted = true;

    const userId = session?.user.id;
    if (!userId) {
      setAvatarPath(null);
      return () => {
        isMounted = false;
      };
    }

    getAvatarPath(userId)
      .then(({ avatarPath: fetchedAvatarPath, errorMessage }) => {
        if (!isMounted) {
          return;
        }
        setAvatarPath(fetchedAvatarPath);
        if (errorMessage) {
          Alert.alert('Could not load photo', errorMessage);
        }
      })
      .catch(() => {
        if (isMounted) {
          Alert.alert('Could not load photo', 'Unable to load your profile photo right now.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [getAvatarPath, session?.user.id]);

  useEffect(() => {
    if (!avatarUrl && isPhotoViewerVisible) {
      setIsPhotoViewerVisible(false);
    }
  }, [avatarUrl, isPhotoViewerVisible]);

  async function handleSignOut() {
    if (isWorking) {
      return;
    }
    Alert.alert('Log out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setIsWorking(true);
          const { error } = await signOut();
          setIsWorking(false);

          if (error) {
            Alert.alert('Could not log out', error.message);
          }
        },
      },
    ]);
  }

  async function runDeleteAccount() {
    setIsWorking(true);
    const { errorMessage } = await deleteAccount();
    setIsWorking(false);

    if (errorMessage) {
      Alert.alert('Could not delete account', errorMessage);
      return;
    }

    Alert.alert('Account deleted', 'Your account was deleted successfully.');
  }

  function handleDeleteAccount() {
    if (isWorking) {
      return;
    }
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            runDeleteAccount().catch((error: unknown) => {
              const fallback = error instanceof Error ? error.message : 'Unexpected error';
              Alert.alert('Could not delete account', fallback);
            });
          },
        },
      ]
    );
  }

  async function pickAvatarImage() {
    if (isWorking || !session) {
      return;
    }

    if (Platform.OS !== 'web') {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Photos permission needed',
          'Allow photo library access so you can choose a profile image.'
        );
        return;
      }
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });

    if (pickerResult.canceled || !pickerResult.assets[0]?.uri) {
      return;
    }

    setIsWorking(true);
    setIsAvatarWorking(true);

    let nextAvatarPath: string | null = null;
    let errorMessage: string | null = null;
    try {
      const result = await uploadAvatar({
        userId: session.user.id,
        imageBase64: pickerResult.assets[0].base64,
        imageUri: pickerResult.assets[0].uri,
        mimeType: pickerResult.assets[0].mimeType,
      });
      nextAvatarPath = result.avatarPath;
      errorMessage = result.errorMessage;
    } finally {
      setIsAvatarWorking(false);
      setIsWorking(false);
    }

    if (errorMessage) {
      Alert.alert('Could not update photo', errorMessage);
      return;
    }

    setAvatarPath(nextAvatarPath);
    setAvatarVersion(Date.now());
  }

  async function handleRemoveAvatar() {
    if (isWorking || !session) {
      return;
    }

    setIsWorking(true);
    setIsAvatarWorking(true);

    let errorMessage: string | null = null;
    try {
      const result = await removeAvatar({ userId: session.user.id });
      errorMessage = result.errorMessage;
    } finally {
      setIsAvatarWorking(false);
      setIsWorking(false);
    }

    if (errorMessage) {
      Alert.alert('Could not remove photo', errorMessage);
      return;
    }

    setAvatarPath(null);
    setAvatarVersion(Date.now());
  }

  function confirmRemoveAvatar() {
    Alert.alert('Remove photo?', 'Your avatar will be removed from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          handleRemoveAvatar().catch((error: unknown) => {
            const fallback = error instanceof Error ? error.message : 'Unexpected error';
            Alert.alert('Could not remove photo', fallback);
          });
        },
      },
    ]);
  }

  function openPhotoViewer() {
    if (!avatarUrl) {
      return;
    }
    setIsPhotoViewerVisible(true);
  }

  function handleAvatarPress() {
    if (isWorking) {
      return;
    }

    const actionButtons: AlertButton[] = [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: avatarPath ? 'Edit photo' : 'Add photo',
        onPress: () => {
          pickAvatarImage().catch((error: unknown) => {
            const fallback = error instanceof Error ? error.message : 'Unexpected error';
            Alert.alert('Could not choose photo', fallback);
          });
        },
      },
    ];

    if (avatarPath) {
      actionButtons.splice(
        1,
        0,
        {
          text: 'View photo',
          onPress: openPhotoViewer,
        },
        {
          text: 'Remove photo',
          style: 'destructive' as const,
          onPress: confirmRemoveAvatar,
        }
      );
    }

    Alert.alert('Profile photo', 'Choose what you want to do.', actionButtons);
  }

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingBottom: BottomTabInset + Spacing.four,
            },
          ]}
          style={styles.scrollView}>
          <View style={styles.content}>
            <ThemedView type="backgroundElement" style={styles.profileCard}>
              <ProfileAvatar
                avatarUrl={avatarUrl}
                disabled={isWorking}
                isLoading={isAvatarWorking}
                onPress={handleAvatarPress}
                backgroundColor={theme.backgroundSelected}
                iconColor={theme.textSecondary}
              />
              <View style={styles.profileTextWrap}>
                <ThemedText type="small" themeColor="textSecondary">
                  Signed in as
                </ThemedText>
                <ThemedText type="default">{identityLabel}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Tap photo to view, edit, or remove it.
                </ThemedText>
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.actionsCard}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Account actions
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Manage your current session and account lifecycle.
              </ThemedText>

              <Pressable
                accessibilityRole="button"
                disabled={isWorking}
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    opacity: pressed || isWorking ? 0.75 : 1,
                    backgroundColor: theme.backgroundSelected,
                    borderColor: theme.backgroundSelected,
                  },
                ]}>
                <ThemedText type="smallBold">Log out</ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={isWorking}
                onPress={handleDeleteAccount}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.deleteButton,
                  {
                    opacity: pressed || isWorking ? 0.8 : 1,
                  },
                ]}>
                <ThemedText type="smallBold" style={styles.deleteButtonText}>
                  Delete account
                </ThemedText>
              </Pressable>
            </ThemedView>
          </View>
        </ScrollView>
      </SafeAreaView>
      <ProfilePhotoViewer
        imageUrl={avatarUrl}
        onRequestClose={() => setIsPhotoViewerVisible(false)}
        visible={isPhotoViewerVisible}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Platform.select({ web: Spacing.six, default: Spacing.four }),
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  profileCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTextWrap: {
    flex: 1,
    gap: Spacing.half,
  },
  actionsCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.half,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: Spacing.one,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderColor: danger,
  },
  deleteButtonText: {
    color: danger,
  },
});

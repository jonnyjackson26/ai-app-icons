import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/auth-provider";
import { AuthMethodButton } from "@/features/auth/components/auth-method-button";
import { useTheme } from "@/hooks/use-theme";

export default function SignInScreen() {
  const { signInWithGoogleIdToken, signInWithAppleIdToken } = useAuth();
  const theme = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<
    "google" | "apple" | null
  >(null);
  const isBusy = !!activeProvider;

  const onGoogleSignIn = async () => {
    if (activeProvider) {
      return;
    }

    setSubmitError(null);
    setActiveProvider("google");

    const { errorMessage } = await signInWithGoogleIdToken();
    if (errorMessage) {
      setSubmitError(errorMessage);
    }

    setActiveProvider(null);
  };

  const onAppleSignIn = async () => {
    if (activeProvider) {
      return;
    }

    setSubmitError(null);
    setActiveProvider("apple");

    const { errorMessage } = await signInWithAppleIdToken();
    if (errorMessage) {
      setSubmitError(errorMessage);
    }

    setActiveProvider(null);
  };

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.keyboardAvoiding}
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <ThemedText type="title">Welcome</ThemedText>
              <ThemedText themeColor="textSecondary">Continue with</ThemedText>
            </View>

            <View style={styles.actions}>
              <Link href="/sign-in-email" asChild>
                <AuthMethodButton
                  disabled={isBusy}
                  icon={
                    <SymbolView
                      name="envelope.fill"
                      tintColor={theme.textSecondary}
                      size={18}
                    />
                  }
                  label="Continue with Email"
                />
              </Link>

              <Link href="/phone" asChild>
                <AuthMethodButton
                  disabled={isBusy}
                  icon={
                    <SymbolView
                      name="phone.fill"
                      tintColor={theme.textSecondary}
                      size={18}
                    />
                  }
                  label="Continue with Phone"
                />
              </Link>

              {Platform.OS === "ios" && (
                <AuthMethodButton
                  disabled={isBusy}
                  icon={
                    <SymbolView
                      name="applelogo"
                      tintColor={theme.textSecondary}
                      size={18}
                    />
                  }
                  label="Continue with Apple"
                  loading={activeProvider === "apple"}
                  onPress={onAppleSignIn}
                />
              )}

              <AuthMethodButton
                disabled={!!activeProvider}
                icon={
                  <View
                    style={[
                      styles.googleBadge,
                      { borderColor: theme.backgroundSelected },
                    ]}
                  >
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      G
                    </ThemedText>
                  </View>
                }
                label="Continue with Google"
                loading={activeProvider === "google"}
                onPress={onGoogleSignIn}
              />

              {submitError ? (
                <ThemedText type="small" style={styles.errorText}>
                  {submitError}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  titleContainer: {
    gap: Spacing.half,
  },
  actions: {
    gap: Spacing.three,
  },
  googleBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#D13F4A",
  },
});

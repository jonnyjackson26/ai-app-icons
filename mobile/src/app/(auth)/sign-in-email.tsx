import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthBackButton } from '@/features/auth/components/auth-back-button';
import { signInSchema, type SignInFormValues } from '@/features/auth/auth-schema';
import { useTheme } from '@/hooks/use-theme';

export default function SignInEmailScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);

    const { error } = await signIn(values);
    if (error) {
      setSubmitError(error.message);
    }

    setIsSubmitting(false);
  };

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
          style={styles.keyboardAvoiding}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AuthBackButton onPress={() => router.push('/sign-in')} />

            <View style={styles.formWrap}>
              <View style={styles.titleContainer}>
                <ThemedText type="subtitle">Sign in with email</ThemedText>
                <ThemedText themeColor="textSecondary">
                  Enter your email and password to continue.
                </ThemedText>
              </View>

              <View style={styles.form}>
                <View style={styles.field}>
                  <ThemedText type="smallBold">Email</ThemedText>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        keyboardType="email-address"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="you@example.com"
                        placeholderTextColor={theme.textSecondary}
                        style={[
                          styles.input,
                          {
                            borderColor: errors.email ? '#D13F4A' : theme.backgroundSelected,
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                          },
                        ]}
                        value={value}
                      />
                    )}
                  />
                  {errors.email ? (
                    <ThemedText type="small" style={styles.errorText}>
                      {errors.email.message}
                    </ThemedText>
                  ) : null}
                </View>

                <View style={styles.field}>
                  <ThemedText type="smallBold">Password</ThemedText>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        autoCapitalize="none"
                        autoComplete="password"
                        autoCorrect={false}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Enter password"
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry
                        style={[
                          styles.input,
                          {
                            borderColor: errors.password ? '#D13F4A' : theme.backgroundSelected,
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                          },
                        ]}
                        value={value}
                      />
                    )}
                  />
                  {errors.password ? (
                    <ThemedText type="small" style={styles.errorText}>
                      {errors.password.message}
                    </ThemedText>
                  ) : null}
                </View>

                {submitError ? (
                  <ThemedText type="small" style={styles.errorText}>
                    {submitError}
                  </ThemedText>
                ) : null}

                <Pressable
                  disabled={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      opacity: pressed || isSubmitting ? 0.75 : 1,
                      backgroundColor: theme.text,
                    },
                  ]}>
                  {isSubmitting ? (
                    <ActivityIndicator color={theme.background} size="small" />
                  ) : (
                    <ThemedText style={[styles.buttonText, { color: theme.background }]}>
                      Continue
                    </ThemedText>
                  )}
                </Pressable>

                <Link href="/sign-up" asChild>
                  <Pressable style={({ pressed }) => pressed && styles.linkPressed}>
                    <ThemedText type="small" style={styles.footerText}>
                      Don&apos;t have an account yet? <ThemedText type="smallBold">Sign up</ThemedText>
                    </ThemedText>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  formWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.five,
  },
  titleContainer: {
    gap: Spacing.one,
  },
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 600,
  },
  errorText: {
    color: '#D13F4A',
  },
  footerText: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  linkPressed: {
    opacity: 0.7,
  },
});

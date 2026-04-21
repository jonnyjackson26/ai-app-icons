import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/auth-provider";
import { AuthBackButton } from "@/features/auth/components/auth-back-button";
import {
  phoneSignInSchema,
  verifyPhoneOtpSchema,
  type PhoneSignInFormValues,
  type VerifyPhoneOtpFormValues,
} from "@/features/auth/auth-schema";
import { useTheme } from "@/hooks/use-theme";

export default function PhoneAuthScreen() {
  const { signInWithPhone, verifyPhoneOtp } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  const {
    control: phoneControl,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors },
  } = useForm<PhoneSignInFormValues>({
    resolver: zodResolver(phoneSignInSchema),
    defaultValues: {
      phone: "",
    },
  });

  const {
    control: tokenControl,
    handleSubmit: handleTokenSubmit,
    formState: { errors: tokenErrors },
  } = useForm<VerifyPhoneOtpFormValues>({
    resolver: zodResolver(verifyPhoneOtpSchema),
    defaultValues: {
      token: "",
    },
  });

  const onSendCode = async (values: PhoneSignInFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSendingCode(true);

    const { error } = await signInWithPhone({ phone: values.phone });

    if (error) {
      setSubmitError(error.message);
    } else {
      setPendingPhone(values.phone);
      setSubmitSuccess(
        "Verification code sent. Enter the 6-digit code from your SMS.",
      );
    }

    setIsSendingCode(false);
  };

  const onVerifyCode = async (values: VerifyPhoneOtpFormValues) => {
    if (!pendingPhone) {
      setSubmitError("Enter your phone number and request a code first.");
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);
    setIsVerifyingCode(true);

    const { error } = await verifyPhoneOtp({
      phone: pendingPhone,
      token: values.token,
    });

    if (error) {
      setSubmitError(error.message);
    }

    setIsVerifyingCode(false);
  };

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: "height" })}
          style={styles.keyboardAvoiding}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthBackButton onPress={() => router.push('/sign-in')} />

            <View style={styles.formWrap}>
              <View style={styles.titleContainer}>
                <ThemedText type="subtitle">Continue with phone</ThemedText>
                <ThemedText themeColor="textSecondary">
                  Use your phone number and a one-time verification code.
                </ThemedText>
              </View>

              <View style={styles.form}>
                <View style={styles.field}>
                  <ThemedText type="smallBold">Phone number</ThemedText>
                  <Controller
                    control={phoneControl}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        autoCapitalize="none"
                        autoComplete="tel"
                        autoCorrect={false}
                        editable={!isSendingCode && !isVerifyingCode}
                        keyboardType="phone-pad"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="+15551234567"
                        placeholderTextColor={theme.textSecondary}
                        style={[
                          styles.input,
                          {
                            borderColor: phoneErrors.phone
                              ? "#D13F4A"
                              : theme.backgroundSelected,
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                          },
                        ]}
                        value={value}
                      />
                    )}
                  />
                  {phoneErrors.phone ? (
                    <ThemedText type="small" style={styles.errorText}>
                      {phoneErrors.phone.message}
                    </ThemedText>
                  ) : null}
                </View>

                <Pressable
                  disabled={isSendingCode || isVerifyingCode}
                  onPress={handlePhoneSubmit(onSendCode)}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      opacity:
                        pressed || isSendingCode || isVerifyingCode ? 0.75 : 1,
                      backgroundColor: theme.text,
                    },
                  ]}
                >
                  {isSendingCode ? (
                    <ActivityIndicator color={theme.background} size="small" />
                  ) : (
                    <ThemedText
                      style={[styles.buttonText, { color: theme.background }]}
                    >
                      Send code
                    </ThemedText>
                  )}
                </Pressable>

                {pendingPhone ? (
                  <>
                    <View style={styles.field}>
                      <ThemedText type="smallBold">Verification code</ThemedText>
                      <Controller
                        control={tokenControl}
                        name="token"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            autoCapitalize="none"
                            autoComplete="sms-otp"
                            autoCorrect={false}
                            editable={!isSendingCode && !isVerifyingCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            placeholder="123456"
                            placeholderTextColor={theme.textSecondary}
                            style={[
                              styles.input,
                              {
                                borderColor: tokenErrors.token
                                  ? "#D13F4A"
                                  : theme.backgroundSelected,
                                color: theme.text,
                                backgroundColor: theme.backgroundElement,
                              },
                            ]}
                            value={value}
                          />
                        )}
                      />
                      {tokenErrors.token ? (
                        <ThemedText type="small" style={styles.errorText}>
                          {tokenErrors.token.message}
                        </ThemedText>
                      ) : null}
                    </View>

                    <Pressable
                      disabled={isSendingCode || isVerifyingCode}
                      onPress={handleTokenSubmit(onVerifyCode)}
                      style={({ pressed }) => [
                        styles.button,
                        {
                          opacity:
                            pressed || isSendingCode || isVerifyingCode
                              ? 0.75
                              : 1,
                          backgroundColor: theme.text,
                        },
                      ]}
                    >
                      {isVerifyingCode ? (
                        <ActivityIndicator
                          color={theme.background}
                          size="small"
                        />
                      ) : (
                        <ThemedText
                          style={[styles.buttonText, { color: theme.background }]}
                        >
                          Verify and continue
                        </ThemedText>
                      )}
                    </Pressable>
                  </>
                ) : null}

                {submitError ? (
                  <ThemedText type="small" style={styles.errorText}>
                    {submitError}
                  </ThemedText>
                ) : null}
                {submitSuccess ? (
                  <ThemedText type="small" style={styles.footerText}>
                    <ThemedText type="smallBold" style={styles.successText}>Code sent.</ThemedText> Check SMS and verify to continue.
                  </ThemedText>
                ) : null}
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
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
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
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.one,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 600,
  },
  errorText: {
    color: "#D13F4A",
  },
  successText: {
    color: "#2A8F5C",
  },
  footerText: {
    textAlign: "center",
    marginTop: Spacing.half,
  },
});

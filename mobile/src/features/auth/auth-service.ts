import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { AuthError, Session } from '@supabase/supabase-js';

import { getExpoPushToken, unregisterPushToken } from '@/features/notifications/notification-service';
import { supabase } from '../../../lib/supabase';

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  email: string;
  password: string;
};

export type SignInWithPhoneParams = {
  phone: string;
};

export type VerifyPhoneOtpParams = {
  phone: string;
  token: string;
};

type NativeAuthResult = {
  errorMessage: string | null;
};

function normalizePhone(phone: string): string {
  const raw = phone.trim();
  const hasLeadingPlus = raw.startsWith('+');
  const digitsOnly = raw.replace(/\D/g, '');

  if (hasLeadingPlus) {
    return `+${digitsOnly}`;
  }

  // Support international format entered with 00 prefix.
  if (raw.startsWith('00')) {
    return `+${digitsOnly.slice(2)}`;
  }

  // Default to +1 for local-style numbers.
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }

  // If user entered a country code without the leading +, keep it.
  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  return `+1${digitsOnly}`;
}

export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

export async function signInWithPassword({
  email,
  password,
}: SignInParams): Promise<{ error: AuthError | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  return { error };
}

export async function signUpWithPassword({
  email,
  password,
}: SignUpParams): Promise<{ error: AuthError | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });

  return { error };
}

export async function signInWithPhone({
  phone,
}: SignInWithPhoneParams): Promise<{ error: AuthError | null }> {
  const normalizedPhone = normalizePhone(phone);
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  return { error };
}

export async function verifyPhoneOtp({
  phone,
  token,
}: VerifyPhoneOtpParams): Promise<{ error: AuthError | null }> {
  const normalizedPhone = normalizePhone(phone);
  const normalizedToken = token.trim();
  const { error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: normalizedToken,
    type: 'sms',
  });

  return { error };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  // Best-effort: remove push token while session is still valid (RLS requires it).
  try {
    const token = await getExpoPushToken();
    if (token) await unregisterPushToken(token);
  } catch {
    // Token cleanup is best-effort; don't block sign-out.
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

let isGoogleConfigured = false;

function getGoogleClientIds() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';

  return {
    webClientId,
    iosClientId,
  };
}

function createNonce(): string {
  return Array.from(Crypto.getRandomBytes(32))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function normalizeUnexpectedError(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallbackMessage;
}

function isAppleCancellationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode = 'code' in error ? String(error.code) : '';
  const maybeMessage = 'message' in error ? String(error.message) : '';
  return maybeCode === 'ERR_REQUEST_CANCELED' || maybeMessage.includes('ERR_REQUEST_CANCELED');
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const tokenParts = token.split('.');
  if (tokenParts.length < 2) {
    return null;
  }

  const payloadPart = tokenParts[1];
  const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  const normalizedBase64 = base64 + '='.repeat(padding);

  try {
    const payload = JSON.parse(atob(normalizedBase64));
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function signInWithGoogleIdToken(): Promise<NativeAuthResult> {
  if (Platform.OS === 'web') {
    return { errorMessage: 'Google Sign-In requires a native iOS or Android build.' };
  }

  const { webClientId, iosClientId } = getGoogleClientIds();
  if (!webClientId) {
    return { errorMessage: 'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.local.' };
  }

  if (!isGoogleConfigured) {
    GoogleSignin.configure({
      webClientId,
      iosClientId: iosClientId || undefined,
      offlineAccess: false,
    });
    isGoogleConfigured = true;
  }

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Clear the cached Google account so the legacy Android Sign-In SDK
      // re-shows the account picker instead of silently reusing the last
      // chosen account. This only clears Google's local sign-in state —
      // it does not touch the Supabase session.
      try {
        await GoogleSignin.signOut();
      } catch {
        // Nothing cached, or already signed out — safe to ignore.
      }
    }

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { errorMessage: null };
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return { errorMessage: 'Google Sign-In did not return an ID token.' };
    }

    const payload = decodeJwtPayload(idToken);
    const tokenNonce = typeof payload?.nonce === 'string' ? payload.nonce : undefined;

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      ...(tokenNonce ? { nonce: tokenNonce } : {}),
    });
    if (error) {
      return { errorMessage: error.message ?? 'Google Sign-In failed.' };
    }

    return { errorMessage: null };
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
        return { errorMessage: null };
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { errorMessage: 'Google Play Services are unavailable or need an update.' };
      }
      if (error.message?.trim()) {
        return { errorMessage: error.message };
      }
    }

    return { errorMessage: normalizeUnexpectedError(error, 'Google Sign-In failed.') };
  }
}

export async function signInWithAppleIdToken(): Promise<NativeAuthResult> {
  if (Platform.OS !== 'ios') {
    return { errorMessage: 'Apple Sign-In is only available on iOS.' };
  }

  const isAppleAuthAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAppleAuthAvailable) {
    return { errorMessage: 'Apple Sign-In is not available on this device.' };
  }

  const rawNonce = createNonce();
  const hashedNonce = await sha256(rawNonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { errorMessage: 'Apple Sign-In did not return an ID token.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) {
      return { errorMessage: error.message ?? 'Apple Sign-In failed.' };
    }

    return { errorMessage: null };
  } catch (error: unknown) {
    if (isAppleCancellationError(error)) {
      return { errorMessage: null };
    }

    return { errorMessage: normalizeUnexpectedError(error, 'Apple Sign-In failed.') };
  }
}

const DELETE_USER_RPC = 'delete_user';
const DELETE_USER_SETUP_MESSAGE =
  'Account deletion is not configured yet. Add the delete_user RPC from docs/SETUP.md and try again.';

type RpcErrorLike = {
  message?: string;
  code?: string;
};

function isMissingDeleteUserRpc(error: RpcErrorLike): boolean {
  const message = (error.message ?? '').toLowerCase();
  return (
    message.includes('function') && message.includes(DELETE_USER_RPC) ||
    error.code === 'PGRST202' ||
    error.code === '42883'
  );
}

export async function deleteAccount(): Promise<{ errorMessage: string | null }> {
  const { error } = await supabase.rpc(DELETE_USER_RPC);

  if (!error) {
    // Clear local session after account deletion so UI immediately exits authenticated routes.
    const { error: localSignOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (localSignOutError) {
      return { errorMessage: localSignOutError.message ?? 'Account deleted, but failed to clear local session.' };
    }
    return { errorMessage: null };
  }

  if (isMissingDeleteUserRpc(error)) {
    return { errorMessage: DELETE_USER_SETUP_MESSAGE };
  }

  return { errorMessage: error.message ?? 'Unable to delete account right now.' };
}

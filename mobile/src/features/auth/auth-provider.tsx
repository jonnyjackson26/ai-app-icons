import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '../../../lib/supabase';
import {
  deleteAccount,
  getSession,
  signInWithPassword,
  signInWithAppleIdToken,
  signInWithGoogleIdToken,
  signInWithPhone,
  signUpWithPassword,
  signOut,
  type SignInParams,
  type SignInWithPhoneParams,
  type SignUpParams,
  type VerifyPhoneOtpParams,
  verifyPhoneOtp,
} from '@/features/auth/auth-service';
import {
  getAvatarPath,
  getAvatarUrl,
  removeAvatar,
  type RemoveAvatarParams,
  type UploadAvatarParams,
  uploadAvatar,
} from '@/features/auth/avatar-service';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  signIn: (params: SignInParams) => ReturnType<typeof signInWithPassword>;
  signInWithGoogleIdToken: () => ReturnType<typeof signInWithGoogleIdToken>;
  signInWithAppleIdToken: () => ReturnType<typeof signInWithAppleIdToken>;
  signInWithPhone: (params: SignInWithPhoneParams) => ReturnType<typeof signInWithPhone>;
  verifyPhoneOtp: (params: VerifyPhoneOtpParams) => ReturnType<typeof verifyPhoneOtp>;
  signUp: (params: SignUpParams) => ReturnType<typeof signUpWithPassword>;
  signOut: () => ReturnType<typeof signOut>;
  deleteAccount: () => ReturnType<typeof deleteAccount>;
  uploadAvatar: (params: UploadAvatarParams) => ReturnType<typeof uploadAvatar>;
  removeAvatar: (params: RemoveAvatarParams) => ReturnType<typeof removeAvatar>;
  getAvatarPath: (userId: string) => ReturnType<typeof getAvatarPath>;
  getAvatarUrl: (avatarPath: string | null) => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getSession()
      .then(({ session: initialSession }) => {
        if (!mounted) {
          return;
        }
        setSession(initialSession);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      signIn: signInWithPassword,
      signInWithGoogleIdToken,
      signInWithAppleIdToken,
      signInWithPhone,
      verifyPhoneOtp,
      signUp: signUpWithPassword,
      signOut,
      deleteAccount,
      uploadAvatar,
      removeAvatar,
      getAvatarPath,
      getAvatarUrl,
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

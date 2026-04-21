import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

const phoneNumberSchema = z
  .string()
  .trim()
  .regex(
    /^[+]?\d[\d\s().-]{6,24}$/,
    'Enter a valid phone number. You can include +country code, or enter a local number to default to +1.'
  );

export const phoneSignInSchema = z.object({
  phone: phoneNumberSchema,
});

export type PhoneSignInFormValues = z.infer<typeof phoneSignInSchema>;

export const verifyPhoneOtpSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit verification code.'),
});

export type VerifyPhoneOtpFormValues = z.infer<typeof verifyPhoneOtpSchema>;

export const signUpSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

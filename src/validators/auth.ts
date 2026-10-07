import { z } from 'zod';
import { TRANSLATION_KEYS } from '../constants/translationKeys';

const v = TRANSLATION_KEYS.AUTH.VALIDATION;

export const loginSchema = z.object({
  email: z.string().min(1, v.EMAIL_REQUIRED).email(v.EMAIL_INVALID),
  password: z.string().min(1, v.PASSWORD_REQUIRED),
});

// Must match AuthValidators.createUserValidation on the backend.
export const registerSchema = z.object({
  userName: z.string()
    .trim()
    .min(1, v.USERNAME_REQUIRED)
    .regex(/^[a-zA-Z0-9_-]{2,50}$/, v.USERNAME_INVALID),
  email: z.string().min(1, v.EMAIL_REQUIRED).email(v.EMAIL_INVALID),
  password: z.string().min(1, v.PASSWORD_REQUIRED).min(8, v.PASSWORD_MIN),
  confirm: z.string().min(1, v.CONFIRM_REQUIRED),
}).refine((data) => data.password === data.confirm, {
  message: v.PASSWORD_MISMATCH,
  path: ['confirm'],
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;

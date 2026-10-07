# Rules — Login and signup

## Scope

Edit:

- `src/app/(auth)/login.tsx`
- `src/app/(auth)/register.tsx`
- `src/validators/auth.ts`
- `src/store/slices/authSlice.ts` (error string and credential logs only)
- `src/constants/translationKeys.ts`
- `src/locales/en.json`
- `src/locales/bn.json`
- `.github/instructions/auth/auth.instructions.md` so it matches this screen

Add shared pieces only if both screens use them:

- `src/components/auth/AuthScreen.tsx` — safe area, scroll, keyboard, logo, title, subtitle
- `src/components/auth/AuthField.tsx` — label, input, error, optional secure toggle
- `src/components/auth/AuthButton.tsx` — primary press target with loading

Do not add an auth group `_layout.tsx`. The root stack already hides the header.

## Form

- Use `Controller` from react-hook-form with the existing Zod schemas. Drop the `register` + `setValue` effect.
- `mode` stays `onSubmit`. `reValidateMode` stays `onChange`, which `Controller` already feeds.
- Trim email and lowercase it before dispatch. Do not trim passwords.
- Signup always sends `role: 'USER'`. Remove the role picker, `ROLE_OPTIONS`, and `role` from the schema.
- Password minimum stays 6, matching the API. Show that hint under the password field before the first error.
- Confirm must match password. The confirm placeholder is its own string, not the password placeholder.
- Map Zod failures to translation keys. Do not ship English sentences inside the schema.

## Layout and theme

- `SafeAreaView` from `react-native-safe-area-context`, edges top and bottom.
- `KeyboardAvoidingView` plus `ScrollView`. `keyboardShouldPersistTaps="handled"`. Content can grow and still scroll on a small phone.
- Page: `bg-background dark:bg-background-dark`. Card: `bg-surface dark:bg-surface-dark` and `border-border`.
- Inputs: `bg-surface-2`. Errors: `text-error` and `border-error`. Do not use `text-danger`, `bg-background-input`, `gray-*`, or raw hex on these screens.
- Primary label is `text-on-primary`. Button height is at least 48. Disabled and busy set `accessibilityState`.
- Field errors set `accessibilityLiveRegion="polite"`.

## Submit and errors

- Ignore presses while `auth.isLoading`.
- `loginUser` and `registerUser` reject with a string. Prefer `response.data.message`. If that is missing, use a translated fallback (`auth.login.failed`, `auth.register.failed`).
- Never `console.log` the login or register payload. Log the failure message only, and only in `__DEV__`.
- Clear `auth.error` when a field changes, and on unmount (already required).

## Social

- Render Google and Facebook only when the matching hook’s `isReady` is true.
- While both are false, omit the divider, the “not available” paragraph, and both buttons.
- Do not change `useGoogleSignIn`, `useFacebookSignIn`, or `loginWithOAuth` in this pass.

## Copy

Add keys for: show password, hide password, password hint, confirm placeholder, login failed, signup failed, dismiss error. English and Bangla both.

Remove unused signup role keys from the screens. Leave the key constants if other files still import them.

## Do not

- Do not add Forgot password.
- Do not enable social login.
- Do not let the signup form send `MASTER_ADMIN`, `SERVICE_ADMIN`, or `EMPLOYEE`.
- Do not change token storage, refresh, or `resolveRoleHome`.
- Do not restyle unrelated screens to match.

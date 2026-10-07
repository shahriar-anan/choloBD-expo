# Login and signup polish

**Folder:** `auth-login-signup` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented in code. `npx tsc --noEmit` passed. Device cases in tests.md are not run yet.

Login is `src/app/(auth)/login.tsx`. Signup is `src/app/(auth)/register.tsx`. Both already submit through `loginUser` / `registerUser` and redirect with `resolveRoleHome`. This plan fixes the form, the layout, and the copy. It does not turn social login on.

`UI_REVIEW_SIGNIN_SIGNUP.md` describes an older screen (empty social buttons, no signup social block). Ignore it. The current screens already render branded Google and Facebook buttons, and those buttons are hard-disabled.

## What is wrong now

- The page and the card both use `bg-surface`, so the card has no fill against the page. Inputs use `bg-background-input`, which is not in `tailwind.config.js`. Errors use `text-danger`, which is also missing. The theme color is `error`.
- There is no `ScrollView`. Signup is taller than a phone once the keyboard is open. `KeyboardAvoidingView` alone does not scroll the focused field into view. Safe area comes from React Native’s `SafeAreaView`. The rest of the app uses `react-native-safe-area-context`.
- Fields are wired with `register` + `setValue`. After a failed submit, fixing a field does not clear its error, because `setValue` is called without `shouldValidate`. There is no show/hide on passwords, no Next/Done chain, and no autofill hints (`textContentType`, `autoComplete`).
- The sign-in button stays tappable while `auth.isLoading`. The label changes to “Signing in...” and there is no spinner.
- Zod messages are English strings (`Email is required`, `Passwords don't match`). A Bangla session still shows those strings.
- Signup asks the person to pick `MASTER_ADMIN`, `SERVICE_ADMIN`, `EMPLOYEE`, or `USER`, and prints the raw enum. `POST /api/auth/register-jwt` will assign `SERVICE_ADMIN` or `EMPLOYEE` when that role is sent and a master admin already exists. A traveler signup must create `USER` only.
- Google and Facebook buttons are `disabled` and faded, under a sentence that says they are unavailable. They take most of the lower half of the screen and do nothing. `googleError` and `facebookError` are read and never shown. The Google icon is `#1F2937` on a dark button, so it disappears in dark mode.
- `loginUser` stores `e.response.data` on failure. That value is an object. The screen does `String(auth.error)`, which renders `[object Object]`. The same thunk logs the password payload with `console.log`.

## What the person sees

```
[CholoBD mark]

Welcome back
Sign in to continue to CholoBD

Email
[ you@example.com          ]

Password                          [eye]
[ ••••••••                 ]
At least 6 characters

[ Sign in ]

Don't have an account?  Create account
```

Signup is the same shell with four fields: name, email, password, confirm password. No role row. The footer is “Already have an account? Sign in”.

- Page background is `background`. The form sits on `surface`, with `border` and radius, so the card is visible in light and dark.
- Inputs use `surface-2`, `border`, and `text`. A field with an error uses `border-error`. The message under it uses `text-error`.
- Labels sit above fields. Gap between fields is 16. The primary button is full width, at least 48 tall, and shows a spinner plus the loading label while the request runs. It does not accept another press.
- Password fields have a show/hide control. Email moves to password with Next. Password (and confirm, on signup) submits with Done.
- Server failures render one line from `message`, in the active language when the server text is a known case, otherwise the server’s own string. Wrong email or password stays one sentence. The banner can be dismissed, and it clears when the person edits a field.
- Social buttons are absent. `useGoogleSignIn` and `useFacebookSignIn` stay in the repo and stay `isReady: false`. When a later change sets `isReady` true, the same screen can show the buttons again. Until then, do not leave disabled buttons on the form.
- After success, `router.replace` still goes to `resolveRoleHome`. Back does not return to the form.

## Left off

- Forgot password. The API has no reset route. Do not add a link that goes nowhere.
- Turning Google or Facebook sign-in on. `loginWithOAuth` still rejects.
- Terms, privacy, or email verification.
- A combined login/signup toggle. Keep two routes: `/login` and `/register`.
- Staff account creation. Master admin assigns `SERVICE_ADMIN` and `EMPLOYEE` elsewhere.

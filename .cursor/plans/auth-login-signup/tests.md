# Tests — Login and signup

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Confirm:

- `register.tsx` does not contain `MASTER_ADMIN`, `SERVICE_ADMIN`, `EMPLOYEE`, or `ROLE_OPTIONS`.
- `login.tsx` and `register.tsx` do not contain `text-danger` or `bg-background-input`.
- `authSlice.ts` does not log the login or register payload.

## Device cases

A person runs these. The agent does not launch Expo.

### D-A1 Sign in

- Open Login in English, light mode.
- Leave both fields empty and press Sign in.
- Expected: “Email is required” and “Password is required” in red, under the fields. No request fires.
- Type a bad email, fix it, and confirm the email error clears before the next submit.
- Sign in with a real account.
- Expected: one request, button shows a spinner and ignores a second tap, then the role home. Back does not show Login.

### D-A2 Wrong password

- Submit a known email and a wrong password.
- Expected: one readable sentence, not `[object Object]`. Dismiss hides it. Editing the password hides it.

### D-A3 Keyboard

- On a small phone, focus the password field.
- Expected: the field and the Sign in button stay on screen. Done submits.

### D-A4 Signup

- Open Create account.
- Expected: name, email, password, confirm. No role control. No Google or Facebook buttons.
- Mismatched passwords show the confirm error.
- A new email creates a `USER` and lands on the traveler home.
- An existing email shows the server’s “already exists” message.

### D-A5 Language and theme

- Switch to Bangla, then dark mode, on both screens.
- Expected: titles, labels, button, hints, and validation are Bangla. Card is lighter than the page background. Error text is the theme red. Password show/hide still works.

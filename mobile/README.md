# RNTemplate

A batteries-included Expo + React Native template.

**Includes:** Supabase auth (email/password, Google OAuth, Apple OAuth, Twilio SMS), PostHog, Sentry, push notifications (Expo + FCM), avatar upload, account deletion, and separate dev/prod bundle IDs so you can keep both variants on your phone at once. Push notifications use **Expo's push service** (Expo Push Tokens), which abstracts APNs and FCM.

---

## Create a new app from this template

### 1. Clone (in powershell run):

```powershell
cd C:\Users\Jonathan\Documents
git clone https://github.com/jonnyjackson26/RNTemplate.git MyApp
cd MyApp
rm -rf .git (linux) / Remove-Item -Recurse -Force .git (windows)
npm run setup
```

You'll be prompted for an app name, display name, and bundle ID prefix. The script updates `package.json` and `app.config.ts` (slug, scheme, display name, iOS/Android bundle IDs, Sentry project, EAS projectId).

You can now open Documents/MyApp in your preffered IDE

### 2. Configure third-party services

See [docs/SETUP.md](docs/SETUP.md) for the post-rename configuration steps (Supabase, PostHog, Sentry, Google/Apple OAuth, Twilio, Firebase / push notifications, EAS dev build).

## PREREQS:

- apple dev account

## More features

### 4. Sending notifications

Use the Expo push API. You can test with the [Expo Push Notification Tool](https://expo.dev/notifications).

To send from your backend, POST to `https://exp.host/--/api/v2/push/send`:

```json
{
  "to": "ExponentPushToken[xxxxxx]",
  "title": "Hello",
  "body": "This is a test notification"
}
```

Query tokens for a user from the `push_tokens` table using the Supabase client or a server-side Edge Function.

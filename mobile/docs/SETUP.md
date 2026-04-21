# Post-Setup Configuration

Before reading this, run through [README.md](../README.md) to clone, rename, and install. This document covers the third-party service wiring you do **after** the project is renamed.

## Git

Create a github repo then run: (replace the url)

```
git init
git add .
git commit -m "first commit cloned from rntemplate"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/YOURREPO.git
git push -u origin main
```

## EAS

run `eas init`. Select your account if propmted, then `Y` to create a new project.
It will say:

```
Warning: Your project uses dynamic app configuration, and the EAS project ID can't automatically be added to it.
https://docs.expo.dev/workflow/configuration/#dynamic-configuration-with-appconfigjs

To complete the setup process, set "extra.eas.projectId" in your app.config.ts:

{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "xxxxxx-xxxx"
      }
    }
  }
}

Cannot automatically write to dynamic config at: app.config.ts
    Error: project:init command failed.
```

Set that projectId as `EAS_PROJECT_ID` in`.env.local`.

## PostHog

Create a new project on PostHog and follow the manual installation instructions and select React Native. The packages are already installed and the code is all set up — all you need to do is find the API key that starts with `phc_` and put it in your `.env.local` as `EXPO_PUBLIC_POSTHOG_API_KEY`.

## Sentry

1. Create a Sentry project.
2. Note the `project` and `organization` values and set them in `.env.local`
3. Set the DSN as `EXPO_PUBLIC_SENTRY_DSN` in `.env.local`
4. Add `SENTRY_AUTH_TOKEN=` to `.env.local`. You get this by making a new organization auth token (/settings/auth-tokens/)

## Supabase

1. Create a Supabase project.
2. Put `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `EXPO_PUBLIC_SUPABASE_URL` in `.env.local`.
3. In Supabase Auth settings, disable "confirm email".
4. Install the Supabase CLI, log in, then link and push migrations:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Your YOUR_PROJECT_REF is xxxxx if https://xxxxx.supabase.co is your project URL

## Twilio SMS verification

1. Log in to your Twilio account.
2. Get your SID and auth token, paste them into Supabase → Sign in / Providers → Phone (select **Twilio Verify**, NOT **Twilio**).
3. Create a verification service and give it a friendly name. (Verifications -> Start building). Paste it into the `Twilio Message Service SID` field in Supabase. Click Save. Also, make sure `Enable phone provider` at the top is toggled True.

_It may not let you save unless you put `0123456789=123456` into `Test Phone Numbers and OTPs`. This is fine, because you can just set the `Test OTPs Valid Until` to todays date._

## Google + Apple OAuth

[Create a Google Cloud project](https://console.cloud.google.com/projectcreate)

### 1. Configure Google OAuth clients

Do the OAuth consent: `https://console.cloud.google.com/auth/overview`

Create the following OAuth client IDs at https://console.cloud.google.com/apis/credentials by clicking `Create credentials` then `OAuth Client ID`:

1. **Web application** client
   - You dont need to input any info. Click Create.
   - Provides `client_id` + `client_secret`. Put the client id in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env.local`.
   - You don't need to download the JSON file.
   - In Supabase, Open **Authentication → Providers** then enable **Google** and fill in Web Client ID + Client Secret. **Skip nonce checks should be TRUE.**
2. **Android** client (dev)
   - Run `eas credentials`. Select `Android -> development ->  Keystore: Manage everything needed to build your project -> Set up a new keystore`. Exit, then copy the SHA-1. This will be the `SHA-1 certificate fingerprint` in google cloud console.
   - The package name is `com.jrsjackson26.rntemplate.dev`
   - Click Save. You don't need the client ID or JSON file. The auth flow goes through the web client via Supabase using the SHA-1s.
3. **Android** client (prod)
   - Run `eas credentials`. Select `Android -> production ->  Keystore: Manage everything needed to build your project -> Set up a new keystore`. Note the SHA-1, this will be the `SHA-1 certificate fingerprint` in google cloud console.
   - The package name is `com.jrsjackson26.rntemplate`
   - Click Save. You don't need the client ID or JSON file. The auth flow goes through the web client via Supabase using the SHA-1s.
4. **iOS** client
   - Input your iOS bundle ID.
   - Provides iOS `CLIENT_ID` and `REVERSED_CLIENT_ID` (from plist). You dont actually need the plist file for anything besides the REVERSED_CLIENT_ID, and it’s simply the CLIENT_ID written in reverse order. for example, if your CLIENT_ID is `com.googleusercontent.apps.1234567890-abcdef` then your REVERSED_CLIENT_ID is `com.googleusercontent.apps.abcdef-1234567890`
   - Add `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` to `.env.local`.

### 2. Configure Apple Sign-In

In your Apple Developer account, under Certificates, IDs & Profiles:

1. Make sure your App ID has **Sign In with Apple** capability enabled.
2. Create a **Sign in with Apple key** and download the `.p8` file (one-time download).
3. Plug your Team ID, Key ID, and `.p8` into `https://applekeygen.expo.app/` to generate the JWT for Supabase.

In the Supabase Dashboard:

1. Open **Authentication → Providers**.
2. Enable **Apple** and fill in Team ID, Key ID, private key (`.p8`), and Service ID.

## Push Notifications

#### a) `google-services.json` (client-side)

1. Go to [Firebase Console](https://console.firebase.google.com/) and press create a project then link to your existing Google Cloud project.
2. Add an Android app with you dev package name (e.g. `com.jrsjackson26.myapp.dev`) and click "Next" through all the info. You don't need any of it.
3. Add another Android app, this time with you prod package name (e.g. `com.jrsjackson26.myapp`).
4. Go to the project settings page -> General, then at the bottom of the page download either of the apps `google-services.json` (it contains both clients) and place it in the project root. This is not sensitive info and can be public.

#### b) Google Service Account Key (server-side — FCM v1)

1. In Firebase Console, go to **Project Settings → Service Accounts**.
2. Click **"Generate New Private Key"** and confirm. This downloads a JSON file that works for both the dev and prod variant.
3. Upload the key to Expo in the [EAS dashboard](https://expo.dev) under your project's Credentials page under the Android prod variant.
   (Or use `eas credentials`, then **Android → production → Google Service Account → Manage your Google Service Account Key for Push Notifications (FCM V1) → Set up a Google Service Account Key for Push Notifications (FCM V1) → Upload a new service account key**. This key does not go anywhere in your project's codebase.)

## App icons

Generate at https://ai-app-icons.vercel.app/

## EAS dev build

**Apple:**

```bash
eas build --profile development --platform ios
```

Login with apple account
Set up push notifications.

**Android:**

```bash
eas build --profile development --platform android
```

### Running the dev client locally

When running the dev client on your machine, set the variant so the config matches the dev build's bundle ID:

```bash
APP_VARIANT=development npx expo start --dev-client
```

Without this, the local server uses the production config.

## Put on testflight

## Put on google play testing

## Put on App Store

## Put on Google Play Store

And good docs for how to set up including running eas init, git init, OTA update instructions, google OAuth instructions, push notification setup, deployment instructions with eas and steps for putting on TestFlight, google external testing, and App Store and Google play store.

# TODO:

- toggle the theme in settings
- and see the version number.
- Best practices and packages for safe area view handling and keyboard handling, all also documented in Claude.md
- Ci cd / git workflows
- Include a CLAUDE.md file (instructions on theme and styling, file structure, and posthog autocapture)
- https://docs.expo.dev/deploy/send-over-the-air-updates/
- have AI run the setup scrupt easy with flags
- remove assets not needed
- have npm run setup script put the bundle id in this line of the setup:

```
2. **iOS** client
   - Input your iOS bundle ID.
```

and also for the android client oauth!!

I dont need to create two ios clients?!

# eventually:

- fonts
- testing
- i18n
- 1 high severity vulnerability with npm i
- Change account password, confirm email

# decide:

- Use pnpm
- Is it better to have a dedicated backend or have your expo app have all the backend code within?
- expo ui / Gorhom bottom sheet
- all the native dependencies I’d need like Lottie-files, async storage
- icon library
- Native wind /styling libraries

# improvments:

- the google "G" looks weird
- in the auth pages, for example "sign up with email page", the page content isnt scrollable when the kayboard is up and it goes above the back button which looks weird

# env vars

One thing to be aware of: since .env.local is gitignored (correctly), the variables only exist on your machine. If you ever build from CI/CD or a different computer, they won't be there.

Recommendation for SENTRY_AUTH_TOKEN: This is a sensitive secret that shouldn't live only in a local file. Consider storing it on EAS servers:

eas env:create --name SENTRY*AUTH_TOKEN --value "sntrys_eyJ..." --visibility secret --environment development
eas env:create --name SENTRY_AUTH_TOKEN --value "sntrys_eyJ..." --visibility secret --environment production
The EXPO_PUBLIC*\* variables are fine staying local since they're public keys that get inlined into the JS bundle. But for anything sensitive, EAS server-side env vars are safer and make builds reproducible from any machine.

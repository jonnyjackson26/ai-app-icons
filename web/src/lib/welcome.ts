// Sentinel text used as `message.content` for the welcome message — both for
// persistence and for detecting "this is the welcome bubble" in the renderer.
// The visual representation lives in WelcomeBubble (rich JSX with progressive
// reveal), so this string only needs to be stable, not exhaustive.
export const WELCOME_PLAIN =
  "Welcome to ai-app-icons!\n" +
  "First, I'll generate a logo for your app — just the artwork, no background yet. " +
  "Once you like the logo, pick a background and I'll generate every asset your Expo app needs (iOS, Android, splash, favicon) for full platform coverage.";

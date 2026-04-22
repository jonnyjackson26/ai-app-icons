import type { Metadata } from "next";
import ContentPageShell from "@/components/ContentPageShell";

export const metadata: Metadata = {
  title: "Expo App Icons: Setup Guide — AI App Icons",
  description:
    "Everything you need to configure app icons in an Expo / React Native project — app.json fields, iOS dark and tinted variants, adaptive icons, and common pitfalls.",
};

export default function ExpoAppIconsPage() {
  return (
    <ContentPageShell>
      <h1>Expo App Icons: Setup Guide</h1>
      <p>
        Expo lets you ship one icon per platform and generates every required
        size at build time. Most of the complexity of iOS and Android icon
        sets disappears — but there are still a dozen fields in
        <code>app.json</code> that each control a specific behavior, and
        getting one wrong means a rejected build or a washed-out icon on a
        user&rsquo;s home screen.
      </p>
      <p>
        This guide walks through the full icon configuration for an Expo
        project in 2026.
      </p>

      <h2>The minimum viable config</h2>
      <p>
        A single shared icon for both platforms looks like this in
        <code>app.json</code>:
      </p>
      <ul>
        <li><code>icon</code> — path to a <code>1024×1024</code> PNG, square, no alpha, no rounded corners.</li>
      </ul>
      <p>
        That works, but you should almost always override the Android icon
        to use an adaptive set (see below) and the iOS icon to supply dark
        and tinted variants.
      </p>

      <h2>iOS: default, dark, and tinted</h2>
      <p>
        Expo SDK 51+ accepts an <code>ios.icon</code> object with three
        variants:
      </p>
      <ul>
        <li><code>light</code> — your default <code>1024×1024</code> icon.</li>
        <li><code>dark</code> — rendered on iOS 18+ dark home screens. Remove opaque background fills; iOS composites onto its own translucent dark layer.</li>
        <li><code>tinted</code> — used when iOS 18+ users enable the tinted home screen. Should be a single-channel luminance image; bold shapes with good contrast survive the tint, decorative gradients do not.</li>
      </ul>
      <p>
        If you supply only a single icon, iOS will auto-generate dark and
        tinted versions, and the results are usually disappointing. Supplying
        all three is a 10-minute fix that keeps your brand looking sharp
        across appearance modes.
      </p>

      <h2>Android: adaptive icon layers</h2>
      <p>
        Expo exposes adaptive icons via <code>android.adaptiveIcon</code>:
      </p>
      <ul>
        <li><code>foregroundImage</code> — your logo mark on a transparent 108×108 dp canvas. Keep the logo inside the middle ~66% to avoid clipping.</li>
        <li><code>backgroundColor</code> or <code>backgroundImage</code> — solid color (hex) or full-bleed 108×108 image.</li>
        <li><code>monochromeImage</code> — white-on-transparent silhouette for Android 13+ themed icons.</li>
      </ul>
      <p>
        Expo generates every density bucket (mdpi through xxxhdpi), the
        legacy flat <code>ic_launcher.png</code>, and the Play Store listing
        icon from these source images.
      </p>

      <h2>Splash screens are separate</h2>
      <p>
        Don&rsquo;t confuse icon config with splash screen config. They
        share similar vocabulary (<code>backgroundColor</code>, image paths)
        but live under different keys (<code>splash</code> vs
        <code>icon</code>). Changes to one do not affect the other.
      </p>

      <h2>EAS build and the icon cache</h2>
      <p>
        After changing icon files, run <code>eas build</code> with a new
        build number. Xcode and Android&rsquo;s package installer both cache
        icons aggressively; if you reinstall the same app version after a
        change, the home screen may still show the old icon. Incrementing
        the build number forces a fresh install.
      </p>

      <h2>Common pitfalls</h2>
      <ul>
        <li><strong>Using a JPEG for <code>icon</code>.</strong> It must be a PNG. JPEG artifacts show up even at 1024×1024.</li>
        <li><strong>Alpha channel in the iOS icon.</strong> The App Store strips it and sometimes rejects the build.</li>
        <li><strong>Rounded corners baked in.</strong> iOS and Android both apply their own masks. Start from a square.</li>
        <li><strong>Foreground too close to the edge on Android.</strong> Circular launcher masks will crop it.</li>
        <li><strong>Missing monochrome image.</strong> Android 13+ themed mode falls back to a generic square.</li>
      </ul>

      <h2>Generate the full set in one pass</h2>
      <p>
        AI App Icons outputs every asset an Expo project needs — iOS light,
        dark, and tinted; Android foreground, background, and monochrome —
        wired to the right <code>app.json</code> paths.{" "}
        <a href="/">Start a new chat</a> to try it.
      </p>
    </ContentPageShell>
  );
}

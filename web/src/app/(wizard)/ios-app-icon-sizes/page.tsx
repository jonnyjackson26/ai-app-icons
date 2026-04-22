import type { Metadata } from "next";
import ContentPageShell from "@/components/ContentPageShell";

export const metadata: Metadata = {
  title: "iOS App Icon Sizes: Complete 2026 Guide — AI App Icons",
  description:
    "Every iOS and iPadOS app icon size required by the App Store in 2026 — resolutions, filenames, and when each one is used.",
};

export default function IosAppIconSizesPage() {
  return (
    <ContentPageShell>
      <h1>iOS App Icon Sizes: Complete 2026 Guide</h1>
      <p>
        Apple&rsquo;s App Store demands a specific set of icon sizes for every
        iOS and iPadOS app. Ship the wrong dimensions and your build gets
        rejected at validation. Ship them right and the same square shows up
        everywhere the OS needs it — home screen, Spotlight, Settings,
        notifications, and the Store itself.
      </p>
      <p>
        This guide covers every size you need in 2026, what each one is used
        for, and how Xcode and Expo wire them up for you.
      </p>

      <h2>The marketing icon: 1024×1024</h2>
      <p>
        The App Store marketing icon is <code>1024×1024</code> at 1x. It is
        the one non-negotiable asset: you upload it to App Store Connect, and
        Apple re-renders it at every smaller size needed for the Store
        listing. It must be PNG, sRGB or P3, no alpha channel, and no rounded
        corners — iOS applies the mask itself.
      </p>

      <h2>Home screen and Spotlight</h2>
      <ul>
        <li><strong>iPhone app icon</strong> — 60×60 @2x (120×120) and @3x (180×180)</li>
        <li><strong>iPad app icon</strong> — 76×76 @2x (152×152)</li>
        <li><strong>iPad Pro app icon</strong> — 83.5×83.5 @2x (167×167)</li>
        <li><strong>Spotlight (iPhone &amp; iPad)</strong> — 40×40 @2x (80×80) and @3x (120×120)</li>
      </ul>

      <h2>Settings and notifications</h2>
      <ul>
        <li><strong>Settings icon</strong> — 29×29 @2x (58×58) and @3x (87×87)</li>
        <li><strong>Notification icon</strong> — 20×20 @2x (40×40) and @3x (60×60)</li>
      </ul>

      <h2>iOS 18+: dark and tinted variants</h2>
      <p>
        Starting with iOS 18, users can switch their home screen to Dark or
        Tinted icons. Apple will auto-generate these from your default icon,
        but the results are rarely flattering — edges disappear, colors
        flatten. For any app that cares about its brand, ship three
        <code>1024×1024</code> marketing icons:
      </p>
      <ul>
        <li><strong>Default (Any Appearance)</strong> — your main icon.</li>
        <li><strong>Dark</strong> — designed for dark backgrounds. Remove opaque background fills; iOS composites onto a translucent dark layer.</li>
        <li><strong>Tinted</strong> — a single-channel luminance map. Shapes that should stay visible need good contrast; decorative gradients vanish.</li>
      </ul>

      <h2>The 40-file headache (and what to do about it)</h2>
      <p>
        Historically you&rsquo;d export 20–40 PNG files and drop them into
        Xcode&rsquo;s AppIcon.appiconset. In practice, everyone now ships a
        single <code>1024×1024</code> marketing icon and lets the build tools
        resize it. Xcode 14+ accepts a single-size App Icon asset; Expo uses
        a single <code>icon.png</code> in <code>app.json</code>. Much less to
        get wrong.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li><strong>Alpha channel in the marketing icon.</strong> App Store Connect will reject it.</li>
        <li><strong>Pre-applied rounded corners.</strong> iOS masks icons itself; baking the mask in leaves a visible double-rounded edge.</li>
        <li><strong>Small text.</strong> At 58×58 in Settings, any word below ~6 characters becomes unreadable.</li>
        <li><strong>Color profiles that aren&rsquo;t sRGB or Display P3.</strong> Expect unexpected shifts on-device.</li>
      </ul>

      <h2>Generate all of them at once</h2>
      <p>
        AI App Icons produces the full iOS set (default, dark, and tinted)
        plus every required resolution from a single prompt or image.{" "}
        <a href="/">Start a new chat</a> to try it.
      </p>
    </ContentPageShell>
  );
}

import type { Metadata } from "next";
import ContentPageShell from "@/components/ContentPageShell";

export const metadata: Metadata = {
  title: "Android Adaptive Icons Explained — AI App Icons",
  description:
    "A practical guide to Android adaptive icons: foreground, background, and monochrome layers, the safe zone, and themed icons on Android 13+.",
};

export default function AndroidAdaptiveIconsPage() {
  return (
    <ContentPageShell>
      <h1>Android Adaptive Icons Explained</h1>
      <p>
        Android icons are not a single image. Since Android 8 (Oreo) the
        launcher renders your icon from <em>layers</em>, and the OEM decides
        the shape — circle, squircle, rounded square, teardrop. Ship the
        layers wrong and your logo looks pinched, cropped, or floating in
        dead space. Ship them right and your icon looks native on every
        device.
      </p>

      <h2>The three layers</h2>
      <ul>
        <li>
          <strong>Background</strong> — a full <code>108×108 dp</code>
          canvas. Solid color or simple pattern works best. This is what
          shows through the launcher&rsquo;s mask shape.
        </li>
        <li>
          <strong>Foreground</strong> — also <code>108×108 dp</code>. Your
          logo mark lives here. Only the center <code>72×72 dp</code> is
          guaranteed to stay visible — see &ldquo;safe zone&rdquo; below.
        </li>
        <li>
          <strong>Monochrome</strong> — a single-channel silhouette used for
          Android 13+ <em>themed icons</em>, where the launcher tints your
          icon to match the user&rsquo;s wallpaper. Optional but strongly
          recommended.
        </li>
      </ul>

      <h2>The safe zone — the single most important thing</h2>
      <p>
        Android reserves the outer ring of the canvas for launcher effects
        (parallax, zoom-on-press, mask clipping). Only the center{" "}
        <code>66×66 dp</code> circle — roughly the inner 62% — is guaranteed
        to be visible on every device and in every mask shape. Anything
        outside that will be clipped on some launchers.
      </p>
      <p>
        Practical rule: design your logo to fit comfortably inside a circle
        occupying the middle ~66% of the canvas. Leave generous padding.
      </p>

      <h2>Resolutions per density bucket</h2>
      <p>
        You ship adaptive icon layers as PNGs (or vector drawables) at each
        density bucket. The <code>dp</code> figures above translate to:
      </p>
      <ul>
        <li><strong>mdpi</strong> — 108×108 px</li>
        <li><strong>hdpi</strong> — 162×162 px</li>
        <li><strong>xhdpi</strong> — 216×216 px</li>
        <li><strong>xxhdpi</strong> — 324×324 px</li>
        <li><strong>xxxhdpi</strong> — 432×432 px</li>
      </ul>
      <p>
        Plus the <code>512×512</code> Play Store listing icon (32-bit PNG,
        no alpha, no rounded corners — Google Play masks it).
      </p>

      <h2>Themed icons on Android 13+</h2>
      <p>
        On Android 13 and later, users can enable themed icons globally. The
        launcher discards your background layer and tints the monochrome
        layer with colors derived from the current wallpaper. Two things to
        keep in mind when designing the monochrome layer:
      </p>
      <ul>
        <li>Use <strong>white on transparent</strong>. The alpha channel is the luminance map.</li>
        <li>
          Avoid fine detail. The tint is a flat fill — gradients, textures,
          and thin strokes collapse into mud. A bold silhouette reads well;
          a photographic logo does not.
        </li>
      </ul>

      <h2>Legacy fallback</h2>
      <p>
        Older Android versions (below 8.0) and some third-party launchers
        still use a flat <code>ic_launcher.png</code>. You should ship one
        alongside the adaptive layers at the same density buckets. Most
        tooling (including Expo) generates this automatically from your
        foreground + background.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li><strong>Logo too large.</strong> If it touches the edges of the 108 dp canvas, it will be cropped on circular masks.</li>
        <li><strong>Full-bleed background with detail at the edge.</strong> That detail gets clipped differently on each device. Keep backgrounds simple.</li>
        <li><strong>Rounded corners baked into the foreground.</strong> Let the launcher mask. Pre-rounding leaves a ragged edge.</li>
        <li><strong>No monochrome layer.</strong> Your icon falls back to a generic square on themed mode.</li>
      </ul>

      <h2>Generate a full adaptive set</h2>
      <p>
        AI App Icons outputs the full adaptive icon set — background,
        foreground, monochrome, and the legacy fallback — at every density
        from a single prompt.{" "}
        <a href="/">Start a new chat</a> to try it.
      </p>
    </ContentPageShell>
  );
}

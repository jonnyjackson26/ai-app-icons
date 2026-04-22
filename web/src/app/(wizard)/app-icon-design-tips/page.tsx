import type { Metadata } from "next";
import ContentPageShell from "@/components/ContentPageShell";

export const metadata: Metadata = {
  title: "App Icon Design: Best Practices & Common Mistakes — AI App Icons",
  description:
    "What makes a great app icon: principles that hold up across platforms, common mistakes to avoid, and how to test your icon before you ship.",
};

export default function AppIconDesignTipsPage() {
  return (
    <ContentPageShell>
      <h1>App Icon Design: Best Practices &amp; Common Mistakes</h1>
      <p>
        An app icon is the smallest piece of UI your product ships, and the
        one users see most often. It has to work at 58×58 next to thirty
        others in Settings, at 1024×1024 on the App Store, and at every size
        in between — on light and dark home screens, tinted home screens,
        themed launchers. This guide distills the principles that make icons
        survive all of that.
      </p>

      <h2>Principle 1: one recognizable shape</h2>
      <p>
        The best app icons are reducible to a single memorable silhouette.
        Think of the apps on your home screen right now — you can almost
        certainly draw the outline of each one from memory. Icons that try
        to say too much turn into visual noise at 58×58.
      </p>
      <p>
        A useful test: squint at your icon. Can you still tell what it is?
        If the answer is &ldquo;a vaguely colored square,&rdquo; simplify.
      </p>

      <h2>Principle 2: no text (or one letter, max)</h2>
      <p>
        At notification size (40×40), readable text is essentially
        impossible. Even your app&rsquo;s name becomes unreadable mush.
        Either use a single bold letter (as Gmail, X, and Medium do), use a
        mark, or use no text at all. Never write out the product name.
      </p>

      <h2>Principle 3: contrast, not color</h2>
      <p>
        App icons sit against wallpapers, light home screens, dark home
        screens, and tinted home screens. A brand color that looks great on
        your marketing site can disappear against half of those backgrounds.
        Design for <em>contrast</em> first — light foreground on dark
        background, or vice versa — and let color serve the contrast rather
        than fight it.
      </p>
      <p>
        Check your icon against pure white and pure black backgrounds. If it
        loses legibility in either, adjust.
      </p>

      <h2>Principle 4: centered and padded</h2>
      <p>
        Both iOS and Android apply their own masks to your icon. iOS uses a
        consistent squircle; Android launchers can pick any shape. Any part
        of your design in the outer ~15% of the canvas will be clipped on
        some devices. Design your mark to sit comfortably inside the center
        circle of the canvas, with padding on all sides.
      </p>

      <h2>Principle 5: no baked-in rounded corners</h2>
      <p>
        The OS applies the corner radius. If you pre-round your icon and
        then iOS applies its own squircle mask, you get a ragged
        double-rounded edge. Start with a full square and let the platform
        mask it.
      </p>

      <h2>Principle 6: design for all three iOS modes</h2>
      <p>
        Since iOS 18, users can set their home screen to Default, Dark, or
        Tinted. Auto-generated dark and tinted variants are mediocre at
        best. If you care about your brand, ship all three:
      </p>
      <ul>
        <li><strong>Default</strong> — your main icon, whatever the concept.</li>
        <li><strong>Dark</strong> — remove opaque background fills; iOS composites onto a translucent dark layer.</li>
        <li><strong>Tinted</strong> — a luminance map. Bold silhouettes survive; decorative detail disappears.</li>
      </ul>

      <h2>Common mistakes</h2>
      <ul>
        <li><strong>Photographs.</strong> A beautiful 4K photo becomes 40 unreadable pixels. Use illustration or iconography.</li>
        <li><strong>Gradients that collapse at small sizes.</strong> Test your icon at 40×40 — if the gradient looks muddy, simplify.</li>
        <li><strong>Skeuomorphic detail.</strong> Reflections, inner shadows, and 3D bevels that looked great in 2012 are clutter in 2026.</li>
        <li><strong>Trendy effects over brand.</strong> A neon gradient may look current this quarter; in two years it dates your app. Prefer timelessness.</li>
        <li><strong>Ignoring the Settings icon.</strong> Users judge your app by the tiny 58×58 in Settings too.</li>
      </ul>

      <h2>How to test an icon</h2>
      <ol>
        <li><strong>Home screen test.</strong> Drop it onto a real home screen alongside the user&rsquo;s actual apps. Does it hold up or disappear?</li>
        <li><strong>Size gauntlet.</strong> Render it at 1024, 180, 120, 80, 58, 40. Does it stay legible at every size?</li>
        <li><strong>Grayscale test.</strong> Convert to grayscale. If it relies entirely on color for differentiation, it fails accessibility and themed-mode rendering.</li>
        <li><strong>Blur test.</strong> Apply a slight blur. If you can still identify it, the silhouette is strong enough.</li>
      </ol>

      <h2>Let the AI do the iteration</h2>
      <p>
        Trying twenty icon concepts used to take a designer a week. With AI
        App Icons you can generate, critique, and refine in minutes —{" "}
        <a href="/">start a new chat</a> to try it.
      </p>
    </ContentPageShell>
  );
}

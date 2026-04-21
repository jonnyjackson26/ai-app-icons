#!/usr/bin/env node

/**
 * Renames this template to a new project. Run once after cloning:
 *   npm run setup
 *
 * Updates:
 *   - package.json (name)
 *   - app.config.ts (slug, scheme, app name, iOS/Android bundle IDs, Sentry project, EAS projectId)
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { spawnSync } = require("child_process");

const root = process.cwd();

// Minimal ANSI color helpers — no dependency, works in modern terminals.
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (color, s) => (useColor ? `${color}${s}${c.reset}` : s);
const ok = (msg) => console.log(`${paint(c.green, "✓")} ${msg}`);
const warn = (msg) => console.log(`${paint(c.yellow, "⚠")} ${msg}`);
const err = (msg) => console.error(`${paint(c.red, "✗")} ${msg}`);
const heading = (msg) => console.log(`\n${paint(c.bold + c.cyan, msg)}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) =>
  new Promise((resolve) => {
    rl.question(`${q}: `, (answer) => resolve(answer.trim()));
  });

// Asks with the default text pre-typed into the input line so the user can
// edit it or hit Enter to accept.
const askPrefilled = (q, prefill) =>
  new Promise((resolve) => {
    rl.question(`${q}: `, (answer) => resolve(answer.trim() || prefill));
    if (prefill) rl.write(prefill);
  });

const toSlug = (s) =>
  s
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

(async () => {
  try {
    heading("RNTemplate setup");

    const displayName = await ask(
      "Public-facing App name (e.g. 'My App')",
    );
    if (!displayName) {
      err("App name is required.");
      process.exit(1);
    }

    console.log(
      `\n${paint(c.dim, "Internal name is used for the npm package name, Expo slug, and the last segment of your bundle ID.")}`,
    );
    console.log(
      `${paint(c.dim, "Tip: avoid dashes — bundle IDs can't contain them, and it's nicer when the slug and bundle segment match.")}\n`,
    );
    const slug = await askPrefilled(
      "Internal app name (lowercase, no spaces)",
      toSlug(displayName).replace(/-/g, ""),
    );
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      err("Internal app name must be lowercase letters, numbers, and dashes only.");
      process.exit(1);
    }
    if (slug.includes("-")) {
      warn("Dashes will be stripped from the bundle ID segment (so slug and bundle segment will differ).");
    }

    console.log(
      `\n${paint(c.dim, "Bundle ID prefix is your reverse-DNS namespace. Use a domain you own, or 'com.<yourname>' if you don't have one.")}`,
    );
    console.log(
      `${paint(c.dim, "Find an existing one at https://developer.apple.com/account → Identifiers, or just invent one — it only has to be unique to you.")}\n`,
    );
    const bundlePrefix = await ask("Bundle ID prefix (e.g. com.yourname)");
    if (!bundlePrefix || !/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(bundlePrefix)) {
      err("Bundle ID prefix must be lowercase reverse-DNS like 'com.yourname' (letters/numbers, dot-separated).");
      process.exit(1);
    }

    const bundleSegment = slug.replace(/-/g, "");
    const bundleId = `${bundlePrefix}.${bundleSegment}`;

    heading("Will apply");
    console.log(`  display name: ${paint(c.bold, displayName)}`);
    console.log(`  slug:         ${paint(c.bold, slug)}`);
    console.log(`  bundle id:    ${paint(c.bold, bundleId)}`);
    console.log(`  dev bundle:   ${paint(c.bold, bundleId + ".dev")}`);

    const confirm = await ask(`\n${paint(c.cyan, "Proceed? (Y/n)")}`);
    if (confirm.toLowerCase() === "n") {
      console.log("Aborted.");
      process.exit(0);
    }

    // --- package.json ---
    const pkgPath = path.join(root, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.name = slug;
    if (pkg.scripts && pkg.scripts.setup) delete pkg.scripts.setup;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    ok("updated package.json (removed setup script entry)");

    // --- app.config.ts ---
    const cfgPath = path.join(root, "app.config.ts");
    let cfg = fs.readFileSync(cfgPath, "utf8");

    // Bundle IDs (most specific first — dev is a superstring of prod)
    cfg = cfg.replace(
      '"com.jrsjackson26.rntemplate.dev"',
      `"${bundleId}.dev"`,
    );
    cfg = cfg.replace('"com.jrsjackson26.rntemplate"', `"${bundleId}"`);

    // Display name (dev variant first so it doesn't get partially overwritten)
    cfg = cfg.replace(
      '"rntemplate (Dev)"',
      `"${displayName} (Dev)"`,
    );

    // Scheme dev variant
    cfg = cfg.replace('"rntemplate-dev"', `"${slug}-dev"`);

    // getAppName prod return — must update before bare "rntemplate" sweep
    cfg = cfg.replace('return "rntemplate";', `return "${displayName}";`);

    // Remaining bare "rntemplate" tokens: slug, scheme prod, sentry project
    cfg = cfg.replaceAll('"rntemplate"', `"${slug}"`);

    // Clear EAS projectId so `eas init` provisions a fresh one
    cfg = cfg.replace(/projectId: "[^"]*"/, 'projectId: ""');

    fs.writeFileSync(cfgPath, cfg);
    ok("updated app.config.ts");

    // --- .env.local ---
    const envExamplePath = path.join(root, ".env.example");
    const envLocalPath = path.join(root, ".env.local");
    if (fs.existsSync(envLocalPath)) {
      warn(".env.local already exists — left untouched (existing keys preserved)");
    } else if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envLocalPath);
      ok("copied .env.example → .env.local");
    } else {
      warn(".env.example not found — skipped creating .env.local");
    }

    // --- self-destruct ---
    // Node loads the script into memory at startup and doesn't hold a file lock
    // during execution, so it's safe to unlink ourselves on all platforms.
    // Close readline first so the process can exit cleanly after npm install.
    rl.close();
    const scriptDir = path.dirname(__filename);
    try {
      fs.unlinkSync(__filename);
      ok("removed scripts/setup.js");
    } catch (e) {
      warn(`could not remove ${__filename}: ${e.message} (delete it manually)`);
    }
    // Remove the scripts/ directory if it's now empty. rmdirSync errors if
    // it isn't, which is exactly what we want — leaves any future scripts alone.
    try {
      fs.rmdirSync(scriptDir);
      ok("removed empty scripts/ directory");
    } catch {
      // Not empty (or already gone) — leave it.
    }

    // --- npm install ---
    heading("Running npm install...");
    console.log();
    // Windows can't directly spawn .cmd shims like npm.cmd without going
    // through the shell, so use shell: true on Windows. This also lets npm's
    // own colored output flow through naturally via stdio: "inherit".
    const isWindows = process.platform === "win32";
    const result = spawnSync("npm", ["install"], {
      stdio: "inherit",
      cwd: root,
      shell: isWindows,
    });
    if (result.error) {
      err(`failed to launch npm: ${result.error.message}`);
      console.log("  Run 'npm install' manually.");
      process.exit(1);
    }
    if (result.status !== 0) {
      err(`npm install exited with code ${result.status}. Run it manually.`);
      process.exit(result.status || 1);
    }
    heading("Setup complete.");
  } catch (e) {
    err(`Setup failed: ${e.message}`);
    rl.close();
    process.exit(1);
  }
})();

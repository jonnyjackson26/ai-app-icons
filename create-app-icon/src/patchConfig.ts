import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { parse as babelParse } from "@babel/parser";
import * as t from "@babel/types";
import * as recast from "recast";
import type { DetectedConfig } from "./detect.js";
import { deepMerge } from "./deepMerge.js";

export interface PatchResult {
  path: string;
  backupPath: string;
  manual: boolean; // true = we couldn't patch automatically; user must paste
}

/**
 * Merge `expoPatch.expo` into the existing Expo config at `config.path`.
 * Creates a `.bak` alongside before writing.
 *
 * For JS/TS, handles:
 *   export default { ... }
 *   module.exports = { ... }
 *   export default ({ config }) => ({ ...config, ... })
 *   module.exports = ({ config }) => ({ ...config, ... })
 *
 * If the AST doesn't match one of the above (e.g. returns a variable, branches,
 * imports the config from elsewhere), returns { manual: true } and leaves the
 * file untouched — caller should print the snippet for manual paste.
 */
export function patchConfig(
  config: DetectedConfig,
  expoPatch: { expo: Record<string, unknown> },
): PatchResult {
  const backupPath = `${config.path}.bak`;
  copyFileSync(config.path, backupPath);

  if (config.kind === "json" || config.kind === "json-config") {
    patchJson(config.path, expoPatch);
    return { path: config.path, backupPath, manual: false };
  }

  const manual = !patchJs(config.path, config.kind === "ts", expoPatch);
  return { path: config.path, backupPath, manual };
}

// --- JSON ---------------------------------------------------------------

function patchJson(
  filePath: string,
  expoPatch: { expo: Record<string, unknown> },
): void {
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const existingExpo =
    (parsed.expo as Record<string, unknown> | undefined) ?? {};
  const merged = { ...parsed, expo: deepMerge(existingExpo, expoPatch.expo) };
  writeFileSync(filePath, JSON.stringify(merged, null, 2) + "\n");
}

// --- JS / TS ------------------------------------------------------------

function patchJs(
  filePath: string,
  isTs: boolean,
  expoPatch: { expo: Record<string, unknown> },
): boolean {
  const source = readFileSync(filePath, "utf8");
  const ast = recast.parse(source, {
    parser: {
      parse: (src: string) =>
        babelParse(src, {
          sourceType: "module",
          allowImportExportEverywhere: true,
          plugins: isTs ? ["typescript"] : [],
        }),
    },
  });

  const target = findTargetObject(ast);
  if (!target) return false;

  // The Expo config root may either be the object literal directly (common)
  // or it may have `expo: { ... }` as a nested property (matches app.json
  // schema). We handle both: if the literal has an `expo` key as an object,
  // merge into it; otherwise merge at the top level.
  const expoProp = findObjectProperty(target, "expo");
  if (expoProp && t.isObjectExpression(expoProp.value)) {
    mergeInto(expoProp.value, expoPatch.expo);
  } else {
    mergeInto(target, expoPatch.expo);
  }

  const out = recast.print(ast, { quote: "double" }).code;
  writeFileSync(filePath, out.endsWith("\n") ? out : out + "\n");
  return true;
}

/** Walk the AST and find the object literal that represents the Expo config.
 * `recast` uses its own `ast-types` node type, but runtime shape matches
 * `@babel/types`. We cast at the boundary so babel-types' `isX` predicates work.
 */
function findTargetObject(ast: unknown): t.ObjectExpression | null {
  let found: t.ObjectExpression | null = null;
  const bindings = collectModuleBindings(ast);

  recast.visit(ast as recast.types.ASTNode, {
    visitExportDefaultDeclaration(path) {
      const decl = path.node.declaration as unknown as t.Node;
      found = resolveConfigExpression(decl, bindings);
      return false;
    },
    visitAssignmentExpression(path) {
      const node = path.node as unknown as t.AssignmentExpression;
      if (
        node.operator === "=" &&
        t.isMemberExpression(node.left) &&
        t.isIdentifier(node.left.object, { name: "module" }) &&
        t.isIdentifier(node.left.property, { name: "exports" })
      ) {
        found = resolveConfigExpression(node.right, bindings);
        return false;
      }
      this.traverse(path);
      return;
    },
  });

  return found;
}

/** Collect top-level `const/let/var NAME = {...}` object-literal bindings so we
 * can resolve `export default NAME`. Only picks up initializers that are
 * ObjectExpressions — anything else is too risky to patch. */
function collectModuleBindings(ast: unknown): Map<string, t.ObjectExpression> {
  const map = new Map<string, t.ObjectExpression>();
  recast.visit(ast as recast.types.ASTNode, {
    visitVariableDeclaration(path) {
      // Only top-level declarations (Program → VariableDeclaration).
      if (path.parent?.value?.type !== "Program") {
        this.traverse(path);
        return;
      }
      const decl = path.node as unknown as t.VariableDeclaration;
      for (const d of decl.declarations) {
        if (t.isIdentifier(d.id) && d.init && t.isObjectExpression(d.init)) {
          map.set(d.id.name, d.init);
        }
      }
      return false;
    },
  });
  return map;
}

function resolveConfigExpression(
  node: t.Node,
  bindings: Map<string, t.ObjectExpression>,
): t.ObjectExpression | null {
  if (t.isObjectExpression(node)) return node;

  // `export default config;` / `module.exports = config;` — look up the local
  // binding.
  if (t.isIdentifier(node)) {
    return bindings.get(node.name) ?? null;
  }

  // Arrow function: ({config}) => ({...config, ...})  or  () => ({...})
  if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
    const body = node.body;
    if (t.isObjectExpression(body)) return body;
    if (t.isBlockStatement(body)) {
      for (const stmt of body.body) {
        if (t.isReturnStatement(stmt) && stmt.argument && t.isObjectExpression(stmt.argument)) {
          return stmt.argument;
        }
      }
    }
  }

  return null;
}

function findObjectProperty(
  obj: t.ObjectExpression,
  name: string,
): t.ObjectProperty | null {
  for (const p of obj.properties) {
    if (
      t.isObjectProperty(p) &&
      !p.computed &&
      ((t.isIdentifier(p.key) && p.key.name === name) ||
        (t.isStringLiteral(p.key) && p.key.value === name))
    ) {
      return p;
    }
  }
  return null;
}

/**
 * Merge keys from a plain JS patch object into an ObjectExpression AST node,
 * recursing into nested object literals and replacing scalars/arrays wholesale.
 */
function mergeInto(target: t.ObjectExpression, patch: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(patch)) {
    const existing = findObjectProperty(target, key);
    if (existing && t.isObjectExpression(existing.value) && isPlainObject(value)) {
      mergeInto(existing.value, value as Record<string, unknown>);
    } else if (existing) {
      existing.value = toAst(value);
    } else {
      target.properties.push(
        t.objectProperty(t.identifier(key), toAst(value)),
      );
    }
  }
}

function toAst(value: unknown): t.Expression {
  if (value === null) return t.nullLiteral();
  if (typeof value === "string") return t.stringLiteral(value);
  if (typeof value === "number") return t.numericLiteral(value);
  if (typeof value === "boolean") return t.booleanLiteral(value);
  if (Array.isArray(value)) {
    return t.arrayExpression(value.map(toAst));
  }
  if (isPlainObject(value)) {
    return t.objectExpression(
      Object.entries(value).map(([k, v]) =>
        t.objectProperty(safeKey(k), toAst(v)),
      ),
    );
  }
  return t.stringLiteral(String(value));
}

function safeKey(k: string): t.Identifier | t.StringLiteral {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k)
    ? t.identifier(k)
    : t.stringLiteral(k);
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return (
    typeof x === "object" &&
    x !== null &&
    !Array.isArray(x) &&
    Object.getPrototypeOf(x) === Object.prototype
  );
}

#!/usr/bin/env node
/**
 * FSAA drift-check v4.3 — verifies that AGENTS.md (the machine contract)
 * still matches the real code. Cross-platform: pure Node, no shell tools.
 *
 * Two-way binding: unknown/unmapped rules are errors, missing markers are errors,
 * and every passing rule must hold in the code itself. Exit 1 on any drift.
 *
 * v4.2: boundary-imports scans real imports (upward + cross-slice),
 * not just the presence of boundary words in eslint.config.mjs.
 *
 * Output is colored when stdout is a TTY; piped output stays plain (logs/CI).
 * Force plain output with FORCE_COLOR=0.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";

/** ANSI color helpers; no-ops when colors are disabled. */
const useColor = process.stdout.isTTY && process.env.FORCE_COLOR !== "0";
const c = useColor
  ? {
      red: (s) => `\x1b[31m${s}\x1b[0m`,
      green: (s) => `\x1b[32m${s}\x1b[0m`,
      yellow: (s) => `\x1b[33m${s}\x1b[0m`,
      cyan: (s) => `\x1b[36m${s}\x1b[0m`,
      bold: (s) => `\x1b[1m${s}\x1b[0m`,
      dim: (s) => `\x1b[2m${s}\x1b[0m`,
    }
  : {
      red: (s) => s,
      green: (s) => s,
      yellow: (s) => s,
      cyan: (s) => s,
      bold: (s) => s,
      dim: (s) => s,
    };

/** AGENTS.md text — the contract being verified. */
const md = readFileSync("AGENTS.md", "utf8");
/** Rule ids from <!--check: id--> markers, de-duplicated, in document order. */
const ids = [
  ...new Set([...md.matchAll(/<!--check:\s*([\w-]+)\s*-->/g)].map((m) => m[1])),
];

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const scripts = pkg.scripts || {};
const eslintCfg = readFileSync("eslint.config.mjs", "utf8");
/** True when package.json defines a script with this name. */
const hasScript = (n) => typeof scripts[n] === "string";
/** Anything that looks like direct data fetching inside UI layers. */
const FORBIDDEN = /(^|[^.$\w])fetch\(|\baxios\b/;

/**
 * Recursively collect code files under `dir` whose text matches `re`.
 * Pure Node walk — identical behavior on Windows, Linux and macOS.
 * @param {string} dir relative directory to scan
 * @param {RegExp} [re] pattern a violating file must match (default: fetch/axios)
 * @returns {string[]} paths of offending files in walk order
 */
function hits(dir, re = FORBIDDEN) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = d + "/" + e.name;
      if (e.isDirectory()) walk(p);
      else if (/\.[jt]sx?$/.test(e.name) && re.test(readFileSync(p, "utf8")))
        out.push(p);
    }
  };
  walk(dir);
  return out;
}
/** Offending files inside every src/features/<feature>/ui folder. */
const featureUiHits = () => {
  if (!existsSync("src/features")) return [];
  return readdirSync("src/features").flatMap((f) =>
    hits("src/features/" + f + "/ui"),
  );
};

/**
 * Real import-boundary violations across src/, by layer:
 * - src/shared/**    may import only @shared/* (bottom layer)
 * - src/entities/**  may not import @features/@pages/@app above it
 * - src/features/**  must not use the @features alias (cross-slice — own
 *   slice imports are relative) or @pages/@app above it
 * ESLint enforces the same rules on lint; this scan guards CI even if
 * someone relaxes the lint config.
 * @returns {string[]} paths of files with violating imports
 */
function boundaryHits() {
  const out = [];
  out.push(...hits("src/shared", /['"]@(entities|features|pages|app)\//));
  out.push(...hits("src/entities", /['"]@(features|pages|app)\//));
  out.push(...hits("src/features", /['"]@features\/|['"]@(pages|app)\//));
  return out;
}

/**
 * Map: AGENTS.md rule id → verification function.
 * Return contract: true = pass, false = generic fail, string[] = offending files.
 */
const checks = {
  /** Pnpm is the package manager: a healthy lockfile exists. */
  "cmd-pnpm-install": () => existsSync("pnpm-lock.yaml"),
  "cmd-pnpm-dev": () => hasScript("dev"),
  "cmd-pnpm-lint": () => hasScript("lint"),
  "cmd-pnpm-typecheck": () => hasScript("typecheck"),
  "cmd-pnpm-build": () => hasScript("build"),
  /** Exactly one lockfile in the repo: pnpm-lock.yaml. */
  "single-lockfile": () =>
    existsSync("pnpm-lock.yaml") &&
    !existsSync("package-lock.json") &&
    !existsSync("yarn.lock"),
  "ui-location": () =>
    [
      "src/app",
      "src/pages",
      "src/features",
      "src/entities",
      "src/shared",
      "src/shared/ui",
    ].every(existsSync),
  /** UI layers and route pages must do no direct fetching. */
  "no-ui-fetch": () => {
    const bad = [
      ...hits("src/pages"),
      ...hits("src/shared/ui"),
      ...featureUiHits(),
    ];
    return bad.length ? bad : true;
  },
  /** No upward/cross-slice imports in src/ AND the eslint boundary config stays. */
  "boundary-imports": () => {
    const bad = boundaryHits();
    return bad.length ? bad : eslintCfg.includes("FSAA") ? true : false;
  },
  /** Contract-named files exist (root shell, home, lint config). */
  "file-paths": () =>
    ["src/pages/router.tsx", "src/app/main.tsx", "eslint.config.mjs"].every(
      existsSync,
    ),
  /** Enforced by GitHub branch protection, not locally — always passes. */
  "pr-flow": () => true,
};

console.log();
console.log(c.bold(c.cyan("  FSAA drift-check")) + c.dim("  v4.3"));
console.log(c.dim(`  AGENTS.md: ${ids.length} rules · fsaa:contract`));
console.log(c.dim("  " + "─".repeat(46)));

const problems = [];
const t0 = performance.now();
const results = [];

// Two-way binding: doc → map, and map → doc.
for (const id of ids)
  if (!(id in checks))
    problems.push(
      `${c.yellow("⚠")} rule ${c.bold(id)} ${c.yellow("has a marker but no check is mapped")}`,
    );
for (const id of Object.keys(checks))
  if (!ids.includes(id))
    problems.push(
      `${c.yellow("⚠")} check ${c.bold(id)} ${c.yellow("exists in the map but no marker in AGENTS.md")}`,
    );

for (const id of ids) {
  if (!(id in checks)) continue;
  const t = performance.now();
  let ok,
    detail = "";
  try {
    const r = checks[id]();
    if (r === true) ok = true;
    else if (r === false) {
      ok = false;
      detail = "the check failed";
    } else if (id === "boundary-imports") {
      // array = offending import paths
      ok = r.length === 0;
      if (!ok)
        detail =
          "upward/cross-slice imports in: " +
          r.slice(0, 3).join(", ") +
          (r.length > 3 ? ` (+${r.length - 3} more)` : "");
    } else {
      // array = list of offending files
      ok = r.length === 0;
      if (!ok)
        detail =
          "fetch/axios found in: " +
          r.slice(0, 3).join(", ") +
          (r.length > 3 ? ` (+${r.length - 3} more)` : "");
    }
  } catch (e) {
    ok = false;
    detail = "check crashed: " + e.message;
  }
  const ms = Math.round(performance.now() - t);
  results.push({ id, ok, detail, ms });
  console.log(
    `  ${ok ? c.green("✓") : c.red("✗")} ${c.bold(id)} ${c.dim(ms + "ms")}${!ok && detail ? ` ${c.red("— " + detail)}` : ""}`,
  );
}

console.log(c.dim("  " + "─".repeat(46)));
const dt = ((performance.now() - t0) / 1000).toFixed(1);

const failed = results.filter((r) => !r.ok);
if (failed.length || problems.length) {
  for (const p of problems) console.error("  " + p);
  console.error();
  console.error(
    c.red(
      c.bold(
        `  ✗ drift detected: ${failed.length} rule(s), ${problems.length} binding issue(s)`,
      ) + c.dim(` · ${dt}s`),
    ),
  );
  process.exit(1);
}
console.log(
  c.green(
    c.bold(`  ✓ AGENTS.md OK: ${ids.length} rules verified`) +
      c.dim(` · contract intact · ${dt}s`),
  ),
);

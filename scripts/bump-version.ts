#!/usr/bin/env bun
/**
 * Sets the app version everywhere it is written down.
 *
 *   bun run bump patch          0.3.0 -> 0.3.1
 *   bun run bump minor          0.3.0 -> 0.4.0
 *   bun run bump major          0.3.0 -> 1.0.0
 *   bun run bump 0.5.2          explicit version
 *   bun run bump                print the current version of every file
 *
 * Add --commit to commit the change as "Bump version to X", and --tag to also
 * create a vX tag.
 *
 * package.json is the source of truth: tauri.conf.json points at it, and the
 * Settings screen reads it back through getVersion().
 */
import { $ } from "bun";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const CRATE_NAME = "RiseByDay";

type Target = {
  file: string;
  read: (src: string) => string | undefined;
  write: (src: string, version: string) => string;
};

const TARGETS: Target[] = [
  {
    file: "package.json",
    read: (src) => JSON.parse(src).version,
    write: (src, v) => src.replace(/("version":\s*")[^"]*(")/, `$1${v}$2`),
  },
  {
    file: "package-lock.json",
    read: (src) => JSON.parse(src).version,
    write: (src, v) => {
      const lock = JSON.parse(src);
      lock.version = v;
      if (lock.packages?.[""]) lock.packages[""].version = v;
      return JSON.stringify(lock, null, 2) + "\n";
    },
  },
  {
    file: "src-tauri/Cargo.toml",
    read: (src) => src.match(/^\[package\][^[]*?^version = "([^"]*)"/m)?.[1],
    write: (src, v) =>
      src.replace(/^(\[package\][^[]*?^version = ")[^"]*(")/m, `$1${v}$2`),
  },
  {
    file: "src-tauri/Cargo.lock",
    read: (src) =>
      src.match(new RegExp(`name = "${CRATE_NAME}"\\nversion = "([^"]*)"`))?.[1],
    write: (src, v) =>
      src.replace(
        new RegExp(`(name = "${CRATE_NAME}"\\nversion = ")[^"]*(")`),
        `$1${v}$2`,
      ),
  },
];

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

function nextVersion(current: string, arg: string): string {
  if (SEMVER.test(arg)) return arg;
  const [major, minor, patch] = current.split("-")[0].split(".").map(Number);
  switch (arg) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      fail(`"${arg}" is not major, minor, patch or a version like 1.2.3`);
  }
}

function fail(message: string): never {
  console.error(`bump: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const commit = args.includes("--commit") || args.includes("--tag");
const tag = args.includes("--tag");
const bump = args.find((a) => !a.startsWith("--"));

const files = TARGETS.map((t) => {
  const path = join(ROOT, t.file);
  const src = readFileSync(path, "utf8");
  const version = t.read(src);
  if (!version) fail(`could not find a version in ${t.file}`);
  return { ...t, path, src, version };
});

if (!bump) {
  for (const f of files) console.log(`${f.version.padEnd(10)} ${f.file}`);
  process.exit(0);
}

const current = files[0].version;
const version = nextVersion(current, bump);

for (const f of files) {
  const out = f.write(f.src, version);
  if (f.read(out) !== version) fail(`failed to update ${f.file}`);
  writeFileSync(f.path, out);
  console.log(`${f.file}: ${f.version} -> ${version}`);
}

if (commit) {
  await $`git -C ${ROOT} add ${files.map((f) => f.path)}`;
  await $`git -C ${ROOT} commit -m ${`Bump version to ${version}`}`;
  if (tag) await $`git -C ${ROOT} tag v${version}`;
}

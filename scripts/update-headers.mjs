#!/usr/bin/env node
// Syncs src/init/c/contracts/include with hook/*.h on the xahaud release branch.
// `--check` only reports differences and exits 1 if the bundled headers are stale.
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = "Xahau/xahaud";
const BRANCH = "release";
const INCLUDE_DIR = new URL("../src/init/c/contracts/include/", import.meta.url)
  .pathname;
const check = process.argv.includes("--check");

const headers = {
  Accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN && {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  }),
};
const res = await fetch(
  `https://api.github.com/repos/${REPO}/contents/hook?ref=${BRANCH}`,
  { headers }
);
if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
const entries = (await res.json()).filter(
  (e) => e.type === "file" && e.name.endsWith(".h")
);

const remote = {};
for (const e of entries) {
  const r = await fetch(e.download_url);
  if (!r.ok) throw new Error(`${e.download_url}: ${r.status}`);
  remote[e.name] = await r.text();
}

const local = Object.fromEntries(
  readdirSync(INCLUDE_DIR)
    .filter((f) => f.endsWith(".h"))
    .map((f) => [f, readFileSync(join(INCLUDE_DIR, f), "utf-8")])
);
const stale = [...new Set([...Object.keys(remote), ...Object.keys(local)])]
  .filter((f) => remote[f] !== local[f])
  .sort();

if (stale.length === 0) {
  console.log(`Headers are up to date with ${REPO}@${BRANCH}.`);
} else if (check) {
  console.error(
    `Headers differ from ${REPO}@${BRANCH}: ${stale.join(
      ", "
    )}\nRun: yarn headers:update`
  );
  process.exit(1);
} else {
  for (const f of stale) {
    if (remote[f] === undefined) rmSync(join(INCLUDE_DIR, f));
    else writeFileSync(join(INCLUDE_DIR, f), remote[f]);
    console.log(`${remote[f] === undefined ? "removed" : "updated"} ${f}`);
  }
}

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";
import { buildCDir } from "../../src/c2wasm";

describe("C directory builds", () => {
  const bundledInclude = path.join(
    __dirname,
    "..",
    "..",
    "src",
    "init",
    "c",
    "contracts",
    "include"
  );
  const projectDir = path.join(process.cwd(), "test-c-build-project");
  const contractsDir = path.join(projectDir, "contracts");
  const includeDir = path.join(contractsDir, "include");
  const outDir = path.join(projectDir, "build");

  beforeEach(() => {
    fs.mkdirSync(includeDir, { recursive: true });
    fs.cpSync(bundledInclude, includeDir, { recursive: true });
    fs.writeFileSync(
      path.join(contractsDir, "base.c"),
      '#include "hookapi.h"\nint64_t hook(uint32_t r){ _g(1,1); return accept(SBUF("ok"), 0); }\n'
    );
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it("does not compile headers found below the source directory", async () => {
    await buildCDir(contractsDir, outDir, includeDir);
    assert.deepEqual(fs.readdirSync(outDir), ["base.wasm"]);
  });

  it("finds headers in subdirectories by basename", async () => {
    fs.mkdirSync(path.join(includeDir, "sub"));
    fs.renameSync(
      path.join(includeDir, "macro.h"),
      path.join(includeDir, "sub", "macro.h")
    );
    await buildCDir(contractsDir, outDir, includeDir);
    assert.deepEqual(fs.readdirSync(outDir), ["base.wasm"]);
  });
});

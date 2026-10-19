import {
  describe,
  it,
  before,
  after,
  beforeEach,
  afterEach,
  mock,
} from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";
import { compileCCommand } from "../../src/commands";

describe("Build Tests", () => {
  const inPathC = path.join(process.cwd(), "contracts-c", "base.c");
  const outDir = path.join(process.cwd(), "build");
  const clean = () => fs.rmSync(outDir, { recursive: true, force: true });
  let exit: ReturnType<typeof mock.method>;
  let error: ReturnType<typeof mock.method>;

  before(() => {
    mock.method(console, "log", () => undefined);
    error = mock.method(console, "error", () => undefined);
    exit = mock.method(process, "exit", () => {
      throw Error("Process exit called");
    });
  });
  after(() => mock.restoreAll());
  beforeEach(() => {
    clean();
    exit.mock.resetCalls();
    error.mock.resetCalls();
  });
  afterEach(clean);

  it("should compile a C file to Wasm", async () => {
    await compileCCommand(inPathC, outDir);
    assert.equal(fs.statSync(path.join(outDir, "base.wasm")).size, 197);
  });

  it("should handle missing input path error", async () => {
    await assert.rejects(compileCCommand("", outDir));
    assert.deepEqual(exit.mock.calls[0].arguments, [1]);
    assert.deepEqual(error.mock.calls[0].arguments, [
      "Input path is required.",
    ]);
  });

  it("should handle missing output directory error", async () => {
    await assert.rejects(compileCCommand(inPathC, ""));
    assert.deepEqual(exit.mock.calls[0].arguments, [1]);
    assert.deepEqual(error.mock.calls[0].arguments, [
      "Output directory path is required.",
    ]);
  });
});

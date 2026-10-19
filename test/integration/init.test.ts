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
import axios from "axios";
import { configDotenv } from "dotenv";
import { initCommand } from "../../src/commands";

describe("Init Tests", () => {
  const folderName = "test-c-project";
  const projectPath = path.join(process.cwd(), folderName);
  const templatePath = path.join(__dirname, "..", "..", "src", "init", "c");
  let exit: ReturnType<typeof mock.method>;
  let error: ReturnType<typeof mock.method>;
  const clean = () => fs.rmSync(projectPath, { recursive: true, force: true });

  before(() => {
    mock.method(console, "log", () => undefined);
    error = mock.method(console, "error", () => undefined);
    exit = mock.method(process, "exit", () => {
      throw Error("Process exit called");
    });
    mock.method(axios, "post", async () => ({
      data: { code: "tesSUCCESS", secret: "ss8Smfd73swruz4LATV5xkmydjZd6" },
    }));
  });
  after(() => mock.restoreAll());
  beforeEach(() => {
    clean();
    exit.mock.resetCalls();
    error.mock.resetCalls();
  });
  afterEach(clean);

  it("should initialize a new C project", async () => {
    await initCommand("c", folderName);

    const envFilePath = path.join(projectPath, ".env");
    const env = configDotenv({ path: envFilePath }).parsed;
    const originalEnv = configDotenv({
      path: path.join(templatePath, ".env"),
    }).parsed;
    assert.equal(env?.HOOKS_COMPILE_HOST, undefined);
    for (const key of ["HOOKS_DEBUG_HOST", "XAHAU_ENV", "XRPLD_WSS"]) {
      assert.ok(env?.[key]);
      assert.equal(env[key], originalEnv?.[key]);
    }
    assert.equal(env?.ALICE_SEED, "ss8Smfd73swruz4LATV5xkmydjZd6");

    const bundled = path.join(templatePath, "contracts", "include");
    const includePath = path.join(projectPath, "contracts", "include");
    const names = fs.readdirSync(includePath).sort();
    assert.deepEqual(names, [
      "error.h",
      "extern.h",
      "hookapi.h",
      "macro.h",
      "sfcodes.h",
      "tts.h",
    ]);
    for (const name of names) {
      assert.equal(
        fs.readFileSync(path.join(includePath, name), "utf-8"),
        fs.readFileSync(path.join(bundled, name), "utf-8")
      );
    }

    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectPath, "package.json"), "utf-8")
    );
    assert.equal(
      pkg.scripts.build,
      "hooks-cli compile-c contracts build/ --headers contracts/include"
    );
    assert.equal(pkg.scripts.deploy, "npm run build && tsx src/index.ts");
  });

  it("should handle existing directory error", async () => {
    fs.mkdirSync(projectPath, { recursive: true });
    await assert.rejects(initCommand("c", folderName));
    assert.deepEqual(exit.mock.calls[0].arguments, [1]);
    assert.deepEqual(error.mock.calls[0].arguments, [
      `Directory ${folderName} already exists.`,
    ]);
  });

  for (const packageManager of ["npm", "yarn", "pnpm"]) {
    it(`should rewrite the deploy script to use ${packageManager}`, async () => {
      await initCommand("c", folderName, { packageManager });
      const pkg = JSON.parse(
        fs.readFileSync(path.join(projectPath, "package.json"), "utf-8")
      );
      assert.equal(
        pkg.scripts.deploy,
        `${packageManager} run build && tsx src/index.ts`
      );
    });
  }

  it("should reject an unsupported package manager", async () => {
    await assert.rejects(
      initCommand("c", folderName, { packageManager: "bun" })
    );
    assert.deepEqual(exit.mock.calls[0].arguments, [1]);
    assert.deepEqual(error.mock.calls[0].arguments, [
      'Invalid package manager "bun". Use one of: npm, yarn, pnpm.',
    ]);
    assert.equal(fs.existsSync(projectPath), false);
  });
});

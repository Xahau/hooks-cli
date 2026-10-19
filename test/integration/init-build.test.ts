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
import { initCommand } from "../../src/commands";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import axios from "axios";

// These tests exercise the actual `<pm> install` / `<pm> run build` flow of a
// freshly generated project for each supported package manager (as an end
// user would run them), so they need real network access to the npm
// registry and a longer timeout than the other integration tests.
describe("Init project install/build", () => {
  const repoRoot = path.join(__dirname, "..", "..");
  const cliEntry = path.join(repoRoot, "dist", "npm", "src", "cli.js");
  const cliBin = path.join(repoRoot, "bin", "cli.js");

  before(() => {
    mock.method(console, "log", () => undefined);
    mock.method(console, "error", () => undefined);
    mock.method(axios, "post", async () => ({
      data: { code: "tesSUCCESS", secret: "ss8Smfd73swruz4LATV5xkmydjZd6" },
    }));

    // The generated project's `build` script shells out to the `hooks-cli`
    // binary, which requires this repo to already be built.
    if (!fs.existsSync(cliEntry)) {
      execFileSync("yarn", ["run", "build"], {
        cwd: repoRoot,
        stdio: "inherit",
      });
    }
  });

  after(() => mock.restoreAll());

  const runInProject = (
    projectDir: string,
    packageManager: string,
    args: string[]
  ) =>
    execFileSync(packageManager, args, {
      cwd: projectDir,
      stdio: "pipe",
    });

  for (const packageManager of ["npm", "yarn", "pnpm"]) {
    describe(`c project (${packageManager})`, () => {
      const type = "c";
      const folderName = `e2e-init-build-${type}-${packageManager}-project`;
      // Generated deliberately outside the repo tree (rather than e.g. a
      // subdirectory of repoRoot): initCommand's copyFiles gives the project
      // its own node_modules, but Node's require() resolution still walks up
      // through ancestor node_modules directories. If the project lived under
      // repoRoot, a package missing from the project's own install could
      // silently resolve from this repo's node_modules instead of failing
      // (verified: repoRoot has several deps, e.g. dotenv, in common with the
      // templates), masking a bug a real, non-nested user project would hit.
      let tmpBase: string;
      let projectPath: string;

      beforeEach(() => {
        tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "hooks-cli-init-"));
        projectPath = path.join(tmpBase, folderName);
      });

      afterEach(() => {
        fs.rmSync(tmpBase, { recursive: true, force: true });
      });

      it(
        "installs and builds successfully",
        { timeout: 5 * 60 * 1000 },
        async () => {
          // initCommand resolves the target directory from process.cwd(), so
          // point it at tmpBase just for this call.
          const originalCwd = process.cwd();
          process.chdir(tmpBase);
          try {
            await initCommand(type, folderName, {
              packageManager,
            });
          } finally {
            process.chdir(originalCwd);
          }
          assert.ok(fs.existsSync(projectPath));

          try {
            runInProject(projectPath, packageManager, ["install"]);
            // The install pulls the published @xahau/hooks-cli; point the
            // project's `hooks-cli` bin at this repo's build instead.
            fs.writeFileSync(
              path.join(projectPath, "node_modules", ".bin", "hooks-cli"),
              `#!/bin/sh\nexec node "${cliBin}" "$@"\n`,
              { mode: 0o755 }
            );
            runInProject(projectPath, packageManager, ["run", "build"]);
          } catch (error: unknown) {
            const err = error as { stdout?: Buffer; stderr?: Buffer };
            throw new Error(
              `${packageManager} install/build failed for ${type} project:\n${err.stdout?.toString()}\n${err.stderr?.toString()}`
            );
          }

          const buildDir = path.join(projectPath, "build");
          assert.ok(fs.existsSync(buildDir));
          assert.ok(fs.readdirSync(buildDir).length > 0);
        }
      );
    });
  }
});
